import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

// SEO content batch — Track A (un-gated per-symptom pages) and Track B
// (medical dismissal narrative pieces). These are pure content pages (no
// interactive scoring, no main.ts), so they don't need the print/no-print
// ancestor check the tool pages use — none of them ship a printable asset.
// Common invariants below mirror the existing per-page test files
// (e.g. server/dismissalTrackerPage.test.ts, server/appointmentPrepPage.test.ts).

const TRACK_A_SLUGS = [
  "brain-fog-perimenopause",
  "night-sweats-perimenopause",
  "anxiety-mood-changes-perimenopause",
  "irregular-periods-perimenopause",
  "joint-pain-perimenopause",
  "vaginal-dryness-perimenopause",
];

const TRACK_B_SLUGS = [
  "medical-dismissal-perimenopause",
  "prepare-for-dismissive-appointment",
  "why-we-built-the-dismissal-tracker",
  "perimenopause-taken-seriously",
];

const ALL_SLUGS = [...TRACK_A_SLUGS, ...TRACK_B_SLUGS];

function readPage(slug: string): string {
  return fs.readFileSync(
    path.resolve(import.meta.dirname, "..", "client", "tools", slug, "index.html"),
    "utf-8"
  );
}

function extractFaqJsonLd(source: string): Array<{ name: string; text: string }> {
  const match = source.match(/"@type":\s*"FAQPage"[\s\S]*?"mainEntity":\s*(\[[\s\S]*?\n\s{6}\])\s*\n\s*\}\s*\n\s*<\/script>/);
  if (!match) throw new Error("Could not find FAQPage JSON-LD block");
  const parsed = JSON.parse(match[1]) as Array<{ name: string; acceptedAnswer: { text: string } }>;
  return parsed.map(q => ({ name: q.name, text: q.acceptedAnswer.text }));
}

describe.each(ALL_SLUGS)("%s — static page markup", slug => {
  const html = readPage(slug);

  it("declares canonical URL, title, and required JSON-LD blocks", () => {
    expect(html).toContain(`<link rel="canonical" href="https://ripplehealth.app/tools/${slug}/" />`);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html.match(/"@type":\s*"MedicalWebPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"FAQPage"/g)?.length).toBe(1);
    // These are pure content pages, not interactive tools — none of them
    // should claim a WebApplication schema they don't back up.
    expect(html).not.toMatch(/"@type":\s*"WebApplication"/);
  });

  it("matches the visible FAQ content word-for-word against the FAQPage JSON-LD", () => {
    const jsonLdFaq = extractFaqJsonLd(html);
    expect(jsonLdFaq.length).toBeGreaterThanOrEqual(4);
    expect(jsonLdFaq.length).toBeLessThanOrEqual(6);

    for (const { name, text } of jsonLdFaq) {
      expect(html, `question heading for "${name}"`).toContain(`>${name}</h3>`);
      const normalizedHtml = html.replace(/\s+/g, " ");
      const normalizedText = text.replace(/\s+/g, " ");
      expect(normalizedHtml, `answer text for "${name}"`).toContain(normalizedText);
    }
  });

  it("does not use fieldset/legend anywhere (legend straddles the border and overflows on wrap)", () => {
    expect(html).not.toMatch(/<fieldset/);
    expect(html).not.toMatch(/<legend/);
  });

  it("links to the Greene Climacteric Scale page", () => {
    expect(html).toContain("https://ripplehealth.app/tools/greene-climacteric-scale/");
  });

  it("links to at least one other existing Ripple tool page besides itself and Greene", () => {
    const otherToolUrls = [
      "https://ripplehealth.app/tools/dismissal-tracker/",
      "https://ripplehealth.app/tools/evidence-engine/",
      "https://ripplehealth.app/tools/appointment-prep/",
      "https://ripplehealth.app/tools/hrt-tracker/",
    ];
    expect(otherToolUrls.some(url => html.includes(url))).toBe(true);
  });

  it("has no user-facing \"GP\" string outside an HTML comment", () => {
    const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");
    expect(withoutComments).not.toMatch(/\bGPs?\b/);
  });

  it("does not cite BMS, the Endocrine Society, or an aggregator/marketing source", () => {
    // Strip HTML comments first — the claimsToVerify checklist comments
    // name these banned sources explicitly to record that they were
    // checked for and excluded, which would otherwise false-positive here.
    // Same exclusion precedent as server/northAmericaCopyPass.test.ts.
    const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");
    expect(withoutComments).not.toMatch(/\bBMS\b/);
    expect(withoutComments).not.toMatch(/British Menopause Society/i);
    expect(withoutComments).not.toMatch(/Endocrine Society/i);
    expect(withoutComments).not.toMatch(/Evernow/i);
    expect(withoutComments).not.toMatch(/Midi Health/i);
    expect(withoutComments).not.toMatch(/Women's Health Magazine/i);
  });

  it("carries a claimsToVerify checklist comment, completed rather than a bare stub", () => {
    expect(html).toContain("claimsToVerify");
    // At least one checked item, i.e. this wasn't left as an empty template.
    expect(html).toMatch(/- \[x\]/);
  });

  it("includes an informational-only, non-diagnostic disclaimer in the footer", () => {
    expect(html).toMatch(/not a substitute for professional\s+medical advice/);
  });
});

describe("Track A pages — Greene Scale honesty", () => {
  it("irregular-periods-perimenopause explicitly states there is no Greene Scale item for cycle changes, rather than forcing a false mapping", () => {
    const html = readPage("irregular-periods-perimenopause");
    const normalized = html.replace(/\s+/g, " ");
    expect(normalized).toMatch(/Honestly: it doesn't/i);
    expect(normalized).toMatch(/no item for menstrual cycle changes/i);
  });

  it("vaginal-dryness-perimenopause explains item 21 is about interest in sex (libido), not dryness specifically", () => {
    const html = readPage("vaginal-dryness-perimenopause");
    const normalized = html.replace(/\s+/g, " ");
    expect(normalized).toMatch(/item 21, "Loss of interest in sex,"/);
    expect(normalized).toMatch(/not specifically about dryness or pain/);
  });
});

describe("Track B pages — non-adversarial tone", () => {
  for (const slug of TRACK_B_SLUGS) {
    it(`${slug} does not tell the reader their own doctor dismissed them`, () => {
      const html = readPage(slug);
      // "your doctor dismissed you" as an assertion (not a hypothetical/FAQ
      // question) would violate the "describe the pattern, don't diagnose
      // the reader's situation" guardrail.
      expect(html).not.toMatch(/your doctor (has |already )?dismissed you\b/i);
    });
  }

  it("prepare-for-dismissive-appointment does not present a dialogue script as guaranteed to work", () => {
    const html = readPage("prepare-for-dismissive-appointment");
    expect(html).toMatch(/won't hand you an exact sentence guaranteed to work/);
  });

  it("why-we-built-the-dismissal-tracker frames the tool as self-advocacy, not evidence against a clinician", () => {
    const html = readPage("why-we-built-the-dismissal-tracker");
    expect(html).toMatch(/self-advocacy tool, not a confrontational one/);
  });
});
