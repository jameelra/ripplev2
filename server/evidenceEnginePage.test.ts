import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { CHECKLIST_QUESTIONS } from "../shared/evidenceQualityChecklist";

// Safety net against transcription drift: the static HTML page is hand-authored
// (deliberately, so the FAQ and checklist questions are visible to crawlers
// without JS), so this cross-checks its markup against the same data used by
// the interactive island and confirms the FAQ JSON-LD matches the visible text.

const pagePath = path.resolve(import.meta.dirname, "../client/tools/evidence-engine/index.html");
const html = fs.readFileSync(pagePath, "utf-8");

function extractFaqJsonLd(source: string): Array<{ name: string; text: string }> {
  const match = source.match(/"@type":\s*"FAQPage"[\s\S]*?"mainEntity":\s*(\[[\s\S]*?\n\s{6}\])\s*\n\s*\}\s*\n\s*<\/script>/);
  if (!match) throw new Error("Could not find FAQPage JSON-LD block");
  const parsed = JSON.parse(match[1]) as Array<{ name: string; acceptedAnswer: { text: string } }>;
  return parsed.map(q => ({ name: q.name, text: q.acceptedAnswer.text }));
}

describe("Evidence Engine page — static page markup", () => {
  it("renders every checklist question from shared/evidenceQualityChecklist.ts, in order, as a fieldset legend", () => {
    const legendRe = /<legend class="text-sm font-semibold text-\[#1a2b22\] px-0\.5">\s*([\s\S]*?)\s*<\/legend>/g;
    const rendered = [...html.matchAll(legendRe)].map(m => m[1].replace(/\s+/g, " ").trim());
    expect(rendered).toEqual(CHECKLIST_QUESTIONS.map(q => q.question));
  });

  it("gives every checklist question a data-question-id matching its shared module id, in order", () => {
    const idRe = /data-question-id="([^"]+)"/g;
    const rendered = [...html.matchAll(idRe)].map(m => m[1]);
    expect(rendered).toEqual(CHECKLIST_QUESTIONS.map(q => q.id));
  });

  it("keeps the 'heuristic, not a verdict' label in the static markup, not just injected by JS", () => {
    expect(html).toContain("This is a heuristic, not a verdict.");
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
    expect(html).toContain('<link rel="canonical" href="https://ripplehealth.app/tools/evidence-engine/" />');
    expect(html).toMatch(/<title>[^<]*Evidence[^<]*<\/title>/);
    expect(html.match(/"@type":\s*"FAQPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"MedicalWebPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"WebApplication"/g)?.length).toBe(1);
  });

  it("names the WebApplication schema after the checklist, not the gated in-app Evidence Engine feature", () => {
    // The real Evidence Engine requires tracking data + a Pro subscription;
    // claiming it as a free $0 WebApplication would misrepresent the product.
    const webAppMatch = html.match(/"@type":\s*"WebApplication"[\s\S]*?"name":\s*"([^"]+)"/);
    expect(webAppMatch?.[1]).toBe("Evidence Quality Checklist");
  });

  it("does not claim certainty or endorsement it can't back up", () => {
    const normalized = html.replace(/\s+/g, " ");
    expect(normalized).toContain("Ripple isn't endorsed by, recommended by, or affiliated with any of these organisations");
  });

  it("cross-links to both existing tool pages", () => {
    expect(html).toContain("https://ripplehealth.app/tools/greene-climacteric-scale/");
    expect(html).toContain("https://ripplehealth.app/tools/dismissal-tracker/");
  });

  it("lists all five verified sources with full locators", () => {
    expect(html).toContain("Rossouw JE, Anderson GL, Prentice RL");
    expect(html).toContain("Manson JE, Chlebowski RT, Stefanick ML");
    expect(html).toContain("doi:10.1097/GME.0000000000002028");
    expect(html).toContain("NICE guideline NG23");
    expect(html).toContain("updated November 2024");
    expect(html).toContain("Greene JG. Constructing a Standard Climacteric Scale");
  });

  it("cites the 2022 NAMS statement as published, but doesn't call the organisation NAMS in the present tense", () => {
    expect(html).toContain("published under the organisation's former name, NAMS, in 2022");
    // The present-tense references to the org elsewhere on the page should
    // use its current name.
    const currentTenseMentions = html.match(/current guidance from ([^.]+)\./g) ?? [];
    for (const mention of currentTenseMentions) {
      expect(mention).toContain("The Menopause Society");
    }
  });
});
