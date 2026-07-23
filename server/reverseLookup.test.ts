import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { heuristicReverseLookup, UNVERIFIED_FREQUENCY_NOTE } from "./routers";

const routersSource = fs.readFileSync(path.resolve(import.meta.dirname, "./routers.ts"), "utf-8");

// Citation-hardening regression test: this reverse-symptom-lookup database
// used to attach an uncited "X% of perimenopausal women" figure to each of
// its eight entries, and those figures were displayed to users as a
// statistic badge (client/src/pages/ReverseLookup.tsx). None of the eight
// have a verifiable per-symptom prevalence source, so every entry must use
// the shared, honest, non-quantified frequencyNote instead — never a
// reintroduced percentage.

describe("reverse symptom lookup — frequencyNote", () => {
  it("returns entries for a known keyword", () => {
    const results = heuristicReverseLookup("burning tongue");
    expect(results).not.toBeNull();
    expect(results!.length).toBeGreaterThan(0);
  });

  it("gives every matched entry the shared, qualitative frequencyNote", () => {
    const queries = [
      "burning tongue",
      "skin crawling",
      "frozen shoulder",
      "hair thinning",
      "heart palpitations",
      "electric shock",
      "dry eyes",
      "tinnitus",
    ];
    for (const query of queries) {
      const results = heuristicReverseLookup(query);
      expect(results, `results for "${query}"`).not.toBeNull();
      for (const result of results!) {
        expect(result.frequencyNote, `frequencyNote for "${result.name}"`).toBe(UNVERIFIED_FREQUENCY_NOTE);
      }
    }
  });

  it("never presents a percentage or numeric prevalence figure", () => {
    const queries = [
      "burning tongue", "skin crawling", "frozen shoulder", "hair thinning",
      "heart palpitations", "electric shock", "dry eyes", "tinnitus",
    ];
    for (const query of queries) {
      const results = heuristicReverseLookup(query);
      for (const result of results!) {
        expect(result.frequencyNote).not.toMatch(/\d+\s*%/);
      }
    }
  });

  it("returns null for a query with no match, rather than fabricating a result", () => {
    expect(heuristicReverseLookup("completely unrelated made up symptom xyz")).toBeNull();
  });
});

describe("reverse symptom lookup — AI fallback guardrail", () => {
  it("no longer requests a coincidenceRate field anywhere in the router", () => {
    expect(routersSource).not.toMatch(/coincidenceRate/);
  });

  it("instructs the LLM fallback not to invent a percentage", () => {
    expect(routersSource).toMatch(/do not invent a specific percentage/i);
  });
});
