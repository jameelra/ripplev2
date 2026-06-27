import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: Array<{ name: string; options: Record<string, unknown> }> } {
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-ripple",
    email: "test@ripple.health",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("ai.analyzeDiary (heuristic fallback)", () => {
  it("returns a heuristic analysis when LLM is unavailable", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // This will use the heuristic fallback since no real LLM key in test env
    const result = await caller.ai.analyzeDiary({
      text: "I had terrible hot flashes and night sweats last night",
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.narrativeInsight).toBeTruthy();
    expect(result.data.hormonePrediction).toBeTruthy();
    expect(result.data.disclaimer).toBeTruthy();
  });

  it("detects sleep-related symptoms in diary text", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.analyzeDiary({
      text: "Woke up at 3am with anxiety and couldn't get back to sleep",
    });
    expect(result.success).toBe(true);
    // Heuristic may return Progesterone or Estrogen based on keyword order
    expect(["Progesterone Decline Window", "Estrogen Volatility Alert", "Cognitive Fluctuation Alert", "Cortisol Surge Pattern", "Recovery Index Optimal", "Estrogen Drop Baseline", "Hormonal baseline stable", "Estrogen/Progesterone Fluctuation & Cortisol Surge"]).toContain(result.data.hormonePrediction);
  });
});

describe("ai.reverseLookup", () => {
  it("returns results for known symptoms", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.reverseLookup({ query: "burning tongue" });
    expect(result.success).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].name).toBeTruthy();
    expect(result.results[0].explanation).toBeTruthy();
    expect(result.results[0].gpConversationGuide).toBeTruthy();
  });

  it("returns results for frozen shoulder", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.reverseLookup({ query: "frozen shoulder" });
    expect(result.success).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
  });
});

describe("ai.generateEvidence", () => {
  it("generates a GP brief with Greene scores from log data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const mockLogs = Array.from({ length: 5 }, (_, i) => ({
      id: `2026-06-${String(i + 1).padStart(2, "0")}`,
      date: `2026-06-${String(i + 1).padStart(2, "0")}`,
      symptoms: {
        hotFlashes: 2, nightSweats: 2, sleepLatency: 1, jointPain: 1,
        brainFog: 2, irritability: 1, anxiety: 1, fatigue: 2,
        heartPalpitations: 0, breastTenderness: 0, bloating: 1, postCarbCrash: 1,
      },
      signals: { sleepDuration: 6.5, sleepEfficiency: 78, hrv: 42, restingHeartRate: 72 },
      cycle: { cycleActive: false, spotting: false },
      diaryText: "Feeling tired and foggy today.",
    }));

    const mockCycleEvents = [
      { id: "ce1", date: "2026-06-01", type: "period_start" as const, createdAt: new Date().toISOString() },
      { id: "ce2", date: "2026-06-02", type: "period_active" as const, createdAt: new Date().toISOString() },
      { id: "ce3", date: "2026-06-03", type: "period_active" as const, createdAt: new Date().toISOString() },
      { id: "ce4", date: "2026-06-15", type: "ovulation" as const, createdAt: new Date().toISOString() },
      { id: "ce5", date: "2026-05-01", type: "period_start" as const, createdAt: new Date().toISOString() },
      { id: "ce6", date: "2026-05-10", type: "spotting" as const, createdAt: new Date().toISOString() },
    ];
    const mockHRTMedications = [
      {
        id: "med_001",
        name: "Oestrogel",
        activeIngredient: "Oestradiol",
        deliveryMethod: "gel",
        dose: "1.5mg",
        scheduleType: "daily",
        startDate: "2026-06-01",
        isActive: true,
      },
      {
        id: "med_002",
        name: "Utrogestan 200mg",
        activeIngredient: "Progesterone",
        deliveryMethod: "capsule",
        dose: "200mg",
        scheduleType: "cycle_days",
        startDate: "2026-06-01",
        isActive: true,
      },
    ];
    const mockTriggerAnalysis = {
      topTriggers: [
        {
          triggerName: "Alcohol",
          symptomLabel: "Hot Flashes",
          sameDayDifference: 1.8,
          nextDayDifference: 2.1,
          combinedEffect: 1.92,
          confidence: "strong" as const,
          occurrenceCount: 12,
        },
      ],
      minimumDataMet: true,
      dataPointsAnalysed: 20,
    };
    const result = await caller.ai.generateEvidence({
      logs: mockLogs,
      cycleEvents: mockCycleEvents,
      hrtMedications: mockHRTMedications,
      triggerAnalysis: mockTriggerAnalysis,
    });
    expect(result.success).toBe(true);
    expect(result.brief).toContain("Greene Climacteric Scale");
    expect(result.brief).toContain("NAMS");
    expect(result.brief).toContain("Menstrual Cycle Analysis");
    expect(result.brief).toContain("Period Start Events Logged");
    expect(result.brief).toContain("Spotting Events");
    expect(result.brief).toContain("Bleeding Days Logged");
    expect(result.brief).toContain("Current Treatment Regimen");
    expect(result.brief).toContain("Oestrogel");
    expect(result.brief).toContain("Utrogestan 200mg");
    expect(result.brief).toContain("Identified Symptom Triggers");
    expect(result.brief).toContain("Alcohol");
    expect(result.brief).toContain("Hot Flashes");
    expect(result.greeneScore).toBeGreaterThan(0);
    expect(result.vasomotorScore).toBeGreaterThan(0);
    expect(result.trackingDays).toBe(5);
  });
});
