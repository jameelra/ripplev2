// ─── Cycle Change Tracker — pattern classification (locale-agnostic) ────────
// Original items written by Ripple, grounded in the STRAW+10 consensus
// staging framework (Harlow et al. 2012). This is NOT a scored instrument —
// classifyPattern() returns a PATTERN KEY, never a number and never
// user-facing text, so both the English page (client/tools/cycle-changes/)
// and the French-Canadian twin (client/fr/outils/changements-du-cycle/) can
// render their own copy for whatever key comes back. Nothing here touches
// the DOM or the network — pure functions only, so this file can be unit
// tested in isolation and shared by both locales without duplicating logic.

// ─── Item 0 — confounder gate ────────────────────────────────────────────
export const GATE_YES = "yes";
export const GATE_NO = "no";
export const GATE_NOT_SURE = "not-sure";

// ─── Item 1 — cycle length variability ───────────────────────────────────
export const ITEM1_MULTIPLE = "multiple"; // "Yes, more than once recently"
export const ITEM1_ONCE = "once"; // "Yes, once"
export const ITEM1_NO = "no";
export const ITEM1_NOT_SURE = "not-sure";

// ─── Items 2, 3 — shared yes/no(/not-sure) vocabulary ────────────────────
export const YES = "yes";
export const NO = "no";
export const NOT_SURE = "not-sure";

// ─── Item 4 — flow volume ─────────────────────────────────────────────────
export const FLOW_HEAVIER = "heavier";
export const FLOW_LIGHTER = "lighter";
export const FLOW_VARIES = "varies";
export const FLOW_NO_CHANGE = "no-change";

// ─── Item 5 — bleeding duration ───────────────────────────────────────────
export const DURATION_LONGER = "longer";
export const DURATION_SHORTER = "shorter";
export const DURATION_VARIES = "varies";
export const DURATION_NO_CHANGE = "no-change";

// ─── Item 6 — predictability ──────────────────────────────────────────────
export const PREDICT_USUALLY = "usually";
export const PREDICT_SOMETIMES = "sometimes";
export const PREDICT_RARELY = "rarely";

// ─── Item 7 — patterns to raise promptly (multi-select, no scoring weight) ─
export const FLAG_SPOTTING = "spotting-between-periods";
export const FLAG_POST_COITAL = "bleeding-after-sex";
export const FLAG_POSTMENOPAUSAL_BLEEDING = "bleeding-after-12-months";
export const FLAG_HEAVY = "heavy-bleeding";
export const FLAG_NONE = "none";

export const ALL_URGENT_FLAGS = [FLAG_SPOTTING, FLAG_POST_COITAL, FLAG_POSTMENOPAUSAL_BLEEDING, FLAG_HEAVY];

// ─── Classification output keys ───────────────────────────────────────────
export const PATTERN = {
  POSTMENOPAUSAL: "postmenopausal-pattern",
  LATE_TRANSITION: "late-transition-pattern",
  EARLY_TRANSITION: "early-transition-pattern",
  POSSIBLE_EARLY_CHANGE: "possible-early-change",
  NO_CYCLE_MARKER: "no-cycle-marker",
};

/**
 * @typedef {Object} CycleChangeResponses
 * @property {"yes"|"no"|"not-sure"} [item0]
 * @property {"multiple"|"once"|"no"|"not-sure"} [item1]
 * @property {"yes"|"no"|"not-sure"} [item2]
 * @property {"yes"|"no"} [item3]
 * @property {"heavier"|"lighter"|"varies"|"no-change"} [item4]
 * @property {"longer"|"shorter"|"varies"|"no-change"} [item5]
 * @property {"usually"|"sometimes"|"rarely"} [item6]
 * @property {string[]} [item7]
 */

/** Item 0 = "Yes" means hormonal treatment is directly shaping bleeding pattern — classifying would be meaningless. */
export function isConfounderGateActive(responses) {
  return responses.item0 === GATE_YES;
}

/**
 * Classifies a cycle pattern in STRAW+10-informed priority order. Returns
 * `null` when the confounder gate (item 0) is active — never falls through
 * to a classification in that case, however items 1-3 are answered.
 * @param {CycleChangeResponses} responses
 * @returns {string|null} one of the PATTERN values, or null if gated
 */
export function classifyPattern(responses) {
  if (isConfounderGateActive(responses)) return null;
  if (responses.item3 === YES) return PATTERN.POSTMENOPAUSAL;
  if (responses.item2 === YES) return PATTERN.LATE_TRANSITION;
  if (responses.item1 === ITEM1_MULTIPLE) return PATTERN.EARLY_TRANSITION;
  if (responses.item1 === ITEM1_ONCE) return PATTERN.POSSIBLE_EARLY_CHANGE;
  return PATTERN.NO_CYCLE_MARKER;
}

/**
 * Items 4-6 never drive classification — they're real, common transition
 * experiences reflected back descriptively rather than weighted. Only
 * non-baseline answers are returned; "no real change" / "usually
 * predictable" produce nothing to reflect back.
 * @param {CycleChangeResponses} responses
 * @returns {string[]} note keys, e.g. ["flow-heavier", "predictability-sometimes"]
 */
export function getDescriptiveNotes(responses) {
  const notes = [];
  if (responses.item4 && responses.item4 !== FLOW_NO_CHANGE) {
    notes.push(`flow-${responses.item4}`);
  }
  if (responses.item5 && responses.item5 !== DURATION_NO_CHANGE) {
    notes.push(`duration-${responses.item5}`);
  }
  if (responses.item6 && responses.item6 !== PREDICT_USUALLY) {
    notes.push(`predictability-${responses.item6}`);
  }
  return notes;
}

/**
 * Item 7 is independent of the confounder gate and the classification
 * priority chain — it must be evaluated (and its panel shown) even when
 * isConfounderGateActive(responses) is true.
 * @param {CycleChangeResponses} responses
 * @returns {boolean} true if anything other than "None of these" is selected
 */
export function hasPersistentBleedingFlag(responses) {
  const selected = responses.item7 ?? [];
  if (selected.length === 0) return false;
  return selected.some(flag => flag !== FLAG_NONE);
}
