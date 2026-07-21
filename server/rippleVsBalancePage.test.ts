import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

// Safety net against transcription drift: the static HTML page is hand-authored
// (deliberately, so the comparison table and FAQ are visible to crawlers
// without JS), so this cross-checks its markup and confirms the FAQ JSON-LD
// matches the visible text.

const pagePath = path.resolve(import.meta.dirname, "../client/tools/ripple-vs-balance/index.html");
const html = fs.readFileSync(pagePath, "utf-8");

// Hand-authored prose in this file wraps across lines, so raw substring
// checks on a multi-word claim can miss a match that straddles a line break.
const normalizedHtml = html.replace(/\s+/g, " ");

function extractFaqJsonLd(source: string): Array<{ name: string; text: string }> {
  const match = source.match(/"@type":\s*"FAQPage"[\s\S]*?"mainEntity":\s*(\[[\s\S]*?\n\s{6}\])\s*\n\s*\}\s*\n\s*<\/script>/);
  if (!match) throw new Error("Could not find FAQPage JSON-LD block");
  const parsed = JSON.parse(match[1]) as Array<{ name: string; acceptedAnswer: { text: string } }>;
  return parsed.map(q => ({ name: q.name, text: q.acceptedAnswer.text }));
}

// Walks div/section open/close tags to find the ancestor chain of a given
// element id — guards against nesting any print-only container inside a
// no-print ancestor, per the fix on the Appointment Prep page. This page
// doesn't actually use a print-only container (the comparison table is
// static, so print CSS just hides chrome via .no-print rather than swapping
// in a JS-populated clone) — this test documents and locks in that choice.
function ancestorClassListsOf(source: string, elementId: string): string[][] {
  const tagRe = /<(div|section)\b([^>]*)>|<\/(div|section)>/g;
  const stack: string[][] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(source)) !== null) {
    const [, openTag, attrs, closeTag] = match;
    if (openTag) {
      const classAttr = attrs.match(/class="([^"]*)"/)?.[1] ?? "";
      const idAttr = attrs.match(/id="([^"]*)"/)?.[1];
      if (idAttr === elementId) {
        return stack.map(classes => classes);
      }
      stack.push(classAttr.split(/\s+/).filter(Boolean));
    } else if (closeTag) {
      stack.pop();
    }
  }

  throw new Error(`Could not find an element with id="${elementId}"`);
}

describe("Ripple vs Balance page — comparison table", () => {
  it("has no print-only container at all (the table is static, not JS-populated)", () => {
    expect(html).not.toMatch(/print-only/);
  });

  it("does not nest the printable comparison table inside any no-print ancestor", () => {
    const ancestorClasses = ancestorClassListsOf(html, "comparison-table");
    const noPrintAncestor = ancestorClasses.find(classes => classes.includes("no-print"));
    expect(noPrintAncestor, `ancestors were: ${JSON.stringify(ancestorClasses)}`).toBeUndefined();
  });

  it("covers all six required categories, each with a Balance and a Ripple cell", () => {
    const categories = ["Tracking", "Reports", "Trend analysis", "Data entry", "Platform", "Cost category"];
    for (const category of categories) {
      expect(html, `category: "${category}"`).toContain(`>${category}</th>`);
    }
    // 6 data rows + 1 header row = 7 <tr> total
    expect(html.match(/<tr/g)?.length).toBe(7);
  });

  it("uses semantic table markup with scoped headers", () => {
    expect(html).toContain('<th scope="col"');
    expect(html).toContain('<th scope="row"');
  });

  it("honestly states neither app integrates with Apple Health, Garmin, or MyFitnessPal in the Data entry row", () => {
    const rowMatch = html.match(/Data entry[\s\S]*?<\/tr>/);
    expect(rowMatch).not.toBeNull();
    const row = rowMatch![0];
    expect(row).toContain("no integration with Apple Health, Garmin, or MyFitnessPal");
    expect((row.match(/no integration with Apple Health, Garmin, or MyFitnessPal/g) ?? []).length).toBe(2);
  });
});

