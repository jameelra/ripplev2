// ─── Ripple v2 — HRT Tracking Log Builder (free public tool) ───────────────
// Pure data + formatting for the standalone /tools/hrt-tracker/ page's
// interactive island. Reuses the same symptom vocabulary as the Appointment
// Prep free tool so the public tool pages stay consistent with each other.
// Nothing here touches the network — selections only ever live in the browser.
//
// Content-frame constraint: this builds a personal tracking log for an HRT
// decision already made with a clinician. It never recommends starting,
// stopping, or changing treatment, and never characterizes HRT as safe or
// unsafe — that nuance belongs in the page's cited body copy, not this tool.

import { SYMPTOM_OPTIONS } from "./appointmentPrepBuilder";

export { SYMPTOM_OPTIONS };

export const REGIMEN_NOTE_OPTIONS: readonly string[] = [
  "Took my dose(s) as scheduled",
  "Missed or delayed a dose",
  "Rotated my patch or gel application site",
  "Noticed a new or changed symptom since starting or adjusting treatment",
  "Have a question to raise at my next review",
];

export interface HrtTrackingLogSelections {
  symptoms: string[];
  regimenNotes: string[];
  notes: string;
}

export function hasAnySelection(selections: HrtTrackingLogSelections): boolean {
  return (
    selections.symptoms.length > 0 ||
    selections.regimenNotes.length > 0 ||
    selections.notes.trim().length > 0
  );
}

/**
 * Plain-text HRT tracking log entry, formatted for printing, copying, or
 * bringing to a follow-up appointment. Pure function so it can be unit
 * tested independently of the DOM.
 */
export function buildHrtTrackingLog(selections: HrtTrackingLogSelections, generatedOn: Date = new Date()): string {
  const generatedLabel = generatedOn.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const lines: string[] = [
    "HRT TRACKING LOG",
    `Generated ${generatedLabel} · ripplehealth.app/tools/hrt-tracker`,
    "",
    "SYMPTOMS LOGGED",
  ];

  if (selections.symptoms.length > 0) {
    selections.symptoms.forEach(symptom => lines.push(`  • ${symptom}`));
  } else {
    lines.push("  (none selected)");
  }
  lines.push("");

  lines.push("REGIMEN NOTES");
  if (selections.regimenNotes.length > 0) {
    selections.regimenNotes.forEach(note => lines.push(`  • ${note}`));
  } else {
    lines.push("  (none selected)");
  }
  lines.push("");

  if (selections.notes.trim()) {
    lines.push("ANYTHING ELSE");
    lines.push(`  ${selections.notes.trim()}`);
    lines.push("");
  }

  lines.push("This is a personal tracking log, not a treatment plan or a medical record.");
  lines.push("Bring it to your next HRT review with your GP or menopause specialist.");

  return lines.join("\n");
}
