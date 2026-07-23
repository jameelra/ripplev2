import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

// DismissalTracker.tsx imports the live vault store (browser-only globals),
// so it can't be safely imported into a node test environment — read its
// source text directly instead, the same technique used for the hand-authored
// static SEO pages.

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../client/src/pages/DismissalTracker.tsx"),
  "utf-8"
);

describe("Dismissal Tracker — rationale copy citation hardening", () => {
  it("exports DISMISSAL_TRACKER_RATIONALE so it can be pinned by a test", () => {
    expect(source).toMatch(/export const DISMISSAL_TRACKER_RATIONALE/);
  });

  it("does not state an uncited misdiagnosis percentage", () => {
    const match = source.match(/export const DISMISSAL_TRACKER_RATIONALE =\s*\n?\s*"((?:[^"\\]|\\.)*)"/);
    expect(match, "could not find DISMISSAL_TRACKER_RATIONALE string").not.toBeNull();
    expect(match![1]).not.toMatch(/\d+%/);
  });

  it("uses the exported constant in the rendered JSX rather than a duplicated inline string", () => {
    expect(source).toMatch(/\{DISMISSAL_TRACKER_RATIONALE\}/);
  });
});
