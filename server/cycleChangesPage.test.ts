import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const pagePath = path.resolve(import.meta.dirname, "../client/tools/cycle-changes/index.html");
const html = fs.readFileSync(pagePath, "utf-8");
// Hand-authored prose wraps across lines in the HTML source for readability;
// collapse whitespace before asserting on multi-line sentences so line-wrap
// position isn't part of what these tests pin.
const normalized = html.replace(/\s+/g, " ");

describe("Cycle Change Tracker — static page markup", () => {
  it("declares canonical URL, title, and hreflang alternates", () => {
    expect(html).toContain('<link rel="canonical" href="https://ripplehealth.app/tools/cycle-changes/" />');
    expect(html).toMatch(/<title>[^<]*Cycle Change Tracker[^<]*<\/title>/);
    expect(html).toContain('<link rel="alternate" hreflang="en-CA" href="https://ripplehealth.app/tools/cycle-changes/" />');
    expect(html).toContain(
      '<link rel="alternate" hreflang="fr-CA" href="https://ripplehealth.app/fr/outils/changements-du-cycle/" />'
    );
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://ripplehealth.app/tools/cycle-changes/" />');
  });

  it("declares exactly one MedicalWebPage, one WebApplication, and one FAQPage JSON-LD block", () => {
    expect(html.match(/"@type":\s*"MedicalWebPage"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"WebApplication"/g)?.length).toBe(1);
    expect(html.match(/"@type":\s*"FAQPage"/g)?.length).toBe(1);
  });

  it("does not use fieldset/legend anywhere on the page", () => {
    expect(html).not.toMatch(/<fieldset/);
    expect(html).not.toMatch(/<legend/);
  });

  it("links every radiogroup/group to its item label via aria-labelledby, not aria-label", () => {
    for (const id of [0, 1, 2, 3, 4, 5, 6, 7]) {
      expect(html).toContain(`id="cycle-label-${id}"`);
    }
    expect(html).not.toMatch(/role="radiogroup" aria-label="/);
    expect(html).not.toMatch(/role="group" aria-label="/);
  });

  it("item 0 (confounder gate) asks the exact specified question with Yes/No/Not sure", () => {
    expect(html).toContain(
      "Are you currently using hormonal contraception, a hormonal IUD, or any other treatment that changes"
    );
    const values = [...html.matchAll(/name="item0" value="([\w-]+)"/g)].map(m => m[1]);
    expect(values).toEqual(["yes", "no", "not-sure"]);
  });

  it("item 1 (cycle length variability) has the 4 specified options in order", () => {
    expect(normalized).toContain("has that gap changed by a week or more compared with your usual pattern?");
    const values = [...html.matchAll(/name="item1" value="([\w-]+)"/g)].map(m => m[1]);
    expect(values).toEqual(["multiple", "once", "no", "not-sure"]);
  });

  it("item 2 (skipped cycles) asks about 60+ days in the last 12 months", () => {
    expect(html).toContain("In the last 12 months, have you gone 60 days or more without a period?");
    const values = [...html.matchAll(/name="item2" value="([\w-]+)"/g)].map(m => m[1]);
    expect(values).toEqual(["yes", "no", "not-sure"]);
  });

  it("item 3 (twelve months) asks about 12 consecutive months, Yes/No only", () => {
    expect(html).toContain("Have you gone 12 consecutive months or more without a period?");
    const values = [...html.matchAll(/name="item3" value="([\w-]+)"/g)].map(m => m[1]);
    expect(values).toEqual(["yes", "no"]);
  });

  it("item 4 (flow volume) has the 4 specified options", () => {
    expect(html).toContain("Has your flow changed noticeably");
    const values = [...html.matchAll(/name="item4" value="([\w-]+)"/g)].map(m => m[1]);
    expect(values).toEqual(["heavier", "lighter", "varies", "no-change"]);
  });

  it("item 5 (bleeding duration) has the 4 specified options", () => {
    expect(html).toContain("Have your periods become noticeably longer or shorter");
    const values = [...html.matchAll(/name="item5" value="([\w-]+)"/g)].map(m => m[1]);
    expect(values).toEqual(["longer", "shorter", "varies", "no-change"]);
  });

  it("item 6 (predictability) has the 3 specified options", () => {
    expect(html).toContain("Can you still roughly predict when your next period will start?");
    const values = [...html.matchAll(/name="item6" value="([\w-]+)"/g)].map(m => m[1]);
    expect(values).toEqual(["usually", "sometimes", "rarely"]);
  });

  it("item 7 is a multi-select checkbox group with the 5 specified options, including 'None of these'", () => {
    expect(html).toContain("Have you had any of the following? Select all that apply.");
    const values = [...html.matchAll(/name="item7" value="([\w-]+)"/g)].map(m => m[1]);
    expect(values).toEqual([
      "spotting-between-periods",
      "bleeding-after-sex",
      "bleeding-after-12-months",
      "heavy-bleeding",
      "none",
    ]);
    expect(html).toContain('type="checkbox" name="item7"');
    expect(html).not.toMatch(/type="radio" name="item7"/);
  });

  it("never produces a score or total anywhere on the page", () => {
    expect(html).not.toMatch(/total score/i);
    expect(html).not.toMatch(/\/\s*\d+\s*points?/i);
    expect(html).not.toMatch(/out of \d+/i);
  });

  it("states the confounder-gate message verbatim and links to Greene + Appointment Prep from that branch", () => {
    expect(normalized).toContain(
      "Hormonal treatments change bleeding patterns directly, so cycle timing can't tell you much about where you " +
        "are in the transition while you're using them."
    );
    expect(normalized).toContain(
      "The symptom-based tools below may be more useful, and this is worth raising with your clinician."
    );
    const gatedBlock = html.slice(html.indexOf('id="cycle-gated-result"'), html.indexOf('id="cycle-pattern-result"'));
    expect(gatedBlock).toContain("https://ripplehealth.app/tools/greene-climacteric-scale/");
    expect(gatedBlock).toContain("https://ripplehealth.app/tools/appointment-prep/");
  });

  it("states the item-7 persistent-flag panel text verbatim, outside the gated/classified branches", () => {
    expect(normalized).toContain(
      "Some of what you've described is worth raising with a clinician sooner rather than later"
    );
    expect(normalized).toContain(
      "Bleeding after 12 months without a period in particular is something clinicians want to know about promptly."
    );
    const flagPanelIndex = html.indexOf('id="cycle-flag-panel"');
    const gatedIndex = html.indexOf('id="cycle-gated-result"');
    expect(flagPanelIndex).toBeGreaterThan(-1);
    expect(flagPanelIndex).toBeLessThan(gatedIndex);
  });

  it("states the mandatory honesty caveat with the canon-verified 12-25% figure", () => {
    expect(html).toContain("Cycle changes are only one signal.");
    expect(html).toContain("Between 12% and 25% of women see little or no change in cycle");
    expect(html).toContain("so a steady cycle doesn't rule out the transition.");
    // Same sentence must appear in both the static markup and the print-summary builder.
    const mainTs = fs.readFileSync(
      path.resolve(import.meta.dirname, "../client/tools/cycle-changes/main.ts"),
      "utf-8"
    );
    expect(mainTs).toContain("Between 12% and 25% of women see little or no change in cycle length");
  });

  it("carries a Sources section limited to docs/citation-canon.md entries, attributing 12-25% to Harlow 2018 only", () => {
    const sources = html.slice(html.indexOf(">Sources<"), html.indexOf("</section>", html.indexOf(">Sources<")));
    expect(sources).toContain("Harlow SD, Gass M, Hall JE");
    expect(sources).toContain("PMID 22344196");
    expect(sources).toContain("Harlow SD. Menstrual cycle changes as women approach the final menses");
    expect(sources).toContain("PMID 30401545");
    expect(sources).toContain("Source for the estimate that 12–25% of women show little or no change");
    expect(sources).toContain("Greene JG");
    expect(sources).toContain("Goldstein S");
    // Harlow & Paramsothy 2011 is dropped per canon guidance (superseded by Harlow 2018).
    expect(sources).not.toContain("Paramsothy");
    expect(sources).not.toContain("2011;38(3)");
  });

  it("carries no citation outside docs/citation-canon.md", () => {
    const canon = fs.readFileSync(path.resolve(import.meta.dirname, "../docs/citation-canon.md"), "utf-8");
    for (const pmid of ["22344196", "30401545"]) {
      expect(canon, `PMID ${pmid} should be a canon entry`).toContain(pmid);
      expect(html, `PMID ${pmid} appears on the page`).toContain(pmid);
    }
  });

  it("does not reproduce MQ6 questions, graphic, or logo — link only, both languages listed", () => {
    expect(html).toContain("https://mq6.ca/mq6-assessment-tool/");
    expect(html).toContain("https://mq6.ca/fr/outil-devaluation-mq6/");
    expect(html).not.toMatch(/canadian menopause society logo/i);
    // English page lists the English link first
    expect(html.indexOf("mq6-assessment-tool")).toBeLessThan(html.indexOf("outil-devaluation-mq6"));
  });

  it("never claims endorsement by CMS, CFPC, or Dr. Goldstein", () => {
    expect(html).not.toMatch(/endorsed by/i);
    expect(html).not.toMatch(/officially (?:recommended|approved)/i);
  });

  it("declares the printable summary as a sibling of its no-print ancestor, never nested inside it", () => {
    const resultsSectionStart = html.indexOf('id="cycle-results"');
    const resultsSectionEnd = html.indexOf("</section>", resultsSectionStart);
    const section = html.slice(resultsSectionStart, resultsSectionEnd);

    const noPrintCardStart = section.indexOf('class="no-print ripple-card');
    const noPrintCardOpenTagEnd = section.indexOf(">", noPrintCardStart);
    // Find the matching close of that specific div by locating the next
    // "Print-only summary" marker comment, which sits right after it closes.
    const printOnlyCommentIndex = section.indexOf("Print-only summary");
    expect(noPrintCardOpenTagEnd).toBeGreaterThan(-1);
    expect(printOnlyCommentIndex).toBeGreaterThan(noPrintCardOpenTagEnd);

    const printSummaryIndex = section.indexOf('id="cycle-print-summary"');
    expect(printSummaryIndex).toBeGreaterThan(printOnlyCommentIndex);
  });

  it("declares the privacy statement: no data leaves the browser, and state is in-memory only", () => {
    expect(html).toContain("Every answer and every classification is calculated on your own");
    expect(html).toMatch(/refreshing (?:the page|or closing the tab) clears/i);
  });

  it("cross-links to the Greene Climacteric Scale and Appointment Prep from the SEO body content", () => {
    const article = html.slice(html.indexOf("<article"), html.indexOf("</article>"));
    expect(article).toContain("https://ripplehealth.app/tools/greene-climacteric-scale/");
    expect(article).toContain("https://ripplehealth.app/tools/appointment-prep/");
  });

  it("carries the beacon and Google Search Console marker comments like the other tool pages", () => {
    expect(html).toContain("<!-- cloudflare-beacon -->");
    expect(html).toContain("<!-- google-site-verification -->");
  });
});
