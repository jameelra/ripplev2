import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

// AppointmentPrep.tsx imports the live vault store (browser-only globals),
// so it can't be safely imported into a node test environment — read its
// source text directly instead, the same technique used for the hand-authored
// static SEO pages, and extract just the field this pass touches.

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../client/src/pages/AppointmentPrep.tsx"),
  "utf-8"
);

function extractDismissalResponse(src: string, key: string): string {
  const re = new RegExp(`"${key}":\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const match = src.match(re);
  if (!match) throw new Error(`Could not find DISMISSAL_RESPONSES["${key}"] in AppointmentPrep.tsx`);
  return match[1];
}

describe("Appointment Prep — DISMISSAL_RESPONSES citation hardening", () => {
  it("is exported so it can be pinned by a test", () => {
    expect(source).toMatch(/export const DISMISSAL_RESPONSES/);
  });

  it("does not claim antidepressants are overprescribed", () => {
    const antidepressants = extractDismissalResponse(source, "antidepressants");
    expect(antidepressants).not.toMatch(/overprescri/i);
  });

  it("grounds the antidepressants script in NG23 recommendation 1.5.21, scoped to no depression diagnosis", () => {
    const antidepressants = extractDismissalResponse(source, "antidepressants");
    expect(antidepressants).toMatch(/NG23/);
    expect(antidepressants).toMatch(/1\.5\.21/);
    expect(antidepressants).toMatch(/depression hasn't been diagnosed/i);
  });
});
