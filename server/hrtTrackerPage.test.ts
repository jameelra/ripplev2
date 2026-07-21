import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { REGIMEN_NOTE_OPTIONS, SYMPTOM_OPTIONS } from "../shared/hrtTrackingLogBuilder";

// Safety net against transcription drift: the static HTML page is hand-authored
// (deliberately, so the FAQ and checklist options are visible to crawlers
// without JS), so this cross-checks its markup against the same data used by
// the interactive island and confirms the FAQ JSON-LD matches the visible text.

const pagePath = path.resolve(import.meta.dirname, "../client/tools/hrt-tracker/index.html");
const html = fs.readFileSync(pagePath, "utf-8");

function extractFaqJsonLd(source: string): Array<{ name: string; text: string }> {
  const match = source.match(/"@type":\s*"FAQPage"[\s\S]*?"mainEntity":\s*(\[[\s\S]*?\n\s{6}\])\s*\n\s*\}\s*\n\s*<\/script>/);
  if (!match) throw new Error("Could not find FAQPage JSON-LD block");
  const parsed = JSON.parse(match[1]) as Array<{ name: string; acceptedAnswer: { text: string } }>;
  return parsed.map(q => ({ name: q.name, text: q.acceptedAnswer.text }));
}

// Walks div/section open/close tags to find the ancestor chain of a given
// element id, without pulling in a full DOM/jsdom dependency (this project's
// vitest config runs tests in the "node" environment, not "jsdom"). Guards
// against the print-visibility regression fixed on the Appointment Prep page,
// where nesting the print-only container inside a no-print ancestor left
// print preview blank (a display:none ancestor can't be un-hidden by a
// child's display rule).
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

describe("HRT Tracker page — static page markup", () => {
  it("does not nest the print-only tracking log inside any no-print ancestor", () => {
    const ancestorClasses = ancestorClassListsOf(html, "hrt-log-print");
    const noPrintAncestor = ancestorClasses.find(classes => classes.includes("no-print"));
    expect(noPrintAncestor, `ancestors were: ${JSON.stringify(ancestorClasses)}`).toBeUndefined();
  });

  it("renders every symptom option from shared/hrtTrackingLogBuilder.ts, in order, as a checkbox", () => {
    const symptomRe = /<input type="checkbox" name="symptom" value="([^"]+)"/g;
    const rendered = [...html.matchAll(symptomRe)].map(m => m[1]);
    expect(rendered).toEqual([...SYMPTOM_OPTIONS]);
  });

  it("renders every regimen note option from shared/hrtTrackingLogBuilder.ts, in order, as a checkbox", () => {
    const regimenRe = /<input type="checkbox" name="regimen" value="([^"]+)"/g;
    const rendered = [...html.matchAll(regimenRe)].map(m => m[1]);
    expect(rendered).toEqual([...REGIMEN_NOTE_OPTIONS]);
  });

  it("does not use fieldset/legend for the checkbox groups (legend straddles the border and overflows on wrap)", () => {
    expect(html).not.toMatch(/<fieldset/);
    expect(html).not.toMatch(/<legend/);
  });

  it("links each checkbox group to its heading via aria-labelledby, not a duplicated aria-label", () => {
    expect(html).toContain('id="hrt-symptoms-label"');
    expect(html).toContain('role="group" aria-labelledby="hrt-symptoms-label"');
    expect(html).toContain('id="hrt-regimen-label"');
    expect(html).toContain('role="group" aria-labelledby="hrt-regimen-label"');
    expect(html).not.toMatch(/role="group" aria-label="/);
  });

  it("keeps the 'not a treatment plan' disclaimer in the static markup, not just injected by JS", () => {
    expect(html).toContain("This is a personal tracking log, not a treatment plan or a medical record.");
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
    expect(html).toContain('<link rel="canonical" href="https://ripplehealth.app/tools/hrt-tracker/" />');
    expect(html).toMatch(/<title>[^<]*HRT[^<]*<\/title>/);
    expect(html.match(/"@type":\s*"FAQPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"MedicalWebPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"WebApplication"/g)?.length).toBe(1);
  });

  it("names the WebApplication schema after the tracking log builder, not the gated in-app HRT Tracker feature", () => {
    // The real HRT Tracker requires a Premier subscription or paid add-on;
    // claiming it as this page's free $0 WebApplication would misrepresent
    // the product.
    const webAppMatch = html.match(/"@type":\s*"WebApplication"[\s\S]*?"name":\s*"([^"]+)"/);
    expect(webAppMatch?.[1]).toBe("HRT Tracking Log Builder");
  });

  it("does not claim certainty or endorsement it can't back up", () => {
    const normalized = html.replace(/\s+/g, " ");
    expect(normalized).toContain(
      "Ripple is not endorsed by, recommended by, or affiliated with NICE, The Menopause Society, the British Menopause"
    );
  });

  it("cross-links to all four existing tool pages", () => {
    expect(html).toContain("https://ripplehealth.app/tools/greene-climacteric-scale/");
    expect(html).toContain("https://ripplehealth.app/tools/dismissal-tracker/");
    expect(html).toContain("https://ripplehealth.app/tools/evidence-engine/");
    expect(html).toContain("https://ripplehealth.app/tools/appointment-prep/");
  });

  it("cross-links to the Balance comparison pages", () => {
    expect(html).toContain("https://ripplehealth.app/tools/balance-alternative/");
    expect(html).toContain("https://ripplehealth.app/tools/ripple-vs-balance/");
  });

  it("cites all four verified sources with full locators, and no others", () => {
    expect(html).toContain("Rossouw JE, Anderson GL, Prentice RL");
    expect(html).toContain("288(3):321–333");
    expect(html).toContain("Manson JE, Chlebowski RT, Stefanick ML");
    expect(html).toContain("310(13):1353–1368");
    expect(html).toContain("29(7):767–794");
    expect(html).toContain("doi:10.1097/GME.0000000000002028");
    expect(html).toContain("NICE guideline NG23");
    expect(html).toContain("updated November 2024");

    // No new citations beyond the four-source canon (WHI 2002, WHI 2013
    // reanalysis, NAMS/Menopause Society 2022, NICE NG23).
    const sourcesMatch = html.match(/<h2[^>]*>Sources<\/h2>\s*<ul[^>]*>([\s\S]*?)<\/ul>/);
    expect(sourcesMatch).not.toBeNull();
    const sourceItems = [...(sourcesMatch?.[1].matchAll(/<li>([\s\S]*?)<\/li>/g) ?? [])];
    expect(sourceItems.length).toBe(4);
  });

  it("cites the 2022 NAMS statement as published, but doesn't call the organisation NAMS in the present tense", () => {
    expect(html).toContain("published under the organisation's former name, NAMS");
    const currentTenseMentions = html.match(/current guidance from ([^.]+)\./g) ?? [];
    for (const mention of currentTenseMentions) {
      expect(mention).toContain("The Menopause Society");
    }
  });

  it("never advises starting, stopping, or changing HRT, and never characterizes HRT as safe or unsafe", () => {
    const normalized = html.replace(/\s+/g, " ");
    expect(normalized).toContain("they don't recommend starting, stopping, or changing any treatment");
    expect(normalized).toContain("isn't a question with a single yes-or-no answer");
    expect(normalized).not.toMatch(/HRT is (safe|unsafe|dangerous|risky)/i);
    expect(normalized).not.toMatch(/hormone therapy is (safe|unsafe|dangerous|risky)/i);
    expect(normalized).not.toMatch(/you should (start|stop|take|use|change)/i);
    expect(normalized).not.toMatch(/stop taking/i);
  });
});
