import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { CLINICAL_KNOWLEDGE_BASE } from "../client/src/lib/clinicalKnowledgeBase";

// Citation-hardening batch 2: BMS and Endocrine Society were never in this
// codebase's verified canon (WHI 2002, WHI 2013, NAMS 2022, NICE NG23), and
// this session's fetch tooling was blocked (403s from the proxy on every
// destination tried, not a one-off) so neither could be retrieved and
// verified end-to-end this pass. Per the citation rules, anything that can't
// be verified end-to-end gets rewritten qualitatively or cut — never swapped
// for a different unverified source. This test pins that outcome so BMS,
// Endocrine Society, or the Midi Health marketing citations can't silently
// drift back in. The BMS "find a specialist" directory link in wikiLinks.ts
// is a provider directory, not a clinical citation, and is deliberately
// excluded from these checks.

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(import.meta.dirname, "..", relativePath), "utf-8");
}

const FILES_WITHOUT_BMS_OR_ENDOCRINE_SOCIETY = [
  "client/src/lib/clinicalKnowledgeBase.ts",
  "client/src/pages/ClinicalKnowledgeBase.tsx",
  "client/src/pages/AppointmentPrep.tsx",
  "client/src/pages/Onboarding.tsx",
  "client/src/pages/ReverseLookup.tsx",
  "client/src/pages/EvidenceEngine.tsx",
  "server/routers.ts",
];

describe("citation hardening batch 2 — BMS and Endocrine Society removed", () => {
  for (const file of FILES_WITHOUT_BMS_OR_ENDOCRINE_SOCIETY) {
    it(`${file} does not cite BMS or the Endocrine Society`, () => {
      const source = readSource(file);
      expect(source).not.toMatch(/\bBMS\b/);
      expect(source).not.toMatch(/British Menopause Society/i);
      expect(source).not.toMatch(/Endocrine Society/i);
    });
  }

  it("EvidenceEngine.tsx's feature description and Pro card only claim NAMS citations", () => {
    const source = readSource("client/src/pages/EvidenceEngine.tsx");
    expect(source).toContain("peer-reviewed citations from NAMS.");
    expect(source).toContain("Peer-reviewed NAMS citations");
  });

  it("AppointmentPrep.tsx's GP brief text and clinical-references list no longer reference BMS", () => {
    const source = readSource("client/src/pages/AppointmentPrep.tsx");
    expect(source).not.toContain("BMS Menopause Guidelines");
    // NAMS 2023 Hormone Therapy Position Statement is unaffected by this pass.
    expect(source).toContain("NAMS 2023 Hormone Therapy Position Statement");
  });

  it("server/routers.ts's evidence section keeps NAMS 2023 and Greene 1998, drops the BMS and Endocrine Society bullets", () => {
    const source = readSource("server/routers.ts");
    expect(source).toContain("NAMS (North American Menopause Society) 2023 Position Statement");
    expect(source).toContain("Greene JG. Constructing a Standard Climacteric Scale");
  });
});

describe("citation hardening batch 2 — Midi Health citations removed from clinicalKnowledgeBase.ts", () => {
  it("no entry cites Midi Health anywhere", () => {
    for (const entry of CLINICAL_KNOWLEDGE_BASE) {
      const sources = entry.citations.map(c => `${c.text} ${c.source} ${c.url}`).join(" ");
      expect(sources, `entry "${entry.id}"`).not.toMatch(/midi health|joinmidi\.com/i);
    }
  });

  it("night_sweats keeps its legitimate Kravitz et al. 2008 sleep-disruption citation", () => {
    const entry = CLINICAL_KNOWLEDGE_BASE.find(e => e.id === "night_sweats")!;
    expect(entry.citations.some(c => c.source.includes("Kravitz"))).toBe(true);
  });

  it("brain_fog drops the uncited 82%/12,507-survey prevalence figure and keeps the Mosconi citation", () => {
    const entry = CLINICAL_KNOWLEDGE_BASE.find(e => e.id === "brain_fog")!;
    expect(entry.prevalence).not.toMatch(/82%/);
    expect(entry.prevalence).toMatch(/vary widely/i);
    expect(entry.citations.some(c => c.source.includes("Mosconi"))).toBe(true);
  });

  it("fatigue drops the uncited 85% prevalence figure and keeps the Klinge citation", () => {
    const entry = CLINICAL_KNOWLEDGE_BASE.find(e => e.id === "fatigue")!;
    expect(entry.prevalence).not.toMatch(/85%/);
    expect(entry.prevalence).toMatch(/vary widely/i);
    expect(entry.citations.some(c => c.source.includes("Klinge"))).toBe(true);
  });

  it("vaginal_atrophy drops the uncited 45% prevalence figure and keeps the Portman & Gass citation", () => {
    const entry = CLINICAL_KNOWLEDGE_BASE.find(e => e.id === "vaginal_atrophy")!;
    expect(entry.prevalence).not.toMatch(/45%/);
    expect(entry.citations.some(c => c.source.includes("Portman"))).toBe(true);
  });

  it("weight_gain drops the uncited 87% prevalence and 1.5-lb/year figures, keeps the visceral-fat citation", () => {
    const entry = CLINICAL_KNOWLEDGE_BASE.find(e => e.id === "weight_gain")!;
    expect(entry.prevalence).not.toMatch(/87%/);
    expect(entry.clinicalContext).not.toMatch(/1\.5 pounds/);
    expect(entry.citations.some(c => c.text.includes("Visceral fat accumulation"))).toBe(true);
  });

  it("the file-level attribution comment no longer names BMS", () => {
    const source = readSource("client/src/lib/clinicalKnowledgeBase.ts");
    expect(source).toContain("from NAMS, IMS, NIH, and published clinical research.");
  });
});
