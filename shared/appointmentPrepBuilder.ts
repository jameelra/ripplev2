// ─── Appointment Prep Sheet Builder (free public tool) ──────────────────────
// Pure data + formatting for the standalone /tools/appointment-prep/ page's
// interactive island. Mirrors the symptom vocabulary used by the
// authenticated app's Appointment Prep feature (client/src/pages/AppointmentPrep.tsx)
// so this free tool reflects the same real feature rather than a rewritten mock.
// Nothing here touches the network — selections only ever live in the browser.
//
// Founder-mandated framing constraint: the generated sheet must read as a
// list of things to raise in conversation — never as a treatment plan, a
// list of demands, or an adversarial script against a clinician.

export const SYMPTOM_OPTIONS: readonly string[] = [
  "Hot flashes",
  "Night sweats",
  "Sleep difficulty",
  "Joint pain",
  "Brain fog",
  "Irritability",
  "Anxiety",
  "Fatigue",
  "Heart palpitations",
  "Breast tenderness",
  "Bloating",
  "Irregular periods",
];

export const CONCERN_OPTIONS: readonly string[] = [
  "I'd like to talk through all the options for this, not just one",
  "A symptom I've raised before wasn't fully investigated",
  "I'd like today's reasoning noted in my file",
  "I'm not sure which guideline is being applied here",
  "I'd like to explore a referral or second opinion",
  "I want a follow-up plan before I leave, even if it's 'wait and see'",
];

export interface PrepSheetSelections {
  symptoms: string[];
  concerns: string[];
  notes: string;
}

export function hasAnySelection(selections: PrepSheetSelections): boolean {
  return (
    selections.symptoms.length > 0 ||
    selections.concerns.length > 0 ||
    selections.notes.trim().length > 0
  );
}

/**
 * Plain-text prep sheet, formatted for printing, copying, or bringing into an
 * appointment. Pure function so it can be unit tested independently of the DOM.
 */
export function buildPrepSheet(selections: PrepSheetSelections, generatedOn: Date = new Date()): string {
  const generatedLabel = generatedOn.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const lines: string[] = [
    "APPOINTMENT PREP SHEET",
    `Generated ${generatedLabel} · ripplehealth.app/tools/appointment-prep`,
    "",
    "SYMPTOMS TO DESCRIBE",
  ];

  if (selections.symptoms.length > 0) {
    selections.symptoms.forEach(symptom => lines.push(`  • ${symptom}`));
    lines.push("");
    lines.push(
      "  For each one, be ready to say how often it happens, how long it's lasted, and what it stops you doing day to day."
    );
  } else {
    lines.push("  (none selected)");
  }
  lines.push("");

  lines.push("THINGS I WANT TO RAISE");
  if (selections.concerns.length > 0) {
    selections.concerns.forEach(concern => lines.push(`  • ${concern}`));
  } else {
    lines.push("  (none selected)");
  }
  lines.push("");

  if (selections.notes.trim()) {
    lines.push("ANYTHING ELSE TO MENTION");
    lines.push(`  ${selections.notes.trim()}`);
    lines.push("");
  }

  lines.push("This is a personal prompt sheet, not a treatment plan or a medical document.");
  lines.push("Bring it as a starting point for discussion with your GP or menopause specialist.");

  return lines.join("\n");
}
