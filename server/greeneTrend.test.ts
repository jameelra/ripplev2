import { describe, expect, it } from "vitest";
import {
  computeGreeneTrendSummary,
  describeGreeneChange,
  sortGreeneScoresAscending,
  GREENE_METRIC_CONFIG,
} from "../shared/greeneTrend";
import type { GreeneScoreEntry } from "../shared/types";

function makeEntry(overrides: Partial<GreeneScoreEntry> & { takenAt: string; total: number }): GreeneScoreEntry {
  return {
    id: `entry_${overrides.takenAt}`,
    psychological: 0,
    somatic: 0,
    vasomotor: 0,
    sexual: 0,
    responses: {},
    ...overrides,
  };
}

describe("sortGreeneScoresAscending", () => {
  it("orders oldest first regardless of input order", () => {
    const entries = [
      makeEntry({ takenAt: "2026-03-01T00:00:00.000Z", total: 30 }),
      makeEntry({ takenAt: "2026-01-01T00:00:00.000Z", total: 40 }),
      makeEntry({ takenAt: "2026-02-01T00:00:00.000Z", total: 35 }),
    ];
    expect(sortGreeneScoresAscending(entries).map(e => e.takenAt)).toEqual([
      "2026-01-01T00:00:00.000Z",
      "2026-02-01T00:00:00.000Z",
      "2026-03-01T00:00:00.000Z",
    ]);
  });
});

describe("computeGreeneTrendSummary — minimum-data states", () => {
  it("0 entries: no points, no deltas", () => {
    const summary = computeGreeneTrendSummary([], "total");
    expect(summary.points).toEqual([]);
    expect(summary.sincePrevious).toBeNull();
    expect(summary.sinceFirst).toBeNull();
  });

  it("1 entry: one point, but no deltas yet (nothing to compare against)", () => {
    const entries = [makeEntry({ takenAt: "2026-01-01T00:00:00.000Z", total: 40 })];
    const summary = computeGreeneTrendSummary(entries, "total");
    expect(summary.points).toEqual([{ takenAt: "2026-01-01T00:00:00.000Z", value: 40 }]);
    expect(summary.sincePrevious).toBeNull();
    expect(summary.sinceFirst).toBeNull();
  });

  it("2 entries: sincePrevious is computed, sinceFirst is omitted (would duplicate sincePrevious)", () => {
    const entries = [
      makeEntry({ takenAt: "2026-01-01T00:00:00.000Z", total: 40 }),
      makeEntry({ takenAt: "2026-02-01T00:00:00.000Z", total: 33 }),
    ];
    const summary = computeGreeneTrendSummary(entries, "total");
    expect(summary.sincePrevious).toEqual({ delta: -7, referenceTakenAt: "2026-01-01T00:00:00.000Z" });
    expect(summary.sinceFirst).toBeNull();
  });

  it("3+ entries: both sincePrevious and sinceFirst are computed, against the correct reference points", () => {
    const entries = [
      makeEntry({ takenAt: "2026-01-01T00:00:00.000Z", total: 40 }),
      makeEntry({ takenAt: "2026-02-01T00:00:00.000Z", total: 33 }),
      makeEntry({ takenAt: "2026-03-01T00:00:00.000Z", total: 28 }),
    ];
    const summary = computeGreeneTrendSummary(entries, "total");
    expect(summary.sincePrevious).toEqual({ delta: -5, referenceTakenAt: "2026-02-01T00:00:00.000Z" });
    expect(summary.sinceFirst).toEqual({ delta: -12, referenceTakenAt: "2026-01-01T00:00:00.000Z" });
  });

  it("computes deltas for a non-total metric independently of the total score", () => {
    const entries = [
      makeEntry({ takenAt: "2026-01-01T00:00:00.000Z", total: 10, vasomotor: 1 }),
      makeEntry({ takenAt: "2026-02-01T00:00:00.000Z", total: 5, vasomotor: 4 }),
    ];
    const summary = computeGreeneTrendSummary(entries, "vasomotor");
    // total dropped, but vasomotor rose — the two metrics move independently
    expect(summary.sincePrevious?.delta).toBe(3);
  });

  it("out-of-order input is still summarized correctly (entries are sorted internally)", () => {
    const entries = [
      makeEntry({ takenAt: "2026-03-01T00:00:00.000Z", total: 28 }),
      makeEntry({ takenAt: "2026-01-01T00:00:00.000Z", total: 40 }),
      makeEntry({ takenAt: "2026-02-01T00:00:00.000Z", total: 33 }),
    ];
    const summary = computeGreeneTrendSummary(entries, "total");
    expect(summary.points.map(p => p.takenAt)).toEqual([
      "2026-01-01T00:00:00.000Z",
      "2026-02-01T00:00:00.000Z",
      "2026-03-01T00:00:00.000Z",
    ]);
    expect(summary.sincePrevious).toEqual({ delta: -5, referenceTakenAt: "2026-02-01T00:00:00.000Z" });
  });
});

describe("describeGreeneChange — neutral, non-diagnostic language", () => {
  it("describes a drop as 'lower', never 'improving'", () => {
    const text = describeGreeneChange(-7, "your first assessment (March 1)");
    expect(text).toBe("7 points lower since your first assessment (March 1).");
    expect(text.toLowerCase()).not.toContain("improv");
    expect(text.toLowerCase()).not.toContain("worse");
    expect(text.toLowerCase()).not.toContain("better");
  });

  it("describes a rise as 'higher', never 'worsening'", () => {
    const text = describeGreeneChange(5, "your previous assessment (Feb 1)");
    expect(text).toBe("5 points higher since your previous assessment (Feb 1).");
    expect(text.toLowerCase()).not.toContain("worsen");
  });

  it("uses singular 'point' for a magnitude of exactly 1", () => {
    expect(describeGreeneChange(1, "your previous assessment")).toBe("1 point higher since your previous assessment.");
    expect(describeGreeneChange(-1, "your previous assessment")).toBe("1 point lower since your previous assessment.");
  });

  it("describes no change without implying a direction", () => {
    expect(describeGreeneChange(0, "your previous assessment (Jan 1)")).toBe(
      "Same score as your previous assessment (Jan 1)."
    );
  });
});

describe("GREENE_METRIC_CONFIG — matches the instrument's published subscale maximums", () => {
  it("has all five metrics with their correct maximums", () => {
    expect(GREENE_METRIC_CONFIG.total.max).toBe(60);
    expect(GREENE_METRIC_CONFIG.psychological.max).toBe(33);
    expect(GREENE_METRIC_CONFIG.somatic.max).toBe(21);
    expect(GREENE_METRIC_CONFIG.vasomotor.max).toBe(6);
    expect(GREENE_METRIC_CONFIG.sexual.max).toBe(3);
  });
});
