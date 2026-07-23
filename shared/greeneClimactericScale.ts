// ─── Greene Climacteric Scale (Greene JG, 1998, Maturitas 29(1):25-31) ──────
// Standard 21-item validated instrument. Item wording, ordering, subscale
// boundaries, and response scale verified against the NIH PhenX Toolkit's
// authoritative reproduction of Greene (1998) — do not reword, reorder, or
// drop items. All scoring is pure/client-side; nothing here ever touches
// the network.

export type GreeneResponseValue = 0 | 1 | 2 | 3;

export type GreeneSubscale = "anxiety" | "depression" | "somatic" | "vasomotor" | "sexual";

export interface GreeneItem {
  /** 1-indexed item number, matching the published instrument. */
  id: number;
  text: string;
  subscale: GreeneSubscale;
}

export const GREENE_RESPONSE_OPTIONS: ReadonlyArray<{ value: GreeneResponseValue; label: string }> = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "A little" },
  { value: 2, label: "Quite a bit" },
  { value: 3, label: "Extremely" },
];

export const GREENE_ITEMS: ReadonlyArray<GreeneItem> = [
  // Psychological — Anxiety (1–6)
  { id: 1, text: "Heart beating quickly or strongly", subscale: "anxiety" },
  { id: 2, text: "Feeling tense or nervous", subscale: "anxiety" },
  { id: 3, text: "Difficulty in sleeping", subscale: "anxiety" },
  { id: 4, text: "Excitable", subscale: "anxiety" },
  { id: 5, text: "Attacks of panic", subscale: "anxiety" },
  { id: 6, text: "Difficulty in concentrating", subscale: "anxiety" },
  // Psychological — Depression (7–11)
  { id: 7, text: "Feeling tired or lacking in energy", subscale: "depression" },
  { id: 8, text: "Loss of interest in most things", subscale: "depression" },
  { id: 9, text: "Feeling unhappy or depressed", subscale: "depression" },
  { id: 10, text: "Crying spells", subscale: "depression" },
  { id: 11, text: "Irritability", subscale: "depression" },
  // Somatic (12–18)
  { id: 12, text: "Feeling dizzy or faint", subscale: "somatic" },
  { id: 13, text: "Pressure or tightness in head or body", subscale: "somatic" },
  { id: 14, text: "Parts of body feel numb or tingling", subscale: "somatic" },
  { id: 15, text: "Headaches", subscale: "somatic" },
  { id: 16, text: "Muscle and joint pains", subscale: "somatic" },
  { id: 17, text: "Loss of feeling in hands or feet", subscale: "somatic" },
  { id: 18, text: "Breathing difficulties", subscale: "somatic" },
  // Vasomotor (19–20)
  { id: 19, text: "Hot flushes", subscale: "vasomotor" },
  { id: 20, text: "Sweating at night", subscale: "vasomotor" },
  // Sexual dysfunction probe (21) — reported separately, not summed into total
  { id: 21, text: "Loss of interest in sex", subscale: "sexual" },
];

export const GREENE_ITEM_COUNT = GREENE_ITEMS.length; // 21

export const GREENE_SUBSCALE_MAX = {
  anxiety: 18, // 6 items x 3
  depression: 15, // 5 items x 3
  psychological: 33, // 11 items x 3
  somatic: 21, // 7 items x 3
  vasomotor: 6, // 2 items x 3
  total: 60, // items 1-20 x 3 (psychological 33 + somatic 21 + vasomotor 6)
  sexual: 3, // item 21 alone
} as const;

export type GreeneResponses = Partial<Record<number, GreeneResponseValue>>;

export interface GreeneScoreResult {
  anxiety: number;
  depression: number;
  psychological: number;
  somatic: number;
  vasomotor: number;
  /** Sum of items 1–20 only. Item 21 is reported separately per the published instrument. */
  total: number;
  /** Item 21, the standalone sexual-dysfunction probe. */
  sexual: number;
}

function sumSubscale(responses: GreeneResponses, subscale: GreeneSubscale): number {
  return GREENE_ITEMS.filter(item => item.subscale === subscale).reduce((sum, item) => {
    const value = responses[item.id];
    if (value === undefined) {
      throw new Error(`Missing response for item ${item.id}`);
    }
    return sum + value;
  }, 0);
}

/** Returns the IDs (1-21) of items with no recorded response yet. */
export function findMissingItems(responses: GreeneResponses): number[] {
  return GREENE_ITEMS.filter(item => responses[item.id] === undefined).map(item => item.id);
}

/** Scores a complete set of 21 responses. Throws if any item is missing — validate with findMissingItems first. */
export function scoreGreeneClimactericScale(responses: GreeneResponses): GreeneScoreResult {
  const anxiety = sumSubscale(responses, "anxiety");
  const depression = sumSubscale(responses, "depression");
  const somatic = sumSubscale(responses, "somatic");
  const vasomotor = sumSubscale(responses, "vasomotor");
  const sexual = sumSubscale(responses, "sexual");

  return {
    anxiety,
    depression,
    psychological: anxiety + depression,
    somatic,
    vasomotor,
    total: anxiety + depression + somatic + vasomotor,
    sexual,
  };
}

/**
 * Purely descriptive placement of a raw score within its possible range —
 * NOT a validated clinical severity cutoff. Greene (1998) does not publish
 * diagnostic thresholds; the scale is used to track change over time.
 */
export type RelativeLevel = "lower" | "middle" | "upper";

export function describeRelativeLevel(score: number, max: number): RelativeLevel {
  const ratio = max === 0 ? 0 : score / max;
  if (ratio < 1 / 3) return "lower";
  if (ratio < 2 / 3) return "middle";
  return "upper";
}
