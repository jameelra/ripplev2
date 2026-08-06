import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const pagePath = path.resolve(import.meta.dirname, "../client/fr/outils/changements-du-cycle/index.html");
const html = fs.readFileSync(pagePath, "utf-8");
const normalized = html.replace(/\s+/g, " ");

// This is the French-Canadian twin of client/tools/cycle-changes/index.html.
// The French copy is a machine-assisted DRAFT, blocked pending native Quebec
// French review (see the PR description) — these tests check structural and
// invariant parity with the English original, not translation quality.

describe("Cycle Change Tracker (fr-CA) — static page markup", () => {
  it("declares lang=fr-CA, canonical URL, title, and reciprocal hreflang alternates", () => {
    expect(html).toContain('<html lang="fr-CA">');
    expect(html).toContain('<link rel="canonical" href="https://ripplehealth.app/fr/outils/changements-du-cycle/" />');
    expect(html).toMatch(/<title>[^<]*cycle[^<]*<\/title>/i);
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

  it("keeps every item's radio/checkbox value identical to the English page and pattern.js constants", () => {
    expect([...html.matchAll(/name="item0" value="([\w-]+)"/g)].map(m => m[1])).toEqual(["yes", "no", "not-sure"]);
    expect([...html.matchAll(/name="item1" value="([\w-]+)"/g)].map(m => m[1])).toEqual([
      "multiple",
      "once",
      "no",
      "not-sure",
    ]);
    expect([...html.matchAll(/name="item2" value="([\w-]+)"/g)].map(m => m[1])).toEqual(["yes", "no", "not-sure"]);
    expect([...html.matchAll(/name="item3" value="([\w-]+)"/g)].map(m => m[1])).toEqual(["yes", "no"]);
    expect([...html.matchAll(/name="item4" value="([\w-]+)"/g)].map(m => m[1])).toEqual([
      "heavier",
      "lighter",
      "varies",
      "no-change",
    ]);
    expect([...html.matchAll(/name="item5" value="([\w-]+)"/g)].map(m => m[1])).toEqual([
      "longer",
      "shorter",
      "varies",
      "no-change",
    ]);
    expect([...html.matchAll(/name="item6" value="([\w-]+)"/g)].map(m => m[1])).toEqual([
      "usually",
      "sometimes",
      "rarely",
    ]);
    expect([...html.matchAll(/name="item7" value="([\w-]+)"/g)].map(m => m[1])).toEqual([
      "spotting-between-periods",
      "bleeding-after-sex",
      "bleeding-after-12-months",
      "heavy-bleeding",
      "none",
    ]);
  });

  it("never produces a score or total anywhere on the page", () => {
    expect(html).not.toMatch(/pointage total/i);
    expect(html).not.toMatch(/\/\s*\d+\s*points?/i);
    expect(html).not.toMatch(/sur \d+/i);
  });

  it("states the mandatory honesty caveat with the canon-verified 12-25% figure", () => {
    expect(normalized).toContain("Les changements du cycle ne sont qu'un signal parmi d'autres.");
    expect(normalized).toContain("Entre 12 % et 25 % des femmes");
    expect(normalized).toContain("donc un cycle stable n'exclut pas la transition.");
    const mainTs = fs.readFileSync(
      path.resolve(import.meta.dirname, "../client/fr/outils/changements-du-cycle/main.ts"),
      "utf-8"
    );
    expect(mainTs).toContain("Entre 12 % et 25 % des femmes ne constatent");
  });

  it("carries a Sources section limited to docs/citation-canon.md entries, attributing 12-25% to Harlow 2018 only", () => {
    const sources = html.slice(html.indexOf(">Sources<"), html.indexOf("</section>", html.indexOf(">Sources<")));
    expect(sources).toContain("Harlow SD, Gass M, Hall JE");
    expect(sources).toContain("PMID 22344196");
    expect(sources).toContain("Harlow SD. Menstrual cycle changes as women approach the final menses");
    expect(sources).toContain("PMID 30401545");
    expect(sources).toContain("Source de l'estimation selon laquelle 12 % à 25 %");
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

  it("states the item-7 persistent-flag panel text, positioned above the gated/classified branches", () => {
    expect(normalized).toContain("méritent d'être signalés à un clinicien assez rapidement");
    expect(normalized).toContain("les cliniciens veulent savoir rapidement");
    const flagPanelIndex = html.indexOf('id="cycle-flag-panel"');
    const gatedIndex = html.indexOf('id="cycle-gated-result"');
    expect(flagPanelIndex).toBeGreaterThan(-1);
    expect(flagPanelIndex).toBeLessThan(gatedIndex);
  });

  it("does not reproduce MQ6 questions, graphic, or logo — link only, French link listed first", () => {
    expect(html).toContain("https://mq6.ca/fr/outil-devaluation-mq6/");
    expect(html).toContain("https://mq6.ca/mq6-assessment-tool/");
    expect(html).not.toMatch(/logo de la société canadienne de la ménopause/i);
    expect(html.indexOf("outil-devaluation-mq6")).toBeLessThan(html.indexOf("mq6-assessment-tool"));
  });

  it("never claims endorsement by CMS, CFPC, or Dr. Goldstein", () => {
    expect(html).not.toMatch(/approuvé (?:officiellement )?par/i);
    expect(html).not.toMatch(/recommandé officiellement/i);
  });

  it("declares the printable summary as a sibling of its no-print ancestor, never nested inside it", () => {
    const resultsSectionStart = html.indexOf('id="cycle-results"');
    const resultsSectionEnd = html.indexOf("</section>", resultsSectionStart);
    const section = html.slice(resultsSectionStart, resultsSectionEnd);

    const noPrintCardStart = section.indexOf('class="no-print ripple-card');
    const noPrintCardOpenTagEnd = section.indexOf(">", noPrintCardStart);
    const printOnlyCommentIndex = section.indexOf("frère du bloc no-print");
    expect(noPrintCardOpenTagEnd).toBeGreaterThan(-1);
    expect(printOnlyCommentIndex).toBeGreaterThan(noPrintCardOpenTagEnd);

    const printSummaryIndex = section.indexOf('id="cycle-print-summary"');
    expect(printSummaryIndex).toBeGreaterThan(printOnlyCommentIndex);
  });

  it("carries the beacon and Google Search Console marker comments like the other tool pages", () => {
    expect(html).toContain("<!-- cloudflare-beacon -->");
    expect(html).toContain("<!-- google-site-verification -->");
  });

  it("is flagged in-source as a draft blocked pending native Quebec French review", () => {
    expect(html).toMatch(/blocked pending native Quebec French review/i);
  });

  it("main.ts imports the same locale-agnostic pattern.js as the English page, not a fork", () => {
    const mainTsPath = path.resolve(import.meta.dirname, "../client/fr/outils/changements-du-cycle/main.ts");
    const mainTs = fs.readFileSync(mainTsPath, "utf-8");
    expect(mainTs).toContain('from "../../../tools/cycle-changes/pattern.js"');
  });
});
