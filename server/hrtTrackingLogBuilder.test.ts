import { describe, expect, it } from "vitest";
import { SYMPTOM_OPTIONS } from "../shared/appointmentPrepBuilder";
import {
  buildHrtTrackingLog,
  hasAnySelection,
  REGIMEN_NOTE_OPTIONS,
  SYMPTOM_OPTIONS as HRT_SYMPTOM_OPTIONS,
  type HrtTrackingLogSelections,
} from "../shared/hrtTrackingLogBuilder";

describe("HRT tracking log builder — structure", () => {
  it("reuses the same symptom vocabulary as the Appointment Prep free tool", () => {
    expect(HRT_SYMPTOM_OPTIONS).toBe(SYMPTOM_OPTIONS);
  });

  it("has a non-empty, unique set of regimen note options", () => {
    expect(REGIMEN_NOTE_OPTIONS.length).toBeGreaterThan(0);
    expect(new Set(REGIMEN_NOTE_OPTIONS).size).toBe(REGIMEN_NOTE_OPTIONS.length);
  });
});

describe("HRT tracking log builder — hasAnySelection", () => {
  it("is false when nothing is selected", () => {
    expect(hasAnySelection({ symptoms: [], regimenNotes: [], notes: "" })).toBe(false);
  });

  it("is false when notes is only whitespace", () => {
    expect(hasAnySelection({ symptoms: [], regimenNotes: [], notes: "   " })).toBe(false);
  });

  it("is true with at least one symptom", () => {
    expect(hasAnySelection({ symptoms: ["Hot flashes"], regimenNotes: [], notes: "" })).toBe(true);
  });

  it("is true with at least one regimen note", () => {
    expect(hasAnySelection({ symptoms: [], regimenNotes: [REGIMEN_NOTE_OPTIONS[0]], notes: "" })).toBe(true);
  });

  it("is true with non-blank notes", () => {
    expect(hasAnySelection({ symptoms: [], regimenNotes: [], notes: "Also want to mention X" })).toBe(true);
  });
});

describe("HRT tracking log builder — log generation", () => {
  const generatedOn = new Date("2026-07-21T00:00:00Z");

  it("includes every selected symptom and regimen note, in the order provided", () => {
    const selections: HrtTrackingLogSelections = {
      symptoms: ["Hot flashes", "Brain fog"],
      regimenNotes: [REGIMEN_NOTE_OPTIONS[0], REGIMEN_NOTE_OPTIONS[3]],
      notes: "",
    };
    const log = buildHrtTrackingLog(selections, generatedOn);
    expect(log).toContain("Generated July 21, 2026");
    expect(log).toContain("  • Hot flashes");
    expect(log).toContain("  • Brain fog");
    expect(log).toContain(`  • ${REGIMEN_NOTE_OPTIONS[0]}`);
    expect(log).toContain(`  • ${REGIMEN_NOTE_OPTIONS[3]}`);
    expect(log.indexOf("Hot flashes")).toBeLessThan(log.indexOf("Brain fog"));
  });

  it("marks symptoms and regimen notes as unselected when none are chosen", () => {
    const log = buildHrtTrackingLog({ symptoms: [], regimenNotes: [], notes: "" }, generatedOn);
    expect(log).toContain("SYMPTOMS LOGGED\n  (none selected)");
    expect(log).toContain("REGIMEN NOTES\n  (none selected)");
  });

  it("includes trimmed free-text notes under their own heading, and omits the heading when blank", () => {
    const withNotes = buildHrtTrackingLog({ symptoms: [], regimenNotes: [], notes: "  Also, missed a dose Tuesday.  " }, generatedOn);
    expect(withNotes).toContain("ANYTHING ELSE\n  Also, missed a dose Tuesday.");

    const withoutNotes = buildHrtTrackingLog({ symptoms: [], regimenNotes: [], notes: "" }, generatedOn);
    expect(withoutNotes).not.toContain("ANYTHING ELSE");
  });

  it("always includes the personal-tracking-log disclaimer", () => {
    const log = buildHrtTrackingLog({ symptoms: [], regimenNotes: [], notes: "" }, generatedOn);
    expect(log).toContain("This is a personal tracking log, not a treatment plan or a medical record.");
  });
});

describe("HRT tracking log builder — tone constraints", () => {
  // Content-frame constraint: this tool tracks an HRT decision already made
  // with a clinician. It must never read as advice to start, stop, or change
  // treatment, never characterize HRT as safe or unsafe, and never be
  // adversarial toward clinicians.
  const forbiddenPhrases = [
    /\bdemand/i,
    /\brefuse\b/i,
    /your doctor is (wrong|failing)/i,
    /don't trust (your|the) (doctor|clinician|gp)/i,
    /stop taking/i,
    /should stop/i,
    /should start/i,
    /you should (take|use)/i,
    /\bdisregard\b/i,
    /HRT is (safe|unsafe|dangerous)/i,
  ];

  it("no symptom or regimen note option contains adversarial, demanding, or treatment-advice language", () => {
    for (const text of [...SYMPTOM_OPTIONS, ...REGIMEN_NOTE_OPTIONS]) {
      for (const phrase of forbiddenPhrases) {
        expect(text, `text: "${text}"`).not.toMatch(phrase);
      }
    }
  });

  it("a fully-populated log never reads as a treatment plan, safety verdict, or adversarial script", () => {
    const log = buildHrtTrackingLog(
      {
        symptoms: [...SYMPTOM_OPTIONS],
        regimenNotes: [...REGIMEN_NOTE_OPTIONS],
        notes: "Also want to mention my family history.",
      },
      new Date("2026-07-21T00:00:00Z")
    );
    expect(log).toContain("not a treatment plan");
    for (const phrase of forbiddenPhrases) {
      expect(log).not.toMatch(phrase);
    }
  });
});
