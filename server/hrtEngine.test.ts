import { describe, expect, it } from "vitest";
import {
  computeTriggerCorrelations,
  computeTreatmentResponse,
  computePSSFromLogs,
  computeAdherence,
} from "../client/src/lib/hrtEngine";
import { DayLog, HRTMedication, HRTDoseLog, DEFAULT_SYMPTOMS, DEFAULT_SIGNALS, DEFAULT_CYCLE } from "../shared/types";

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function makeLog(date: string, overrides: Partial<DayLog> = {}): DayLog {
  return {
    id: date,
    date,
    symptoms: { ...DEFAULT_SYMPTOMS },
    signals: { ...DEFAULT_SIGNALS },
    cycle: { ...DEFAULT_CYCLE },
    diaryText: "",
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeAlcoholTrigger() {
  return {
    id: "alcohol",
    name: "Alcohol",
    category: "dietary" as const,
    isCustom: false,
  };
}

function makeMedication(overrides: Partial<HRTMedication> = {}): HRTMedication {
  const now = new Date().toISOString();
  return {
    id: "med_test_001",
    name: "Oestrogel",
    activeIngredient: "Oestradiol",
    deliveryMethod: "gel",
    dose: "1.5mg",
    scheduleType: "daily",
    startDate: "2026-06-01",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── PSS Computation Tests ────────────────────────────────────────────────────

describe("computePSSFromLogs", () => {
  it("returns 0 for empty logs", () => {
    expect(computePSSFromLogs([])).toBe(0);
  });

  it("returns 100 for all-maximum symptoms", () => {
    const log = makeLog("2026-06-01", {
      symptoms: {
        hotFlashes: 3, nightSweats: 3, sleepLatency: 3, jointPain: 3,
        brainFog: 3, irritability: 3, anxiety: 3, fatigue: 3,
        heartPalpitations: 3, breastTenderness: 3, bloating: 3, postCarbCrash: 3,
      },
    });
    expect(computePSSFromLogs([log])).toBe(100);
  });

  it("returns 0 for all-zero symptoms", () => {
    const log = makeLog("2026-06-01");
    expect(computePSSFromLogs([log])).toBe(0);
  });

  it("computes correct PSS for partial symptoms", () => {
    const log = makeLog("2026-06-01", {
      symptoms: {
        ...DEFAULT_SYMPTOMS,
        hotFlashes: 3,
        brainFog: 3,
        fatigue: 3,
        // all others 0 → total = 9 out of 36 max
      },
    });
    const pss = computePSSFromLogs([log]);
    expect(pss).toBe(25); // 9/36 * 100 = 25
  });

  it("averages across multiple logs", () => {
    const log1 = makeLog("2026-06-01", {
      symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: 2, brainFog: 2 },
    });
    const log2 = makeLog("2026-06-02", {
      symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: 0, brainFog: 0 },
    });
    const pss = computePSSFromLogs([log1, log2]);
    // log1: 4/36, log2: 0/36, avg = 2/36 per day → 2/36 * 100 ≈ 6
    expect(pss).toBeGreaterThan(0);
    expect(pss).toBeLessThan(20);
  });
});

// ─── Trigger Correlation Tests ────────────────────────────────────────────────

describe("computeTriggerCorrelations", () => {
  it("returns minimumDataMet=false with fewer than 14 days of trigger data", () => {
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, {
        triggers: { date: `2026-06-${String(i + 1).padStart(2, "0")}`, triggers: [makeAlcoholTrigger()] },
      })
    );
    const result = computeTriggerCorrelations(logs);
    expect(result.minimumDataMet).toBe(false);
    expect(result.correlations).toHaveLength(0);
  });

  it("returns minimumDataMet=true with 14+ days of trigger data", () => {
    // 30 days: alcohol on 15 days (high hot flashes), no alcohol on 15 days (low hot flashes)
    const logs: DayLog[] = [];
    for (let i = 0; i < 15; i++) {
      const date = `2026-06-${String(i + 1).padStart(2, "0")}`;
      logs.push(makeLog(date, {
        symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: 3, nightSweats: 3 },
        triggers: { date, triggers: [makeAlcoholTrigger()] },
      }));
    }
    for (let i = 15; i < 30; i++) {
      const date = `2026-06-${String(i + 1).padStart(2, "0")}`;
      logs.push(makeLog(date, {
        symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: 0, nightSweats: 0 },
        triggers: { date, triggers: [] },
      }));
    }
    const result = computeTriggerCorrelations(logs);
    expect(result.minimumDataMet).toBe(true);
    expect(result.dataPointsAnalysed).toBe(15); // only days WITH triggers count
  });

  it("detects strong alcohol → hot flash correlation", () => {
    const logs: DayLog[] = [];
    // 15 days with alcohol: hot flashes = 3
    for (let i = 0; i < 15; i++) {
      const date = `2026-06-${String(i + 1).padStart(2, "0")}`;
      logs.push(makeLog(date, {
        symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: 3 },
        triggers: { date, triggers: [makeAlcoholTrigger()] },
      }));
    }
    // 15 days without alcohol: hot flashes = 0
    for (let i = 15; i < 30; i++) {
      const date = `2026-06-${String(i + 1).padStart(2, "0")}`;
      logs.push(makeLog(date, {
        symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: 0 },
      }));
    }
    const result = computeTriggerCorrelations(logs);
    expect(result.minimumDataMet).toBe(true);
    const alcoholCorr = result.correlations.find((c) => c.triggerId === "alcohol");
    expect(alcoholCorr).toBeDefined();
    expect(alcoholCorr!.symptomKey).toBe("hotFlashes");
    expect(alcoholCorr!.sameDayDifference).toBeGreaterThan(2.0);
    expect(["strong", "moderate"]).toContain(alcoholCorr!.confidence);
  });

  it("topTriggers contains at most 3 entries", () => {
    const logs: DayLog[] = [];
    const triggers = [
      { id: "alcohol", name: "Alcohol", category: "dietary" as const, isCustom: false },
      { id: "caffeine", name: "Caffeine", category: "dietary" as const, isCustom: false },
      { id: "high_stress", name: "High Stress", category: "lifestyle" as const, isCustom: false },
      { id: "poor_sleep", name: "Poor Sleep", category: "lifestyle" as const, isCustom: false },
    ];
    for (let i = 0; i < 20; i++) {
      const date = `2026-06-${String(i + 1).padStart(2, "0")}`;
      logs.push(makeLog(date, {
        symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: i % 2 === 0 ? 3 : 0 },
        triggers: {
          date,
          triggers: i % 2 === 0 ? triggers : [],
        },
      }));
    }
    const result = computeTriggerCorrelations(logs);
    expect(result.topTriggers.length).toBeLessThanOrEqual(3);
  });
});

