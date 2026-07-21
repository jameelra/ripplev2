import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { GREENE_ITEMS, GREENE_RESPONSE_OPTIONS } from "../shared/greeneClimactericScale";

// Safety net against transcription drift: the static HTML page is hand-authored
// (deliberately, so the 21 items are visible to crawlers without JS), so this
// cross-checks its item markup against the same verified data the scoring
// module uses, item-by-item, rather than trusting the two stay in sync by hand.

const pagePath = path.resolve(import.meta.dirname, "../client/tools/greene-climacteric-scale/index.html");
const html = fs.readFileSync(pagePath, "utf-8");

function extractItems(source: string): Array<{ id: number; text: string }> {
  const items: Array<{ id: number; text: string }> = [];
  const fieldsetRe = /data-item-id="(\d+)"[\s\S]*?<span class="greene-item-text">([^<]+)<\/span>/g;
  let match: RegExpExecArray | null;
  while ((match = fieldsetRe.exec(source)) !== null) {
    items.push({ id: Number(match[1]), text: match[2] });
  }
  return items;
}

describe("Greene Climacteric Scale — static page markup", () => {
  it("renders all 21 items with wording matching shared/greeneClimactericScale.ts exactly", () => {
    const pageItems = extractItems(html);
    expect(pageItems).toHaveLength(21);
    expect(pageItems).toEqual(GREENE_ITEMS.map(i => ({ id: i.id, text: i.text })));
  });

  it("gives each item exactly 4 radio inputs with the standard response values", () => {
    for (const item of GREENE_ITEMS) {
      const groupRe = new RegExp(`name="item-${item.id}" value="(\\d)"`, "g");
      const values = [...html.matchAll(groupRe)].map(m => Number(m[1]));
      expect(values, `item ${item.id}`).toEqual([0, 1, 2, 3]);
    }
  });

  it("labels the response options with the standard wording, in order", () => {
    for (const opt of GREENE_RESPONSE_OPTIONS) {
      expect(html).toContain(`value="${opt.value}"`);
    }
    // Spot-check the labels appear on the page (they're shared across all 21 groups).
    expect(html).toContain(">\n          Not at all\n");
    expect(html).toContain(">\n          A little\n");
    expect(html).toContain(">\n          Quite a bit\n");
    expect(html).toContain(">\n          Extremely\n");
  });

  it("marks each item's first radio as required so the form can't submit incomplete", () => {
    for (const item of GREENE_ITEMS) {
      const re = new RegExp(`name="item-${item.id}" value="0" class="accent-\\[#4a8a72\\]" required`);
      expect(html, `item ${item.id} should require an answer`).toMatch(re);
    }
  });

  it("does not use fieldset/legend for the item boxes (legend straddles the border and overflows on wrap)", () => {
    expect(html).not.toMatch(/<fieldset/);
    expect(html).not.toMatch(/<legend/);
  });

  it("links each radiogroup to its item via aria-labelledby, not a duplicated aria-label", () => {
    for (const item of GREENE_ITEMS) {
      expect(html).toContain(`id="greene-label-${item.id}"`);
      expect(html).toContain(`role="radiogroup" aria-labelledby="greene-label-${item.id}"`);
    }
    expect(html).not.toMatch(/role="radiogroup" aria-label="/);
  });

  it("declares canonical URL, title, and JSON-LD blocks required for SEO", () => {
    expect(html).toContain('<link rel="canonical" href="https://ripplehealth.app/tools/greene-climacteric-scale/" />');
    expect(html).toMatch(/<title>[^<]*Greene Climacteric Scale[^<]*<\/title>/);
    expect(html.match(/"@type":\s*"FAQPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"MedicalWebPage"/g)?.length).toBe(1);
  });

  it("cross-links to the HRT Tracker page", () => {
    expect(html).toContain("https://ripplehealth.app/tools/hrt-tracker/");
  });
});
