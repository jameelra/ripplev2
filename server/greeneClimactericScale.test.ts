import { describe, expect, it } from "vitest";
import {
  GREENE_ITEMS,
  GREENE_ITEM_COUNT,
  GREENE_RESPONSE_OPTIONS,
  findMissingItems,
  scoreGreeneClimactericScale,
  describeRelativeLevel,
  type GreeneResponses,
} from "../shared/greeneClimactericScale";

describe("Greene Climacteric Scale — instrument shape", () => {
  it("has exactly 21 items, numbered 1-21 with no gaps", () => {
    expect(GREENE_ITEM_COUNT).toBe(21);
    expect(GREENE_ITEMS.map(i => i.id)).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
  });

  it("has the standard four-point response scale", () => {
    expect(GREENE_RESPONSE_OPTIONS.map(o => o.label)).toEqual([
      "Not at all",
      "A little",
      "Quite a bit",
      "Extremely",
    ]);
    expect(GREENE_RESPONSE_OPTIONS.map(o => o.value)).toEqual([0, 1, 2, 3]);
  });

  it("groups items into the standard subscale boundaries", () => {
    const bySubscale = (subscale: string) => GREENE_ITEMS.filter(i => i.subscale === subscale).map(i => i.id);
    expect(bySubscale("anxiety")).toEqual([1, 2, 3, 4, 5, 6]);
    expect(bySubscale("depression")).toEqual([7, 8, 9, 10, 11]);
    expect(bySubscale("somatic")).toEqual([12, 13, 14, 15, 16, 17, 18]);
    expect(bySubscale("vasomotor")).toEqual([19, 20]);
    expect(bySubscale("sexual")).toEqual([21]);
  });
});

describe("Greene Climacteric Scale — scoring", () => {
  // Worked example A: every item 1-20 answered "A little" (1), item 21 = 1.
  // By hand: anxiety 6x1=6, depression 5x1=5, psychological=11,
  // somatic 7x1=7, vasomotor 2x1=2, total=6+5+7+2=20, sexual=1.
  it("worked example A — uniform 'a little' responses", () => {
    const responses: GreeneResponses = {};
    for (let id = 1; id <= 20; id++) responses[id] = 1;
    responses[21] = 1;

    expect(findMissingItems(responses)).toEqual([]);
    expect(scoreGreeneClimactericScale(responses)).toEqual({
      anxiety: 6,
      depression: 5,
      psychological: 11,
      somatic: 7,
      vasomotor: 2,
      total: 20,
      sexual: 1,
    });
  });

  // Worked example B: mixed severity.
  // Anxiety (1-6): 3,3,2,2,1,1 = 12
  // Depression (7-11): 2,2,1,1,0 = 6  -> psychological = 18
  // Somatic (12-18): 1,0,0,2,3,1,0 = 7
  // Vasomotor (19-20): 3,2 = 5
  // Total (1-20) = 12+6+7+5 = 30
  // Sexual (21) = 2
  it("worked example B — mixed severity responses", () => {
    const responses: GreeneResponses = {
      1: 3, 2: 3, 3: 2, 4: 2, 5: 1, 6: 1,
      7: 2, 8: 2, 9: 1, 10: 1, 11: 0,
      12: 1, 13: 0, 14: 0, 15: 2, 16: 3, 17: 1, 18: 0,
      19: 3, 20: 2,
      21: 2,
    };

    expect(findMissingItems(responses)).toEqual([]);
    expect(scoreGreeneClimactericScale(responses)).toEqual({
      anxiety: 12,
      depression: 6,
      psychological: 18,
      somatic: 7,
      vasomotor: 5,
      total: 30,
      sexual: 2,
    });
  });

  it("reports every unanswered item id via findMissingItems", () => {
    const responses: GreeneResponses = { 1: 0, 2: 1 };
    const missing = findMissingItems(responses);
    expect(missing).toHaveLength(19);
    expect(missing).not.toContain(1);
    expect(missing).not.toContain(2);
    expect(missing).toContain(21);
  });

  it("throws rather than silently under-scoring an incomplete response set", () => {
    expect(() => scoreGreeneClimactericScale({ 1: 0 })).toThrow(/Missing response/);
  });
});

describe("Greene Climacteric Scale — descriptive (non-diagnostic) banding", () => {
  it("splits the possible range into thirds without asserting clinical cutoffs", () => {
    expect(describeRelativeLevel(0, 63)).toBe("lower");
    expect(describeRelativeLevel(20, 63)).toBe("lower");
    expect(describeRelativeLevel(21, 63)).toBe("middle");
    expect(describeRelativeLevel(41, 63)).toBe("middle");
    expect(describeRelativeLevel(42, 63)).toBe("upper");
    expect(describeRelativeLevel(63, 63)).toBe("upper");
  });
});