// ─── Treatment Response Tests ─────────────────────────────────────────────────

describe("computeTreatmentResponse", () => {
  it("returns insufficientData=true with fewer than 7 days before", () => {
    const med = makeMedication({ startDate: "2026-06-10" });
    const logs = [
      makeLog("2026-06-08", { symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: 3 } }),
      makeLog("2026-06-09", { symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: 3 } }),
      // only 2 days before — insufficient
      ...Array.from({ length: 10 }, (_, i) =>
        makeLog(`2026-06-${String(i + 10).padStart(2, "0")}`, {
          symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: 1 },
        })
      ),
    ];
    const result = computeTreatmentResponse(med, logs);
    expect(result.insufficientData).toBe(true);
  });

  it("returns insufficientData=true with fewer than 7 days after", () => {
    const med = makeMedication({ startDate: "2026-06-20" });
    const logs = [
      ...Array.from({ length: 14 }, (_, i) =>
        makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, {
          symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: 3 },
        })
      ),
      makeLog("2026-06-20", { symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: 2 } }),
      makeLog("2026-06-21", { symptoms: { ...DEFAULT_SYMPTOMS, hotFlashes: 2 } }),
      // only 2 days after — insufficient
    ];
    const result = computeTreatmentResponse(med, logs);
    expect(result.insufficientData).toBe(true);
  });

  it("detects PSS improvement after treatment start", () => {
    const med = makeMedication({ startDate: "2026-06-15" });
    // 14 days before: high symptoms
    const beforeLogs = Array.from({ length: 14 }, (_, i) =>
      makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, {
        symptoms: {
          ...DEFAULT_SYMPTOMS,
          hotFlashes: 3, nightSweats: 3, brainFog: 3, fatigue: 3,
        },
      })
    );
    // 14 days after: low symptoms
    const afterLogs = Array.from({ length: 14 }, (_, i) =>
      makeLog(`2026-06-${String(i + 15).padStart(2, "0")}`, {
        symptoms: {
          ...DEFAULT_SYMPTOMS,
          hotFlashes: 1, nightSweats: 0, brainFog: 1, fatigue: 1,
        },
      })
    );
    const result = computeTreatmentResponse(med, [...beforeLogs, ...afterLogs]);
    expect(result.insufficientData).toBe(false);
    expect(result.beforePSS).toBeGreaterThan(result.afterPSS);
    expect(result.pssChangePercent).toBeLessThan(0); // negative = improvement
    expect(result.topImprovedSymptoms.length).toBeGreaterThan(0);
    expect(result.topImprovedSymptoms[0].change).toBeLessThan(0);
  });

  it("detects correct medication name and start date", () => {
    const med = makeMedication({ name: "Utrogestan 200mg", startDate: "2026-06-10" });
    const logs = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, {
          symptoms: { ...DEFAULT_SYMPTOMS, sleepLatency: 3 },
        })
      ),
      ...Array.from({ length: 10 }, (_, i) =>
        makeLog(`2026-06-${String(i + 10).padStart(2, "0")}`, {
          symptoms: { ...DEFAULT_SYMPTOMS, sleepLatency: 1 },
        })
      ),
    ];
    const result = computeTreatmentResponse(med, logs);
    expect(result.medicationName).toBe("Utrogestan 200mg");
    expect(result.startDate).toBe("2026-06-10");
  });
});

