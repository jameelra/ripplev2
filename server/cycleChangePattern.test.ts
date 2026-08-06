import { describe, expect, it } from "vitest";
import {
  classifyPattern,
  getDescriptiveNotes,
  hasPersistentBleedingFlag,
  isConfounderGateActive,
  PATTERN,
  GATE_YES,
  GATE_NO,
  GATE_NOT_SURE,
  ITEM1_MULTIPLE,
  ITEM1_ONCE,
  ITEM1_NO,
  YES,
  NO,
  NOT_SURE,
  FLOW_HEAVIER,
  FLOW_NO_CHANGE,
  DURATION_LONGER,
  DURATION_NO_CHANGE,
  PREDICT_SOMETIMES,
  PREDICT_RARELY,
  PREDICT_USUALLY,
  FLAG_NONE,
  FLAG_SPOTTING,
  FLAG_HEAVY,
  FLAG_POSTMENOPAUSAL_BLEEDING,
} from "../client/tools/cycle-changes/pattern.js";

describe("Cycle Change Tracker — confounder gate (item 0)", () => {
  it("is active only when item0 is exactly 'yes'", () => {
    expect(isConfounderGateActive({ item0: GATE_YES })).toBe(true);
    expect(isConfounderGateActive({ item0: GATE_NO })).toBe(false);
    expect(isConfounderGateActive({ item0: GATE_NOT_SURE })).toBe(false);
    expect(isConfounderGateActive({})).toBe(false);
  });

  it("classifyPattern returns null when the gate fires, no matter what items 1-3 say", () => {
    expect(classifyPattern({ item0: GATE_YES, item3: YES })).toBeNull();
    expect(classifyPattern({ item0: GATE_YES, item2: YES })).toBeNull();
    expect(classifyPattern({ item0: GATE_YES, item1: ITEM1_MULTIPLE })).toBeNull();
    expect(classifyPattern({ item0: GATE_YES })).toBeNull();
  });

  it("does not gate when item0 is 'no' or 'not-sure'", () => {
    expect(classifyPattern({ item0: GATE_NO })).toBe(PATTERN.NO_CYCLE_MARKER);
    expect(classifyPattern({ item0: GATE_NOT_SURE })).toBe(PATTERN.NO_CYCLE_MARKER);
  });
});

describe("Cycle Change Tracker — classification priority order", () => {
  it("item 3 = Yes wins over everything else (postmenopausal-pattern)", () => {
    expect(
      classifyPattern({ item0: GATE_NO, item1: ITEM1_MULTIPLE, item2: YES, item3: YES })
    ).toBe(PATTERN.POSTMENOPAUSAL);
  });

  it("item 2 = Yes wins when item 3 is not Yes (late-transition-pattern)", () => {
    expect(classifyPattern({ item0: GATE_NO, item1: ITEM1_MULTIPLE, item2: YES, item3: NO })).toBe(
      PATTERN.LATE_TRANSITION
    );
    expect(classifyPattern({ item0: GATE_NO, item2: YES })).toBe(PATTERN.LATE_TRANSITION);
  });

  it("item 1 = 'more than once recently' wins when items 2 and 3 don't fire (early-transition-pattern)", () => {
    expect(classifyPattern({ item0: GATE_NO, item1: ITEM1_MULTIPLE, item2: NO, item3: NO })).toBe(
      PATTERN.EARLY_TRANSITION
    );
  });

  it("item 1 = 'once' falls to possible-early-change when nothing higher-priority fires", () => {
    expect(classifyPattern({ item0: GATE_NO, item1: ITEM1_ONCE, item2: NO, item3: NO })).toBe(
      PATTERN.POSSIBLE_EARLY_CHANGE
    );
  });

  it("falls through to no-cycle-marker when none of items 1-3 fire", () => {
    expect(classifyPattern({ item0: GATE_NO, item1: ITEM1_NO, item2: NO, item3: NO })).toBe(
      PATTERN.NO_CYCLE_MARKER
    );
    expect(classifyPattern({ item0: GATE_NOT_SURE, item1: NOT_SURE, item2: NOT_SURE })).toBe(
      PATTERN.NO_CYCLE_MARKER
    );
  });

  it("treats an unanswered item 2/3 as not triggering that tier, not as an error", () => {
    expect(classifyPattern({ item0: GATE_NO, item1: ITEM1_MULTIPLE })).toBe(PATTERN.EARLY_TRANSITION);
    expect(classifyPattern({ item0: GATE_NO })).toBe(PATTERN.NO_CYCLE_MARKER);
  });
});