describe("Ripple vs Balance page — hard prohibitions", () => {
  it("never names Dr Newson, Newson Health, or prescribing practices", () => {
    expect(normalizedHtml).not.toMatch(/Newson/i);
    expect(normalizedHtml).not.toMatch(/prescrib/i);
  });

  it("never states a star rating for either app", () => {
    expect(normalizedHtml).not.toMatch(/★/);
    expect(normalizedHtml).not.toMatch(/\d(\.\d)?\s*(out of|\/)\s*5\b/i);
    expect(normalizedHtml).not.toMatch(/\bstar rating\b/i);
  });

  it("never states a dollar figure for either app's pricing", () => {
    expect(normalizedHtml).not.toMatch(/\$\d/);
  });

  it("never claims Balance's Health Report is broken or unreliable", () => {
    const lower = normalizedHtml.toLowerCase();
    expect(lower).not.toMatch(/\bbroken\b/);
    expect(lower).not.toMatch(/\bunreliable\b/);
    expect(lower).not.toMatch(/\bbuggy\b/);
    expect(lower).not.toMatch(/\bglitchy\b/);
  });

  it("never delivers a better/worse verdict", () => {
    expect(normalizedHtml).not.toMatch(/\bbetter than\b/i);
    expect(normalizedHtml).not.toMatch(/\bworse than\b/i);
    expect(normalizedHtml).not.toMatch(/\bsuperior to\b/i);
    expect(normalizedHtml).not.toMatch(/\binferior to\b/i);
    expect(normalizedHtml).not.toMatch(/\bbest (app|choice|option)\b/i);
  });

  it("does not use fieldset/legend anywhere on the page", () => {
    expect(html).not.toMatch(/<fieldset/);
    expect(html).not.toMatch(/<legend/);
  });
});

describe("Ripple vs Balance page — static page markup", () => {
  it("matches the visible FAQ content word-for-word against the FAQPage JSON-LD", () => {
    const jsonLdFaq = extractFaqJsonLd(html);
    expect(jsonLdFaq.length).toBeGreaterThanOrEqual(5);
    expect(jsonLdFaq.length).toBeLessThanOrEqual(8);

    for (const { name, text } of jsonLdFaq) {
      expect(html, `question heading for "${name}"`).toContain(`>${name}</h3>`);
      const normalizedText = text.replace(/\s+/g, " ");
      expect(normalizedHtml, `answer text for "${name}"`).toContain(normalizedText);
    }
  });

  it("declares canonical URL, title, and JSON-LD blocks required for SEO", () => {
    expect(html).toContain('<link rel="canonical" href="https://ripplehealth.app/tools/ripple-vs-balance/" />');
    expect(html).toMatch(/<title>[^<]*Balance[^<]*<\/title>/);
    expect(html.match(/"@type":\s*"FAQPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"MedicalWebPage"/g)?.length).toBe(1);
  });

  it("does not claim certainty or endorsement it can't back up", () => {
    expect(normalizedHtml).toContain(
      "Ripple is not endorsed by, recommended by, or affiliated with ORCHA, the NHS, Apple, or Balance"
    );
  });

  it("cross-links to all five existing tool pages and the Balance Alternative page", () => {
    expect(html).toContain("https://ripplehealth.app/tools/greene-climacteric-scale/");
    expect(html).toContain("https://ripplehealth.app/tools/dismissal-tracker/");
    expect(html).toContain("https://ripplehealth.app/tools/evidence-engine/");
    expect(html).toContain("https://ripplehealth.app/tools/appointment-prep/");
    expect(html).toContain("https://ripplehealth.app/tools/hrt-tracker/");
    expect(html).toContain("https://ripplehealth.app/tools/balance-alternative/");
  });

  it("frames this as a comparison, not a verdict", () => {
    expect(normalizedHtml).toContain("This is a comparison, not a verdict");
  });
});
