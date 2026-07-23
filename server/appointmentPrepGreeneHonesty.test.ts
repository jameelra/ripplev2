import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

// AppointmentPrep.tsx imports the live vault store (browser-only globals),
// so it can't be safely imported into a node test environment — read its
// source text directly instead, the same technique dismissalResponses.test.ts
// uses.
//
// Regression coverage for a real bug: this page used to compute a
// same-named-but-different "Greene Climacteric Scale" score from the daily
// symptom log's unrelated 12 fields (wrong instrument, wrong denominator —
// "/63" where even the real scale maxes out at 60). Every mention of the
// instrument name must now be tied to either real assessment history
// (the `latestGreene` value, sourced from the actual 21-item questionnaire)
// or a link to the real tool — never a fabricated number.

const sourcePath = path.resolve(import.meta.dirname, "../client/src/pages/AppointmentPrep.tsx");
const source = fs.readFileSync(sourcePath, "utf-8");

// Strips `//` line comments (developer-facing, not rendered/generated
// output) so they don't count as "Appointment Prep output" for this check.
function stripLineComments(src: string): string {
  return src
    .split("\n")
    .map((line) => (line.trim().startsWith("//") ? "" : line))
    .join("\n");
}

const REAL_DATA_OR_LINK_MARKERS = [
  "latestGreene", // real assessment data (also matches latestGreeneDate)
  "GREENE_TOOL_URL", // link to the real public tool
  'setActiveTab("greene_assessment")', // in-app link to the real assessment feature
];

describe("Appointment Prep — no fabricated Greene score", () => {
  const outputOnly = stripLineComments(source);

  it("every mention of the instrument name is tied to real assessment data or a link to the real tool", () => {
    const phrase = "Greene Climacteric Scale";
    const windowSize = 300;
    let index = outputOnly.indexOf(phrase);
    let matchCount = 0;

    while (index !== -1) {
      matchCount++;
      const start = Math.max(0, index - windowSize);
      const end = Math.min(outputOnly.length, index + phrase.length + windowSize);
      const context = outputOnly.slice(start, end);

      const hasMarker = REAL_DATA_OR_LINK_MARKERS.some((marker) => context.includes(marker));
      expect(
        hasMarker,
        `"${phrase}" at offset ${index} has no real-data/link marker within ${windowSize} chars.\nContext: ${context}`
      ).toBe(true);

      index = outputOnly.indexOf(phrase, index + phrase.length);
    }

    // Sanity check that the scan actually found the instrument name at all —
    // an empty result here would make every assertion above vacuously true.
    expect(matchCount).toBeGreaterThan(0);
  });

  it("never claims a fabricated score or denominator for Greene specifically", () => {
    // These are the exact phrases the original bug used ("My composite score
    // is {score}/63") — asserting their absence directly, not just via the
    // marker-proximity heuristic above. Checked against outputOnly (comments
    // stripped) since this file's own explanatory comments about the old bug
    // legitimately mention it by name. Not checking "clinically significant"
    // here — that phrase legitimately appears elsewhere in this file, in a
    // dismissal-response script about hormone levels, unrelated to Greene.
    expect(outputOnly).not.toContain("composite score");
    expect(outputOnly).not.toContain("/63");
    expect(outputOnly).not.toContain("Greene Climacteric Scale (Greene, 1998)"); // old unlinked citation-only mention
  });

  it("DISMISSAL_RESPONSES contains no mention of Greene at all (no {score} placeholder, no instrument name)", () => {
    const match = source.match(/export const DISMISSAL_RESPONSES: Record<string, string> = \{([\s\S]*?)\n\};/);
    expect(match, "expected to find the DISMISSAL_RESPONSES export").not.toBeNull();
    const body = match![1];
    expect(body).not.toContain("Greene");
    expect(body).not.toContain("{score}");
  });

  it("links the real tool via the same URL constant everywhere, not a re-typed string", () => {
    const toolUrlDeclarations = [...source.matchAll(/GREENE_TOOL_URL\s*=\s*"([^"]+)"/g)];
    expect(toolUrlDeclarations).toHaveLength(1);
    expect(toolUrlDeclarations[0][1]).toBe("https://ripplehealth.app/tools/greene-climacteric-scale/");
  });
});
