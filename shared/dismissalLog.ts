// ─── Dismissal Log (free public tool) ───────────────────────────────────────
// Pure data + formatting for the standalone /tools/dismissal-tracker/ page.
// Mirrors the fields and quick-select phrasing used by the authenticated
// app's Dismissal Tracker (client/src/pages/DismissalTracker.tsx) so this
// free tool reflects the same real feature rather than a rewritten mock.
// Nothing here touches the network — entries only ever live in the browser.

export const COMMON_DISMISSAL_RESPONSES: readonly string[] = [
  "Told me it's just stress or anxiety",
  "Prescribed antidepressants without investigating hormones",
  "Said I'm too young for perimenopause",
  "Said my hormone levels are 'normal' and dismissed symptoms",
  "Recommended weight loss and exercise without further investigation",
  "Attributed symptoms to normal ageing",
  "Refused to discuss hormone therapy",
  "Said to wait and see",
  "Dismissed symptoms as psychosomatic",
];

export interface DismissalLogEntry {
  date: string; // yyyy-mm-dd
  clinicName: string;
  clinicianName: string;
  symptomsReported: string[];
  response: string;
  wasResolved: boolean;
}

export interface DismissalLogEntryInput {
  date: string;
  clinicName: string;
  clinicianName: string;
  symptomsRaw: string; // comma-separated, as typed
  response: string;
  wasResolved: boolean;
}

/** Returns an error message if the entry can't be saved, or null if it's valid. */
export function validateEntryInput(input: DismissalLogEntryInput): string | null {
  if (!input.clinicName.trim()) return "Please enter the clinic or practice name.";
  if (!input.response.trim()) return "Please describe what the clinician said or did.";
  return null;
}

export function parseSymptoms(raw: string): string[] {
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

export function buildEntryFromInput(input: DismissalLogEntryInput): DismissalLogEntry {
  return {
    date: input.date,
    clinicName: input.clinicName.trim(),
    clinicianName: input.clinicianName.trim(),
    symptomsReported: parseSymptoms(input.symptomsRaw),
    response: input.response.trim(),
    wasResolved: input.wasResolved,
  };
}

export function formatDateForDisplay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/**
 * Plain-text record of all logged entries, formatted for printing, copying,
 * or bringing into an appointment. Pure function so it can be unit tested
 * independently of the DOM.
 */
export function buildDismissalLogSummary(entries: DismissalLogEntry[], generatedOn: Date = new Date()): string {
  const generatedLabel = generatedOn.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const lines: string[] = [
    "DISMISSAL LOG",
    `Generated ${generatedLabel} · ripplehealth.app/tools/dismissal-tracker`,
    "",
    `${entries.length} recorded instance${entries.length !== 1 ? "s" : ""} of symptoms being dismissed or minimised`,
    "",
  ];

  entries.forEach((entry, index) => {
    lines.push(`${index + 1}. ${formatDateForDisplay(entry.date)} — ${entry.clinicName}${entry.clinicianName ? ` (${entry.clinicianName})` : ""}`);
    lines.push(`   Status: ${entry.wasResolved ? "Resolved in a later appointment" : "Unresolved"}`);
    if (entry.symptomsReported.length > 0) {
      lines.push(`   Symptoms reported: ${entry.symptomsReported.join(", ")}`);
    }
    lines.push(`   Response: "${entry.response}"`);
    lines.push("");
  });

  lines.push("This is a personal record of appointments, not a medical or diagnostic document.");
  lines.push("Bring it to your next appointment as a starting point for discussion with your GP or menopause specialist.");

  return lines.join("\n");
}