// ─── Adherence Tests ──────────────────────────────────────────────────────────

describe("computeAdherence", () => {
  it("returns 100% for perfect daily adherence", () => {
    const med = makeMedication({ scheduleType: "daily" });
    const today = new Date().toISOString().split("T")[0];
    const doseLogs: HRTDoseLog[] = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const date = d.toISOString().split("T")[0];
      return {
        id: `dose_${i}`,
        medicationId: med.id,
        scheduledDate: date,
        takenAt: new Date().toISOString(),
        skipped: false,
      };
    });
    const result = computeAdherence(med, doseLogs, 30);
    expect(result.percentage).toBe(100);
    expect(result.takenCount).toBe(30);
  });

  it("returns 0% when all doses skipped", () => {
    const med = makeMedication({ scheduleType: "daily" });
    const doseLogs: HRTDoseLog[] = Array.from({ length: 10 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (9 - i));
      const date = d.toISOString().split("T")[0];
      return {
        id: `dose_${i}`,
        medicationId: med.id,
        scheduledDate: date,
        takenAt: new Date().toISOString(),
        skipped: true,
      };
    });
    const result = computeAdherence(med, doseLogs, 30);
    expect(result.percentage).toBe(0);
    expect(result.takenCount).toBe(0);
  });

  it("returns empty result for unrelated medications", () => {
    const med = makeMedication({ id: "med_A" });
    const doseLogs: HRTDoseLog[] = [
      {
        id: "dose_1",
        medicationId: "med_B", // different medication
        scheduledDate: new Date().toISOString().split("T")[0],
        takenAt: new Date().toISOString(),
        skipped: false,
      },
    ];
    const result = computeAdherence(med, doseLogs, 30);
    expect(result.takenCount).toBe(0);
  });
});
