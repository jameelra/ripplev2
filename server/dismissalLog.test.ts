import { describe, expect, it } from "vitest";
import {
  buildDismissalLogSummary,
  buildEntryFromInput,
  formatDateForDisplay,
  parseSymptoms,
  validateEntryInput,
  type DismissalLogEntry,
} from "../shared/dismissalLog";

describe("dismissal log — input validation", () => {
  it("requires a clinic name", () => {
    const error = validateEntryInput({
      date: "2026-01-01",
      clinicName: "  ",
      clinicianName: "",
      symptomsRaw: "",
      response: "Said it's just stress",
      wasResolved: false,
    });
    expect(error).toMatch(/clinic/i);
  });

  it("requires a response", () => {
    const error = validateEntryInput({
      date: "2026-01-01",
      clinicName: "City Medical Centre",
      clinicianName: "",
      symptomsRaw: "",
      response: "   ",
      wasResolved: false,
    });
    expect(error).toMatch(/clinician/i);
  });

  it("passes when clinic name and response are present", () => {
    const error = validateEntryInput({
      date: "2026-01-01",
      clinicName: "City Medical Centre",
      clinicianName: "",
      symptomsRaw: "",
      response: "Said it's just stress",
      wasResolved: false,
    });
    expect(error).toBeNull();
  });
});

describe("dismissal log — symptom parsing", () => {
  it("splits, trims, and drops empty entries", () => {
    expect(parseSymptoms("hot flashes,  brain fog ,, joint pain")).toEqual([
      "hot flashes",
      "brain fog",
      "joint pain",
    ]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseSymptoms("")).toEqual([]);
  });
});

describe("dismissal log — entry construction", () => {
  it("trims text fields and parses symptoms from raw input", () => {
    const entry = buildEntryFromInput({
      date: "2026-03-14",
      clinicName: "  City Medical Centre  ",
      clinicianName: " Dr. Smith ",
      symptomsRaw: "hot flashes, brain fog",
      response: "  Said I'm too young for perimenopause  ",
      wasResolved: true,
    });
    expect(entry).toEqual({
      date: "2026-03-14",
      clinicName: "City Medical Centre",
      clinicianName: "Dr. Smith",
      symptomsReported: ["hot flashes", "brain fog"],
      response: "Said I'm too young for perimenopause",
      wasResolved: true,
    });
  });
});

describe("dismissal log — date formatting", () => {
  it("formats an ISO date as a long-form date without a timezone shift", () => {
    expect(formatDateForDisplay("2026-01-05")).toBe("January 5, 2026");
  });

  it("returns the input unchanged if it isn't a valid ISO date", () => {
    expect(formatDateForDisplay("not-a-date")).toBe("not-a-date");
  });
});

describe("dismissal log — summary generation", () => {
  const entries: DismissalLogEntry[] = [
    {
      date: "2026-01-05",
      clinicName: "City Medical Centre",
      clinicianName: "Dr. Smith",
      symptomsReported: ["hot flashes", "brain fog"],
      response: "Said it's just stress",
      wasResolved: false,
    },
    {
      date: "2025-11-20",
      clinicName: "Riverside Practice",
      clinicianName: "",
      symptomsReported: [],
      response: "Recommended weight loss and exercise without further investigation",
      wasResolved: true,
    },
  ];

  it("includes every entry, in the order provided, with status and response", () => {
    const summary = buildDismissalLogSummary(entries, new Date("2026-07-18T00:00:00Z"));
    expect(summary).toContain("2 recorded instances");
    expect(summary).toContain("January 5, 2026 — City Medical Centre (Dr. Smith)");
    expect(summary).toContain("Status: Unresolved");
    expect(summary).toContain("Symptoms reported: hot flashes, brain fog");
    expect(summary).toContain('Response: "Said it\'s just stress"');
    expect(summary).toContain("November 20, 2025 — Riverside Practice");
    expect(summary).toContain("Status: Resolved in a later appointment");
    expect(summary).toContain("This is a personal record of appointments, not a medical or diagnostic document.");
  });

  it("singularizes the count for exactly one entry", () => {
    const summary = buildDismissalLogSummary([entries[0]], new Date("2026-07-18T00:00:00Z"));
    expect(summary).toContain("1 recorded instance ");
  });

  it("omits the symptoms line when none were reported", () => {
    const summary = buildDismissalLogSummary([entries[1]], new Date("2026-07-18T00:00:00Z"));
    expect(summary).not.toContain("Symptoms reported:");
  });
});
