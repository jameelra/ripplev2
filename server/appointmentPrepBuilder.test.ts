import { describe, expect, it } from "vitest";
import {
  buildPrepSheet,
  CONCERN_OPTIONS,
  hasAnySelection,
  SYMPTOM_OPTIONS,
  type PrepSheetSelections,
} from "../shared/appointmentPrepBuilder";

describe("appointment prep builder — structure", () => {
  it("has a non-empty, unique set of symptom options", () => {
    expect(SYMPTOM_OPTIONS.length).toBeGreaterThan(0);
    expect(new Set(SYMPTOM_OPTIONS).size).toBe(SYMPTOM_OPTIONS.length);
  });

  it("has a non-empty, unique set of concern options", () => {
    expect(CONCERN_OPTIONS.length).toBeGreaterThan(0);
    expect(new Set(CONCERN_OPTIONS).size).toBe(CONCERN_OPTIONS.length);
  });
});

describe("appointment prep builder — hasAnySelection", () => {
  it("is false when nothing is selected", () => {
    expect(hasAnySelection({ symptoms: [], concerns: [], notes: "" })).toBe(false);
  });

  it("is false when notes is only whitespace", () => {
    expect(hasAnySelection({ symptoms: [], concerns: [], notes: "   " })).toBe(false);
  });

  it("is true with at least one symptom", () => {
    expect(hasAnySelection({ symptoms: ["Hot flashes"], concerns: [], notes: "" })).toBe(true);
  });

  it("is true with at least one concern", () => {
    expect(hasAnySelection({ symptoms: [], concerns: [CONCERN_OPTIONS[0]], notes: "" })).toBe(true);
  });

  it("is true with non-blank notes", () => {
    expect(hasAnySelection({ symptoms: [], concerns: [], notes: "Also want to mention X" })).toBe(true);
  });
});

describe("appointment prep builder — sheet generation", () => {
  const generatedOn = new Date("2026-07-20T00:00:00Z");

  it("includes every selected symptom and concern, in the order provided", () => {
    const selections: PrepSheetSelections = {
      symptoms: ["Hot flashes", "Brain fog"],
      concerns: [CONCERN_OPTIONS[0], CONCERN_OPTIONS[3]],
      notes: "",
    };
    const sheet = buildPrepSheet(selections, generatedOn);
    expect(sheet).toContain("Generated July 20, 2026");
    expect(sheet).toContain("  • Hot flashes");
    expect(sheet).toContain("  • Brain fog");
    expect(sheet).toContain(`  • ${CONCERN_OPTIONS[0]}`);
    expect(sheet).toContain(`  • ${CONCERN_OPTIONS[3]}`);
    expect(sheet.indexOf("Hot flashes")).toBeLessThan(sheet.indexOf("Brain fog"));
  });

  it("marks symptoms and concerns as unselected when none are chosen", () => {
    const sheet = buildPrepSheet({ symptoms: [], concerns: [], notes: "" }, generatedOn);
    expect(sheet).toContain("SYMPTOMS TO DESCRIBE\n  (none selected)");
    expect(sheet).toContain("THINGS I WANT TO RAISE\n  (none selected)");
  });

  it("includes the frequency/duration/impact tip only when at least one symptom is selected", () => {
    const withSymptom = buildPrepSheet({ symptoms: ["Hot flashes"], concerns: [], notes: "" }, generatedOn);
    expect(withSymptom).toMatch(/how often it happens/i);

    const withoutSymptom = buildPrepSheet({ symptoms: [], concerns: [], notes: "" }, generatedOn);
    expect(withoutSymptom).not.toMatch(/how often it happens/i);
  });

  it("includes trimmed free-text notes under their own heading, and omits the heading when blank", () => {
    const withNotes = buildPrepSheet({ symptoms: [], concerns: [], notes: "  Also, my sleep has gotten worse.  " }, generatedOn);
    expect(withNotes).toContain("ANYTHING ELSE TO MENTION\n  Also, my sleep has gotten worse.");

    const withoutNotes = buildPrepSheet({ symptoms: [], concerns: [], notes: "" }, generatedOn);
    expect(withoutNotes).not.toContain("ANYTHING ELSE TO MENTION");
  });

  it("always includes the personal-prompt-sheet disclaimer", () => {
    const sheet = buildPrepSheet({ symptoms: [], concerns: [], notes: "" }, generatedOn);
    expect(sheet).toContain("This is a personal prompt sheet, not a treatment plan or a medical document.");
  });
});

describe("appointment prep builder — tone constraints", () => {
  // Founder-mandated constraints: the sheet must read as things to raise in
  // conversation, never as a treatment plan, a set of demands, or an
  // adversarial script against a clinician. These are regression tests
  // against that requirement, not just a style preference.
  const forbiddenPhrases = [
    /\bdemand/i,
    /\brefuse\b/i,
    /your doctor is (wrong|failing)/i,
    /don't trust (your|the) (doctor|clinician|gp)/i,
    /stop taking/i,
    /should stop/i,
    /\bdisregard\b/i,
  ];

  it("no symptom or concern option contains adversarial or demanding language", () => {
    for (const text of [...SYMPTOM_OPTIONS, ...CONCERN_OPTIONS]) {
      for (const phrase of forbiddenPhrases) {
        expect(text, `text: "${text}"`).not.toMatch(phrase);
      }
    }
  });

  it("a fully-populated sheet never reads as a treatment plan or contains adversarial language", () => {
    const sheet = buildPrepSheet(
      {
        symptoms: [...SYMPTOM_OPTIONS],
        concerns: [...CONCERN_OPTIONS],
        notes: "Also want to mention my family history.",
      },
      new Date("2026-07-20T00:00:00Z")
    );
    expect(sheet).toContain("not a treatment plan");
    for (const phrase of forbiddenPhrases) {
      expect(sheet).not.toMatch(phrase);
    }
  });
});
