import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  BALANCE_COMMON_REQUESTS,
  BALANCE_CREDENTIALS,
  BALANCE_FREE_TIER,
  BALANCE_PAID_TIER,
  RIPPLE_ANSWERS,
} from "../shared/balanceComparisonFacts";

// Safety net against transcription drift: the static HTML page is hand-authored
// (deliberately, so the FAQ is visible to crawlers without JS), so this
// cross-checks its markup against the shared source-of-truth facts module and
// confirms the FAQ JSON-LD matches the visible text.

const pagePath = path.resolve(import.meta.dirname, "../client/tools/balance-alternative/index.html");
const html = fs.readFileSync(pagePath, "utf-8");

// Hand-authored prose in this file wraps across lines, so raw substring
// checks on a multi-word fact can miss a match that straddles a line break.
// Normalize whitespace on both sides before comparing prose, same approach
// already used for FAQ-vs-JSON-LD parity checks elsewhere in this repo.
const normalizedHtml = html.replace(/\s+/g, " ");
const norm = (s: string) => s.replace(/\s+/g, " ");

function extractFaqJsonLd(source: string): Array<{ name: string; text: string }> {
  const match = source.match(/"@type":\s*"FAQPage"[\s\S]*?"mainEntity":\s*(\[[\s\S]*?\n\s{6}\])\s*\n\s*\}\s*\n\s*<\/script>/);
  if (!match) throw new Error("Could not find FAQPage JSON-LD block");
  const parsed = JSON.parse(match[1]) as Array<{ name: string; acceptedAnswer: { text: string } }>;
  return parsed.map(q => ({ name: q.name, text: q.acceptedAnswer.text }));
}

describe("Balance Alternative page — content-drift guard against shared/balanceComparisonFacts.ts", () => {
  it("states every verified Balance credential verbatim", () => {
    for (const fact of Object.values(BALANCE_CREDENTIALS)) {
      expect(normalizedHtml, `credential: "${fact}"`).toContain(norm(fact));
    }
  });

  it("states every verified Balance free-tier fact verbatim", () => {
    for (const fact of Object.values(BALANCE_FREE_TIER)) {
      expect(normalizedHtml, `free tier fact: "${fact}"`).toContain(norm(fact));
    }
  });

  it("states every verified Balance paid-tier fact verbatim", () => {
    for (const fact of Object.values(BALANCE_PAID_TIER)) {
      expect(normalizedHtml, `paid tier fact: "${fact}"`).toContain(norm(fact));
    }
  });

  it("names only the two authorized gaps, framed as commonly requested", () => {
    for (const gap of Object.values(BALANCE_COMMON_REQUESTS)) {
      expect(normalizedHtml, `gap: "${gap}"`).toContain(norm(gap));
    }
    expect(normalizedHtml).toContain("commonly requested additions");
    expect(normalizedHtml).toMatch(/neither is a defect/i);
    expect(normalizedHtml).not.toMatch(/\bflaw\b/i);
  });

  it("gives Ripple's verified, codebase-checked answer to each gap", () => {
    for (const answer of Object.values(RIPPLE_ANSWERS)) {
      expect(normalizedHtml, `answer: "${answer}"`).toContain(norm(answer));
    }
  });
});

describe("Balance Alternative page — hard prohibitions", () => {
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

  it("never claims or implies Ripple has Apple Health, Garmin, or MyFitnessPal integration", () => {
    expect(normalizedHtml).not.toMatch(/Ripple (integrates|connects|syncs)/i);
  });

  it("does not use fieldset/legend anywhere on the page", () => {
    expect(html).not.toMatch(/<fieldset/);
    expect(html).not.toMatch(/<legend/);
  });
});

describe("Balance Alternative page — static page markup", () => {
  it("matches the visible FAQ content word-for-word against the FAQPage JSON-LD", () => {
    const jsonLdFaq = extractFaqJsonLd(html);
    expect(jsonLdFaq.length).toBeGreaterThanOrEqual(5);
    expect(jsonLdFaq.length).toBeLessThanOrEqual(8);

    for (const { name, text } of jsonLdFaq) {
      expect(html, `question heading for "${name}"`).toContain(`>${name}</h3>`);
      expect(normalizedHtml, `answer text for "${name}"`).toContain(norm(text));
    }
  });

  it("declares canonical URL, title, and JSON-LD blocks required for SEO", () => {
    expect(html).toContain('<link rel="canonical" href="https://ripplehealth.app/tools/balance-alternative/" />');
    expect(html).toMatch(/<title>[^<]*Balance[^<]*<\/title>/);
    expect(html.match(/"@type":\s*"FAQPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"MedicalWebPage"/g)?.length).toBe(1);
  });

  it("does not claim certainty or endorsement it can't back up", () => {
    expect(normalizedHtml).toContain(
      "Ripple is not endorsed by, recommended by, or affiliated with ORCHA, the NHS, Apple, or Balance"
    );
  });

  it("cross-links to all five existing tool pages and the Ripple vs Balance page", () => {
    expect(html).toContain("https://ripplehealth.app/tools/greene-climacteric-scale/");
    expect(html).toContain("https://ripplehealth.app/tools/dismissal-tracker/");
    expect(html).toContain("https://ripplehealth.app/tools/evidence-engine/");
    expect(html).toContain("https://ripplehealth.app/tools/appointment-prep/");
    expect(html).toContain("https://ripplehealth.app/tools/hrt-tracker/");
    expect(html).toContain("https://ripplehealth.app/tools/ripple-vs-balance/");
  });

  it("frames this as a comparison, not a takedown", () => {
    expect(normalizedHtml).toContain("not a case against Balance");
  });
});