describe("Cycle Change Tracker — descriptive notes (items 4-6, non-scoring)", () => {
  it("returns nothing when items 4-6 are all at their baseline / unanswered", () => {
    expect(getDescriptiveNotes({})).toEqual([]);
    expect(
      getDescriptiveNotes({ item4: FLOW_NO_CHANGE, item5: DURATION_NO_CHANGE, item6: PREDICT_USUALLY })
    ).toEqual([]);
  });

  it("reflects flow, duration, and predictability independently when non-baseline", () => {
    expect(getDescriptiveNotes({ item4: FLOW_HEAVIER })).toEqual(["flow-heavier"]);
    expect(getDescriptiveNotes({ item5: DURATION_LONGER })).toEqual(["duration-longer"]);
    expect(getDescriptiveNotes({ item6: PREDICT_SOMETIMES })).toEqual(["predictability-sometimes"]);
    expect(getDescriptiveNotes({ item6: PREDICT_RARELY })).toEqual(["predictability-rarely"]);
  });

  it("combines all three notes when all three are non-baseline", () => {
    expect(
      getDescriptiveNotes({ item4: FLOW_HEAVIER, item5: DURATION_LONGER, item6: PREDICT_RARELY })
    ).toEqual(["flow-heavier", "duration-longer", "predictability-rarely"]);
  });

  it("never invents a weighting — notes are independent of the computed pattern", () => {
    const gated = getDescriptiveNotes({ item0: GATE_YES, item4: FLOW_HEAVIER });
    expect(gated).toEqual(["flow-heavier"]);
  });
});

describe("Cycle Change Tracker — item 7 persistent-flag panel (independent of everything else)", () => {
  it("is false when unanswered, empty, or only 'None of these' is selected", () => {
    expect(hasPersistentBleedingFlag({})).toBe(false);
    expect(hasPersistentBleedingFlag({ item7: [] })).toBe(false);
    expect(hasPersistentBleedingFlag({ item7: [FLAG_NONE] })).toBe(false);
  });

  it("is true for any real selection", () => {
    expect(hasPersistentBleedingFlag({ item7: [FLAG_SPOTTING] })).toBe(true);
    expect(hasPersistentBleedingFlag({ item7: [FLAG_HEAVY] })).toBe(true);
    expect(hasPersistentBleedingFlag({ item7: [FLAG_POSTMENOPAUSAL_BLEEDING] })).toBe(true);
    expect(hasPersistentBleedingFlag({ item7: [FLAG_NONE, FLAG_HEAVY] })).toBe(true);
  });

  it("fires independently of the confounder gate — the panel must appear even when item 0 gates the pattern", () => {
    const responses = { item0: GATE_YES, item7: [FLAG_POSTMENOPAUSAL_BLEEDING] };
    expect(isConfounderGateActive(responses)).toBe(true);
    expect(classifyPattern(responses)).toBeNull();
    expect(hasPersistentBleedingFlag(responses)).toBe(true);
  });

  it("fires independently of the computed pattern in the non-gated case too", () => {
    const responses = { item0: GATE_NO, item1: ITEM1_NO, item2: NO, item3: NO, item7: [FLAG_SPOTTING] };
    expect(classifyPattern(responses)).toBe(PATTERN.NO_CYCLE_MARKER);
    expect(hasPersistentBleedingFlag(responses)).toBe(true);
  });
});
