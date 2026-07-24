import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-greene-evidence",
    email: "test@ripple.health",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return { ctx };
}

const mockLog = (id: string) => ({
  id,
  date: id,
  symptoms: { hotFlashes: 1, nightSweats: 1, sleepLatency: 1, jointPain: 1, brainFog: 1, irritability: 1, anxiety: 1, fatigue: 1, heartPalpitations: 0, breastTenderness: 0, bloating: 0, postCarbCrash: 0 },
  signals: { sleepDuration: 7, sleepEfficiency: 85, hrv: 55, restingHeartRate: 68 },
  cycle: { cycleActive: false, spotting: false },
  diaryText: "",
});

const mockLogs = ["2026-06-01", "2026-06-02", "2026-06-03"].map(mockLog);

function greeneEntry(takenAt: string, total: number) {
  return { takenAt, total, psychological: Math.round(total * 0.5), somatic: Math.round(total * 0.3), vasomotor: Math.round(total * 0.15), sexual: 1 };
}

describe("ai.generateEvidence — Greene Climacteric Scale section", () => {
  it("shows a graceful message and no fabricated score when no assessments have been recorded", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.generateEvidence({ logs: mockLogs, greeneScores: [] });

    expect(result.greene).toBeNull();
    expect(result.brief).toContain("No Greene Climacteric Scale assessments have been recorded yet");
    // No score table, no citation, since there's nothing to cite a score against.
    expect(result.brief).not.toContain("Most recent assessment:");
  });

  it("includes the most recent score with its date, and the verified Greene 1998 citation, when history exists", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const greeneScores = [greeneEntry("2026-05-01T09:00:00.000Z", 40), greeneEntry("2026-06-01T09:00:00.000Z", 28)];
    const result = await caller.ai.generateEvidence({ logs: mockLogs, greeneScores });

    expect(result.greene?.total).toBe(28);
    expect(result.greene?.takenAt).toBe("2026-06-01T09:00:00.000Z");
    expect(result.brief).toContain("Most recent assessment:** 28/60");
    expect(result.brief).toContain("June 1, 2026");
    // Verified canon citation — exact text pinned elsewhere in the repo
    // (client/tools/evidence-engine/index.html, server/evidenceEnginePage.test.ts)
    // rather than reconstructed here.
    expect(result.brief).toContain("Greene JG. Constructing a Standard Climacteric Scale. Maturitas. 1998;29(1):25–31.");
  });

  it("shows a subscale table with the instrument's real maximums (not the unrelated daily-log proxy's)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const greeneScores = [greeneEntry("2026-06-01T09:00:00.000Z", 30)];
    const result = await caller.ai.generateEvidence({ logs: mockLogs, greeneScores });

    // Real Greene subscale maximums: psychological /33, somatic /21, vasomotor /6, sexual /3.
    // The old proxy table used /15, /15, /6 — this asserts those are gone.
    expect(result.brief).toContain("/33");
    expect(result.brief).toContain("/21");
    expect(result.brief).not.toContain("Psychological (Anxiety, Brain fog, Irritability)");
  });

  it("caps the compact history at 6 entries, most recent first, when more than 6 exist", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const greeneScores = Array.from({ length: 9 }, (_, i) => greeneEntry(`2026-0${i + 1}-01T09:00:00.000Z`, 20 + i));
    const result = await caller.ai.generateEvidence({ logs: mockLogs, greeneScores });

    expect(result.brief).toContain("most recent 6");
    // Most recent 6 of 9 (indices 3..8, i.e. months 04-09) should appear; the oldest 3 (01-03) should not.
    expect(result.brief).toContain("Sep");
    expect(result.brief).not.toContain("| Jan 1, 2026 |");
  });

  it("shows 'all assessments' rather than a misleading '6' when there are 6 or fewer entries", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const greeneScores = [greeneEntry("2026-06-01T09:00:00.000Z", 20), greeneEntry("2026-07-01T09:00:00.000Z", 18)];
    const result = await caller.ai.generateEvidence({ logs: mockLogs, greeneScores });

    expect(result.brief).toContain("all assessments");
  });

  it("never asserts a diagnostic severity band ('mild'/'moderate'/'significant'/'severe') for the Greene section", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // A high score, on the theory that if diagnostic language were going to leak in via a threshold, it would show up here.
    const greeneScores = [greeneEntry("2026-06-01T09:00:00.000Z", 60)];
    const result = await caller.ai.generateEvidence({ logs: mockLogs, greeneScores });

    const section1 = result.brief.slice(result.brief.indexOf("## 1. Greene"), result.brief.indexOf("## 2."));
    const lower = section1.toLowerCase();
    expect(lower).not.toContain("severe");
    expect(lower).not.toContain("clinically significant");
    // "moderate" as a bare word is fine in neutral prose elsewhere in the report,
    // but must not appear as a severity verdict attached to this score.
    expect(lower).not.toMatch(/\|\s*moderate/);
  });
});

describe("EvidenceEngine.tsx — print structure (sibling-container rule)", () => {
  const source = fs.readFileSync(
    path.resolve(import.meta.dirname, "../client/src/pages/EvidenceEngine.tsx"),
    "utf-8"
  );

  it("keeps the printable GP brief container a sibling of the no-print action-button row, never nested inside it", () => {
    // Locate the no-print button row and find its matching closing </div> by
    // depth-counting div open/close tags from that point — the same
    // ancestor-safety property server/appointmentPrepPage.test.ts guards for
    // the static tool pages, adapted here for this JSX source file.
    const noPrintStart = source.indexOf('className="flex gap-2 no-print"');
    expect(noPrintStart, "expected to find the no-print action-button row").toBeGreaterThan(-1);

    const openTagStart = source.lastIndexOf("<div", noPrintStart);
    let depth = 0;
    let cursor = openTagStart;
    const tagRe = /<div\b|<\/div>/g;
    tagRe.lastIndex = openTagStart;
    let match: RegExpExecArray | null;
    let closeIndex = -1;
    while ((match = tagRe.exec(source)) !== null) {
      if (match[0] === "<div") depth++;
      else depth--;
      if (depth === 0) {
        closeIndex = match.index;
        break;
      }
    }
    expect(closeIndex, "expected to find the no-print row's matching closing tag").toBeGreaterThan(-1);

    const noPrintRegionContent = source.slice(openTagStart, closeIndex);
    // The printable brief content must NOT be inside this region.
    expect(noPrintRegionContent).not.toContain("Clinical GP Brief");
    expect(noPrintRegionContent).not.toContain("<Streamdown>");

    // And it must actually exist as a sibling shortly after.
    const afterNoPrintRegion = source.slice(closeIndex, closeIndex + 800);
    expect(afterNoPrintRegion).toContain("Clinical GP Brief");
  });
});
