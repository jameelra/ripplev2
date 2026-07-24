import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { CLINICAL_KNOWLEDGE_BASE } from "../client/src/lib/clinicalKnowledgeBase";
import { HRT_MEDICATION_TEMPLATES, MEDICATION_CATEGORY_LABELS } from "../client/src/lib/hrtMedications";

// British -> American spelling pass (oestrogen -> estrogen, organisation ->
// organization, personalised/recognised -> -ized, centre -> center, ...).
// Hard exclusions, deliberately NOT touched by this pass and pinned here:
//   - citation `text`/`source` strings (e.g. clinicalKnowledgeBase.ts's
//     Kravitz/Klinge-adjacent citation text quoting "Oestrogen")
//   - the NG23 citation and any guideline paraphrase
//   - full reference-list <li> citation entries on the static tool pages
//     ("The organisation is now named The Menopause Society.") — a
//     formatted academic reference with journal/year/DOI, left untouched.
//     The *ambiguous* case flagged in an earlier revision of this pass —
//     "(published under the organisation's former name, NAMS...)" — was
//     confirmed to be our own prose, not citation content, and is now fixed
//     to "organization's" (see the test below).
//   - internal, non-user-facing content (todo.md) and code comments/identifiers
//     (the "oestrogen" HRT category discriminant used in === comparisons and
//     object-key lookups, which is data-schema, not copy)

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(import.meta.dirname, "..", relativePath), "utf-8");
}

describe("NA spelling pass — clinical prose uses American spelling", () => {
  it("hot_flashes, brain_fog, and weight_gain entries say 'estrogen', not 'oestrogen', in prose fields", () => {
    for (const id of ["hot_flashes", "brain_fog", "weight_gain"]) {
      const entry = CLINICAL_KNOWLEDGE_BASE.find(e => e.id === id)!;
      expect(entry.mechanism, id).toMatch(/\bestrogen\b/i);
      expect(entry.mechanism, id).not.toMatch(/oestrogen/i);
    }
  });

  it("keeps the two citation `text` fields that quote 'Oestrogen' untouched (citation strings are excluded)", () => {
    const jointPain = CLINICAL_KNOWLEDGE_BASE.find(e => e.id === "joint_pain")!;
    expect(jointPain.citations.some(c => c.text.startsWith("Oestrogen receptors are present in synovial tissue"))).toBe(true);

    const fatigue = CLINICAL_KNOWLEDGE_BASE.find(e => e.id === "fatigue")!;
    expect(fatigue.citations.some(c => c.text.startsWith("Oestrogen regulates mitochondrial biogenesis"))).toBe(true);
  });

  it("still cites NG23 untouched by this pass", () => {
    const source = readSource("client/src/lib/clinicalKnowledgeBase.ts");
    expect(source).toContain("NICE guideline NG23, Menopause: identification and management");
  });
});

describe("NA spelling pass — HRT medication data", () => {
  it("uses 'Estradiol' as the display active ingredient", () => {
    const oestrogel = HRT_MEDICATION_TEMPLATES.find(t => t.name === "Oestrogel")!;
    expect(oestrogel.activeIngredient).toBe("Estradiol");
  });

  it("leaves brand/product names untouched (e.g. 'Oestrogel' is a real product name, not a spelling choice)", () => {
    expect(HRT_MEDICATION_TEMPLATES.some(t => t.name === "Oestrogel")).toBe(true);
  });

  it("leaves the internal 'oestrogen' category discriminant untouched — it's compared with === and used as an object key elsewhere, not display copy", () => {
    expect(HRT_MEDICATION_TEMPLATES.some(t => t.category === "oestrogen")).toBe(true);
    // The display label for that category is fixed to American spelling, though:
    expect(MEDICATION_CATEGORY_LABELS.oestrogen).toBe("Estrogen");
  });
});

describe("NA spelling pass — public tool pages", () => {
  it("dismissal-tracker page and its progressive-enhancement script say 'minimized', not 'minimised'", () => {
    const html = readSource("client/tools/dismissal-tracker/index.html");
    expect(html).not.toMatch(/minimised/i);
    expect(html).toMatch(/minimized/);
    const mainTs = readSource("client/tools/dismissal-tracker/main.ts");
    expect(mainTs).not.toMatch(/minimised/i);
  });

  it("non-endorsement disclaimers say 'organization', not 'organisation'", () => {
    for (const slug of ["evidence-engine", "hrt-tracker", "appointment-prep", "balance-alternative", "ripple-vs-balance"]) {
      const html = readSource(`client/tools/${slug}/index.html`);
      expect(html).not.toMatch(/clinical organisation|any other organisation/i);
    }
  });

  it("fixes the 'organisation's former name' parenthetical to 'organization's' — confirmed to be our own prose, not citation content", () => {
    const evidenceEngine = readSource("client/tools/evidence-engine/index.html");
    expect(evidenceEngine).toContain("published under the organization's former name, NAMS, in 2022");
    expect(evidenceEngine).not.toMatch(/organisation's former name/);
    const hrtTracker = readSource("client/tools/hrt-tracker/index.html");
    expect(hrtTracker).toContain("published under the organization's former name, NAMS)");
    expect(hrtTracker).not.toMatch(/organisation's former name/);
  });

  it("leaves the full NAMS 2022 reference-list citation entries untouched", () => {
    for (const slug of ["evidence-engine", "hrt-tracker"]) {
      const html = readSource(`client/tools/${slug}/index.html`);
      expect(html).toContain("The organisation is now named The Menopause Society.");
    }
  });
});
