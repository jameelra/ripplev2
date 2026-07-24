import type { GreeneScoreEntry } from "./types";
import { GREENE_SUBSCALE_MAX } from "./greeneClimactericScale";

export type GreeneMetricKey = "total" | "psychological" | "somatic" | "vasomotor" | "sexual";

export const GREENE_METRIC_CONFIG: Record<GreeneMetricKey, { label: string; max: number }> = {
  total: { label: "Total", max: GREENE_SUBSCALE_MAX.total },
  psychological: { label: "Psychological", max: GREENE_SUBSCALE_MAX.psychological },
  somatic: { label: "Somatic", max: GREENE_SUBSCALE_MAX.somatic },
  vasomotor: { label: "Vasomotor", max: GREENE_SUBSCALE_MAX.vasomotor },
  sexual: { label: "Sexual Function", max: GREENE_SUBSCALE_MAX.sexual },
};

/** Oldest first — the natural reading order for a trend chart. */
export function sortGreeneScoresAscending(entries: GreeneScoreEntry[]): GreeneScoreEntry[] {
  return [...entries].sort((a, b) => a.takenAt.localeCompare(b.takenAt));
}

export interface GreeneChangePoint {
  /** latest - reference. Positive = higher score, negative = lower score. */
  delta: number;
  referenceTakenAt: string;
}

export interface GreeneTrendSummary {
  metric: GreeneMetricKey;
  points: Array<{ takenAt: string; value: number }>;
  /** null when fewer than 2 entries exist. */
  sincePrevious: GreeneChangePoint | null;
  /** null when fewer than 3 entries exist (at exactly 2, this would duplicate sincePrevious). */
  sinceFirst: GreeneChangePoint | null;
}

/**
 * Summarizes a Greene score history for the trend view. Deltas are raw
 * numbers only — direction language ("higher"/"lower") and date formatting
 * are left to the caller, which must stay neutral and descriptive per the
 * standing invariant: this scale measures bother, not disease state.
 */
export function computeGreeneTrendSummary(
  entries: GreeneScoreEntry[],
  metric: GreeneMetricKey
): GreeneTrendSummary {
  const sorted = sortGreeneScoresAscending(entries);
  const points = sorted.map(e => ({ takenAt: e.takenAt, value: e[metric] }));

  if (sorted.length < 2) {
    return { metric, points, sincePrevious: null, sinceFirst: null };
  }

  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const first = sorted[0];

  const sincePrevious: GreeneChangePoint = {
    delta: latest[metric] - previous[metric],
    referenceTakenAt: previous.takenAt,
  };

  const sinceFirst: GreeneChangePoint | null =
    sorted.length >= 3 ? { delta: latest[metric] - first[metric], referenceTakenAt: first.takenAt } : null;

  return { metric, points, sincePrevious, sinceFirst };
}

/**
 * Neutral, factual description of a score change — "lower"/"higher", never
 * "improving"/"worsening". The Greene scale measures symptom bother, not
 * disease state or treatment response, so this does not interpret the change.
 */
export function describeGreeneChange(delta: number, referenceLabel: string): string {
  if (delta === 0) return `Same score as ${referenceLabel}.`;
  const direction = delta > 0 ? "higher" : "lower";
  const magnitude = Math.abs(delta);
  return `${magnitude} point${magnitude === 1 ? "" : "s"} ${direction} since ${referenceLabel}.`;
}
