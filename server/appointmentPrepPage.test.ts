import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { CONCERN_OPTIONS, SYMPTOM_OPTIONS } from "../shared/appointmentPrepBuilder";

// Safety net against transcription drift: the static HTML page is hand-authored
// (deliberately, so the FAQ and checklist options are visible to crawlers
// without JS), so this cross-checks its markup against the same data used by
// the interactive island and confirms the FAQ JSON-LD matches the visible text.

const pagePath = path.resolve(import.meta.dirname, "../client/tools/appointment-prep/index.html");
const html = fs.readFileSync(pagePath, "utf-8");

function extractFaqJsonLd(source: string): Array<{ name: string; text: string }> {
  const match = source.match(/"@type":\s*"FAQPage"[\s\S]*?"mainEntity":\s*(\[[\s\S]*?\n\s{6}\])\s*\n\s*\}\s*\n\s*<\/script>/);
  if (!match) throw new Error("Could not find FAQPage JSON-LD block");
  const parsed = JSON.parse(match[1]) as Array<{ name: string; acceptedAnswer: { text: string } }>;
  return parsed.map(q => ({ name: q.name, text: q.acceptedAnswer.text }));
}

// Walks div/section open/close tags to find the ancestor chain of a given
// element id, without pulling in a full DOM/jsdom dependency (this project's
// vitest config runs tests in the "node" environment, not "jsdom").
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

describe("Appointment Prep page — static page markup", () => {
  it("does not nest the print-only prep sheet inside any no-print ancestor (a display:none ancestor can't be un-hidden by a child's display rule, which previously made print preview render blank)", () => {
    const ancestorClasses = ancestorClassListsOf(html, "prep-sheet-print");
    const noPrintAncestor = ancestorClasses.find(classes => classes.includes("no-print"));
    expect(noPrintAncestor, `ancestors were: ${JSON.stringify(ancestorClasses)}`).toBeUndefined();
  });

  it("renders every symptom option from shared/appointmentPrepBuilder.ts, in order, as a checkbox", () => {
    const symptomRe = /<input type="checkbox" name="symptom" value="([^"]+)"/g;
    const rendered = [...html.matchAll(symptomRe)].map(m => m[1]);
    expect(rendered).toEqual([...SYMPTOM_OPTIONS]);
  });

  it("renders every concern option from shared/appointmentPrepBuilder.ts, in order, as a checkbox", () => {
    const concernRe = /<input type="checkbox" name="concern" value="([^"]+)"/g;
    const rendered = [...html.matchAll(concernRe)].map(m => m[1]);
    expect(rendered).toEqual([...CONCERN_OPTIONS]);
  });

  it("does not use fieldset/legend for the checkbox groups (legend straddles the border and overflows on wrap)", () => {
    expect(html).not.toMatch(/<fieldset/);
    expect(html).not.toMatch(/<legend/);
  });

  it("links each checkbox group to its heading via aria-labelledby, not a duplicated aria-label", () => {
    expect(html).toContain('id="prep-symptoms-label"');
    expect(html).toContain('role="group" aria-labelledby="prep-symptoms-label"');
    expect(html).toContain('id="prep-concerns-label"');
    expect(html).toContain('role="group" aria-labelledby="prep-concerns-label"');
    expect(html).not.toMatch(/role="group" aria-label="/);
  });

  it("keeps the 'not a treatment plan' disclaimer in the static markup, not just injected by JS", () => {
    expect(html).toContain("This is a personal prompt sheet, not a treatment plan or a medical document.");
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
    expect(html).toContain('<link rel="canonical" href="https://ripplehealth.app/tools/appointment-prep/" />');
    expect(html).toMatch(/<title>[^<]*Appointment[^<]*<\/title>/);
    expect(html.match(/"@type":\s*"FAQPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"MedicalWebPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"WebApplication"/g)?.length).toBe(1);
  });

  it("names the WebApplication schema after the prep-sheet builder, not the gated in-app Appointment Prep feature", () => {
    // The real Appointment Prep feature requires an account and at least
    // three days of tracked symptoms; claiming it as this page's free
    // WebApplication would misrepresent the product.
    const webAppMatch = html.match(/"@type":\s*"WebApplication"[\s\S]*?"name":\s*"([^"]+)"/);
    expect(webAppMatch?.[1]).toBe("Appointment Prep Sheet Builder");
  });

  it("does not claim certainty or endorsement it can't back up", () => {
    const normalized = html.replace(/\s+/g, " ");
    expect(normalized).toContain(
      "Ripple is not endorsed by, recommended by, or affiliated with NICE or any other clinical organisation"
    );
  });

  it("cross-links to all three existing tool pages", () => {
    expect(html).toContain("https://ripplehealth.app/tools/greene-climacteric-scale/");
    expect(html).toContain("https://ripplehealth.app/tools/dismissal-tracker/");
    expect(html).toContain("https://ripplehealth.app/tools/evidence-engine/");
  });

  it("cites NICE NG23 recommendation 1.5.4, scoped to vasomotor symptoms, as the only new citation", () => {
    expect(html).toContain("NG23");
    expect(html).toContain("1.5.4");
    expect(html).toContain("vasomotor");
    expect(html).toContain("updated November 2024");
  });

  it("never claims antidepressants are overprescribed, and never introduces a British Menopause Society reference", () => {
    const normalized = html.replace(/\s+/g, " ");
    expect(normalized).not.toMatch(/overprescri/i);
    expect(normalized).not.toMatch(/british menopause society/i);
    expect(normalized).not.toMatch(/\bBMS\b/);
  });

  it("never tells a reader to stop or question a prescribed medication", () => {
    const normalized = html.replace(/\s+/g, " ");
    expect(normalized).not.toMatch(/stop taking/i);
    expect(normalized).not.toMatch(/should stop/i);
    expect(normalized).toContain("not a reason to stop or question");
  });
});
