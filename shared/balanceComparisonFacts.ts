// ─── Ripple v2 — Balance Comparison: Verified Facts ─────────────────────────
// Single source of truth for every factual claim about the Balance app made
// on /tools/balance-alternative/ and /tools/ripple-vs-balance/. Both pages
// reproduce these strings verbatim in their static HTML — content-drift
// tests in server/*.test.ts assert this — so a future edit can't silently
// soften, exaggerate, or go stale on a claim about a competitor's product.
//
// Facts checked against Balance's live public listing on 2026-07-21.
// Products only: nothing here concerns any individual, company leadership,
// or clinical/prescribing practice — see the hard prohibitions enforced by
// the page tests (no names, no star ratings, no pricing figures, no
// "broken/unreliable" claims, no better/worse verdicts).

export const BALANCE_CREDENTIALS = {
  orcha: "the first menopause app to receive ORCHA certification",
  nhs: "listed in NHS digital health libraries",
  apple: "recognized as an Apple Editors' Choice",
  users: "used by more than a million people worldwide",
} as const;

export const BALANCE_FREE_TIER = {
  journal: "a symptom, period, sleep, and mood tracking journal",
  questionnaires: "quarterly symptom questionnaires",
  graphs: "1-, 3-, and 6-month symptom graphs",
  healthReport: "a shareable clinician Health Report",
  update2026:
    "journal logs now feed directly into the Health Report, with an editable symptom summary before you generate it",
} as const;

export const BALANCE_PAID_TIER = {
  name: "Balance+",
  features: "content collections, live expert Q&A sessions, and enhanced symptom and report features",
  trial: "a 14-day trial",
} as const;

// The only two gaps this project is authorized to name, and only as
// commonly-requested additions — never as defects.
export const BALANCE_COMMON_REQUESTS = {
  integration: "no integration with Apple Health, Garmin, or MyFitnessPal",
  correlation: "no built-in view that shows how symptoms move together or cluster over time",
} as const;

// Ripple's honest answer to each gap — verified against the codebase
// (client/src/lib/hrtEngine.ts computeTriggerCorrelations,
// client/src/components/BiologicalCorrelations.tsx) before being asserted.
// The integration gap gets an honest parity admission, not a roadmap promise.
export const RIPPLE_ANSWERS = {
  integration:
    "Ripple's tracking is also manual today — like Balance, it doesn't currently connect to Apple Health, Garmin, or MyFitnessPal",
  triggerTracker:
    "Ripple's Trigger Tracker looks for correlations between logged triggers and specific symptoms, both same-day and next-day, and flags them by confidence level once you have at least 14 days of co-logged data",
  biologicalCorrelations:
    "Ripple's Biological Correlations view charts two related signals — like sleep duration and heart rate variability — on the same time-series chart, so you can see whether they move together",
} as const;
