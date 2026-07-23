import { describe, expect, it } from "vitest";
import { CLINICAL_KNOWLEDGE_BASE } from "../client/src/lib/clinicalKnowledgeBase";

// Citation-hardening regression test for the "anxiety" entry, which
// previously made three uncited or badly-cited claims:
//   1. prevalence: "Affects up to 40% of perimenopausal women" (uncited)
//   2. clinicalContext: antidepressants "significantly overprescribed"
//      (cited only to Mad in America, an advocacy blog, not a clinical source)
//   3. citations: a "40% higher risk" of depression figure cited only to a
//      Midi Health marketing page
// This pins the replacement wording so none of the three can silently drift
// back to an invented statistic or a non-clinical source. A candidate
// replacement for #3 (Badawy et al. 2024, Journal of Affective Disorders)
// was deliberately left out — it was surfaced only via search snippets and
// could not be independently retrieved and verified this session, so it does
// not meet this codebase's citation bar. Do not reintroduce it, or any other
// depression-risk figure, without opening and confirming the primary source.

const anxiety = CLINICAL_KNOWLEDGE_BASE.find(e => e.id === "anxiety");

describe("clinical knowledge base — anxiety entry citations", () => {
  it("exists", () => {
    expect(anxiety).toBeDefined();
  });

  it("does not state a specific, uncited prevalence percentage", () => {
    expect(anxiety!.prevalence).not.toMatch(/\d+%/);
    expect(anxiety!.prevalence).toMatch(/vary widely/i);
  });

  it("does not claim antidepressants are overprescribed", () => {
    expect(anxiety!.clinicalContext).not.toMatch(/overprescri/i);
  });

  it("grounds the antidepressants-vs-hormone-therapy point in NG23 recommendation 1.5.21, scoped to no depression diagnosis", () => {
    expect(anxiety!.clinicalContext).toMatch(/NG23/);
    expect(anxiety!.clinicalContext).toMatch(/1\.5\.21/);
    expect(anxiety!.clinicalContext).toMatch(/depression hasn't been diagnosed|no clear evidence/i);
  });

  it("never tells a reader antidepressants are inappropriate once diagnosed", () => {
    expect(anxiety!.clinicalContext).toMatch(/appropriate choice once depression.*diagnosed/i);
  });

  it("does not cite Mad in America or Midi Health", () => {
    const sources = anxiety!.citations.map(c => `${c.source} ${c.url}`).join(" ");
    expect(sources).not.toMatch(/mad in america/i);
    expect(sources).not.toMatch(/midi health|joinmidi\.com/i);
  });

  it("does not cite an unverified depression-risk figure (e.g. Badawy et al.) that was never independently retrieved", () => {
    const sources = anxiety!.citations.map(c => `${c.text} ${c.source}`).join(" ");
    expect(sources).not.toMatch(/badawy/i);
    expect(sources).not.toMatch(/odds ratio/i);
  });

  it("cites the antidepressants/low-mood point to NICE NG23 by name, with the specific recommendation number", () => {
    const citation = anxiety!.citations.find(c => c.source.includes("NG23"));
    expect(citation).toBeDefined();
    expect(citation!.url).toContain("nice.org.uk");
    expect(citation!.text).toMatch(/1\.5\.21/);
  });
});
