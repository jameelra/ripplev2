import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { COMMON_DISMISSAL_RESPONSES } from "../shared/dismissalLog";

// Safety net against transcription drift: the static HTML page is hand-authored
// (deliberately, so the FAQ and quick-select phrases are visible to crawlers
// without JS), so this cross-checks its markup against the same data used by
// the interactive island and confirms the FAQ JSON-LD matches the visible text.

const pagePath = path.resolve(import.meta.dirname, "../client/tools/dismissal-tracker/index.html");
const html = fs.readFileSync(pagePath, "utf-8");

function extractFaqJsonLd(source: string): Array<{ name: string; text: string }> {
  const match = source.match(/"@type":\s*"FAQPage"[\s\S]*?"mainEntity":\s*(\[[\s\S]*?\n\s{6}\])\s*\n\s*\}\s*\n\s*<\/script>/);
  if (!match) throw new Error("Could not find FAQPage JSON-LD block");
  const parsed = JSON.parse(match[1]) as Array<{ name: string; acceptedAnswer: { text: string } }>;
  return parsed.map(q => ({ name: q.name, text: q.acceptedAnswer.text }));
}

describe("Dismissal Tracker — static page markup", () => {
  it("renders every quick-select phrase from shared/dismissalLog.ts, in order", () => {
    const buttonRe = /class="dismissal-quick-phrase[^"]*">([^<]+)<\/button>/g;
    const rendered = [...html.matchAll(buttonRe)].map(m => m[1]);
    expect(rendered).toEqual([...COMMON_DISMISSAL_RESPONSES]);
  });

  it("matches the visible FAQ content word-for-word against the FAQPage JSON-LD", () => {
    const jsonLdFaq = extractFaqJsonLd(html);
    expect(jsonLdFaq.length).toBeGreaterThanOrEqual(5);
    expect(jsonLdFaq.length).toBeLessThanOrEqual(8);

    for (const { name, text } of jsonLdFaq) {
      expect(html, `question heading for "${name}"`).toContain(`>${name}</h3>`);
      const normalizedHtml = html.replace(/\s+/g, " ");
      const normalizedText = text.replace(/\s+/g, " ");
      expect(normalizedHtml, `answer text for "${name}"`).toContain(normalizedText);
    }
  });

  it("declares canonical URL, title, and JSON-LD blocks required for SEO", () => {
    expect(html).toContain('<link rel="canonical" href="https://ripplehealth.app/tools/dismissal-tracker/" />');
    expect(html).toMatch(/<title>[^<]*Dismissal Tracker[^<]*<\/title>/);
    expect(html.match(/"@type":\s*"FAQPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"MedicalWebPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"WebApplication"/g)?.length).toBe(1);
  });

  it("has a required clinic-name and response field, and an optional clinician field", () => {
    expect(html).toContain('id="dismissal-clinic"');
    expect(html).toContain('id="dismissal-response"');
    expect(html).toContain('id="dismissal-clinician"');
  });

  it("cross-links to the Greene Climacteric Scale page", () => {
    expect(html).toContain("https://ripplehealth.app/tools/greene-climacteric-scale/");
  });
});
