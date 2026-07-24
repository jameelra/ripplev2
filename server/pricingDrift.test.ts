import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// ─── Pricing drift guard ────────────────────────────────────────────────────
// The whole point of shared/pricing.ts is that no other file in the UI layer
// ever writes a dollar amount as a string literal. This test statically scans
// the pages known to render Ripple's own subscription prices and fails if a
// hardcoded currency string reappears — which is exactly how this codebase
// ended up with three contradictory price sets (Evidence Engine $9.99/mo,
// pricing cards $5.00/mo, and a value-tip box that implied yet another set).
//
// A line tagged with THIRD_PARTY_PRICE_OK is exempt: it's a competitor's
// list price (a fact about someone else's product), not Ripple's own price,
// so it isn't derived from shared/pricing.ts.

const UI_FILES_WITH_PRICING = [
  "../client/src/pages/EvidenceEngine.tsx",
  "../client/src/pages/UpgradeHub.tsx",
];

// Matches a raw dollar amount like "$9.99", "$59.99/yr", "$5" — the pattern
// that should only ever appear inside shared/pricing.ts's display helpers.
const HARDCODED_CURRENCY_RE = /\$\d+(\.\d{1,2})?(\/(mo|yr))?/;

function readLines(relativePath: string): string[] {
  const fullPath = path.resolve(import.meta.dirname, relativePath);
  return fs.readFileSync(fullPath, "utf-8").split("\n");
}

describe("pricing drift guard — UI layer must not hardcode currency", () => {
  for (const file of UI_FILES_WITH_PRICING) {
    it(`${file} has no hardcoded dollar amounts outside shared/pricing.ts`, () => {
      const lines = readLines(file);
      const offenders: string[] = [];

      lines.forEach((line, i) => {
        if (line.includes("THIRD_PARTY_PRICE_OK")) return;
        // The line above a THIRD_PARTY_PRICE_OK comment is itself exempt too
        // when the marker is on its own comment line directly preceding it.
        const prevLine = lines[i - 1] ?? "";
        if (prevLine.includes("THIRD_PARTY_PRICE_OK") && line.trim().startsWith("{")) return;

        if (HARDCODED_CURRENCY_RE.test(line)) {
          offenders.push(`  line ${i + 1}: ${line.trim()}`);
        }
      });

      expect(offenders, `Hardcoded currency strings found in ${file}:\n${offenders.join("\n")}`).toEqual([]);
    });
  }

  it("shared/pricing.ts's code (excluding comments) builds strings, never hardcodes them", () => {
    const lines = readLines("../shared/pricing.ts")
      .filter((line) => !/^(\/\/|\/\*|\*)/.test(line.trim()));
    // shared/pricing.ts legitimately contains cent amounts (799, 5999, ...)
    // and JSDoc examples like "$7.99/mo", but its actual code should only ever
    // build a currency string from cents via centsToDisplay — never embed a
    // pre-formatted "$X.XX" literal outside of that one function.
    const offenders = lines.filter((line) => HARDCODED_CURRENCY_RE.test(line) && !line.includes("centsToDisplay"));
    expect(offenders).toEqual([]);
  });

  it("server/billing/products.ts contains no hardcoded dollar amounts", () => {
    const lines = readLines("./billing/products.ts");
    const offenders = lines.filter((line) => HARDCODED_CURRENCY_RE.test(line));
    expect(offenders).toEqual([]);
  });
});
