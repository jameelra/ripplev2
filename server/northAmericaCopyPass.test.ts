import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { PUBLIC_TOOL_PAGES } from "../shared/publicPages";

// North America / USD market decision: "GP" is British vocabulary and reads
// oddly to a US/Canadian audience. This pins the "GP" → "doctor" sweep across
// public pages, in-app copy, and shared print/text builders, so it can't
// silently drift back in. Deliberately excluded, and NOT checked here:
//   - code comments (not user-facing)
//   - todo.md (internal, non-user-facing — same precedent as PR #14)
//   - NICE NG23 citation text itself (a real international guideline, kept
//     as-is per the task's explicit instruction)
//   - the Balance comparison pages' factual claims about Balance itself
//     (e.g. its NHS/ORCHA listing — those are facts about a third party,
//     not vocabulary choices, and untouched by this pass)
// This pass intentionally did NOT touch British spelling conventions
// (oestrogen, organisation, personalised, ...) — that's a much larger,
// separate decision, flagged but not actioned this round.

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(import.meta.dirname, "..", relativePath), "utf-8");
}

const IN_APP_FILES_WITHOUT_GP = [
  "shared/appointmentPrepBuilder.ts",
  "shared/dismissalLog.ts",
  "shared/hrtTrackingLogBuilder.ts",
  "client/src/lib/cycleIntelligence.ts",
  "client/src/lib/wikiLinks.ts",
  "client/src/pages/DismissalTracker.tsx",
  "client/src/pages/ClinicalKnowledgeBase.tsx",
  "client/src/pages/MenopauseMode.tsx",
  "client/src/pages/Dashboard.tsx",
  "client/src/pages/HRTTracker.tsx",
  "client/src/pages/SymptomLog.tsx",
  "client/src/pages/CycleCalendar.tsx",
  "client/src/pages/UpgradeHub.tsx",
  "client/src/pages/AppointmentPrep.tsx",
  "client/src/pages/Onboarding.tsx",
  "client/src/pages/ReverseLookup.tsx",
  "client/src/pages/EvidenceEngine.tsx",
];

describe("North America copy pass — in-app and shared builder copy", () => {
  for (const file of IN_APP_FILES_WITHOUT_GP) {
    it(`${file} has no user-facing "GP" string outside a code comment`, () => {
      const source = readSource(file);
      // Strip //, {/* */}, and <!-- --> comments before checking, since
      // comments aren't user-facing copy and are out of scope for this pass.
      const withoutLineComments = source.replace(/\/\/.*$/gm, "");
      const withoutBlockComments = withoutLineComments.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
      expect(withoutBlockComments).not.toMatch(/\bGPs?\b/);
    });
  }

  it("HRTTracker.tsx keeps 'your doctor at your next appointment' distinct from the doctor-brief mention", () => {
    const source = readSource("client/src/pages/HRTTracker.tsx");
    expect(source).toContain("Evidence Engine doctor brief. Share it with your doctor at your next appointment.");
  });
});

describe("North America copy pass — public SEO tool pages", () => {
  for (const page of PUBLIC_TOOL_PAGES) {
    it(`${page.slug}/index.html has no user-facing "GP" string outside an HTML comment`, () => {
      const source = readSource(`client/tools/${page.slug}/index.html`);
      const withoutComments = source.replace(/<!--[\s\S]*?-->/g, "");
      expect(withoutComments).not.toMatch(/\bGPs?\b/);
    });
  }

  it("greene-climacteric-scale/index.html's FAQ heading and answer now agree on 'doctor'", () => {
    const source = readSource("client/tools/greene-climacteric-scale/index.html");
    expect(source).toContain("Can I bring my results to a doctor's appointment?");
    expect(source).toContain("bring to a doctor or menopause specialist");
  });
});

describe("North America copy pass — invariants preserved", () => {
  it("does not touch the NICE NG23 citation text", () => {
    const appointmentPrep = readSource("client/src/pages/AppointmentPrep.tsx");
    expect(appointmentPrep).toContain("NICE's guideline on menopause (NG23)");
    const clinicalKb = readSource("client/src/lib/clinicalKnowledgeBase.ts");
    expect(clinicalKb).toContain("NG23");
  });

  it("does not touch the Balance comparison pages' factual NHS/ORCHA claims about Balance", () => {
    for (const slug of ["balance-alternative", "ripple-vs-balance"]) {
      const source = readSource(`client/tools/${slug}/index.html`);
      expect(source).toContain("NHS digital health library");
      expect(source).toContain("ORCHA");
    }
  });
});
