// ─── Ripple v2 — HRT Engine ───────────────────────────────────────────────────
// Correlation engine and treatment response algorithm.
// All computation is client-side — no raw health data ever leaves the device.

import {
  DayLog,
  SymptomLog,
  HRTMedication,
  TriggerCorrelation,
  TriggerAnalysis,
  TreatmentResponseSummary,
  SYMPTOM_LABELS,
} from "../../../shared/types";

// ─── Helper: compute PSS score from a set of logs ────────────────────────────
export function computePSSFromLogs(logs: DayLog[]): number {
  if (logs.length === 0) return 0;
  let total = 0;
  logs.forEach((log) => {
    total += Object.values(log.symptoms).reduce((a, b) => a + b, 0);
  });
  // Max possible per day = 12 symptoms × 3 = 36
  return Math.min(100, Math.round((total / (logs.length * 36)) * 100));
}

// ─── Helper: mean of an array ─────────────────────────────────────────────────
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ─── Helper: get the date string N days after a given date string ─────────────
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// ─── Correlation Engine ───────────────────────────────────────────────────────
// Minimum 14 days of co-logged trigger + symptom data required.
// Computes both same-day and 24-hour lag (next-day) correlations.

const MIN_DAYS_FOR_CORRELATION = 14;
const MIN_OCCURRENCES_FOR_STRONG = 7;
const MIN_OCCURRENCES_FOR_MODERATE = 5;
const MIN_OCCURRENCES_FOR_POSSIBLE = 3;

export function computeTriggerCorrelations(logs: DayLog[]): TriggerAnalysis {
  const now = new Date().toISOString();

  // Filter to logs that have triggers
  const logsWithTriggers = logs.filter(
    (l) => l.triggers && l.triggers.triggers.length > 0
  );

  if (logsWithTriggers.length < MIN_DAYS_FOR_CORRELATION) {
    return {
      correlations: [],
      topTriggers: [],
      dataPointsAnalysed: logsWithTriggers.length,
      minimumDataMet: false,
      lastComputedAt: now,
    };
  }

  // Build a date → log map for fast next-day lookup
  const logByDate = new Map<string, DayLog>();
  logs.forEach((l) => logByDate.set(l.id, l));

  // Collect all unique trigger IDs
  const allTriggerIds = new Map<string, string>(); // id → name
  logsWithTriggers.forEach((log) => {
    log.triggers!.triggers.forEach((t) => {
      allTriggerIds.set(t.id, t.name);
    });
  });

  const correlations: TriggerCorrelation[] = [];

  for (const [triggerId, triggerName] of Array.from(allTriggerIds.entries())) {
    // Partition logs
    const withTrigger = logs.filter(
      (l) =>
        l.triggers?.triggers.some((t) => t.id === triggerId) ||
        l.triggers?.previousDayTriggers?.some((t) => t.id === triggerId)
    );
    const withoutTrigger = logs.filter(
      (l) =>
        !l.triggers?.triggers.some((t) => t.id === triggerId) &&
        !l.triggers?.previousDayTriggers?.some((t) => t.id === triggerId)
    );

    const occurrenceCount = withTrigger.length;
    if (occurrenceCount < MIN_OCCURRENCES_FOR_POSSIBLE) continue;

    // Find the symptom most affected by this trigger
    let bestCorrelation: TriggerCorrelation | null = null;
    let bestCombinedEffect = 0;

    const symptomKeys = Object.keys(SYMPTOM_LABELS) as (keyof SymptomLog)[];

    for (const symptomKey of symptomKeys) {
      // Same-day correlation
      const withValues = withTrigger.map((l) => l.symptoms[symptomKey] as number);
      const withoutValues = withoutTrigger.map((l) => l.symptoms[symptomKey] as number);
      const avgWith = mean(withValues);
      const avgWithout = mean(withoutValues);
      const sameDayDiff = avgWith - avgWithout;

      // Next-day correlation (24-hour lag)
      const nextDayWithValues: number[] = [];
      const nextDayWithoutValues: number[] = [];

      withTrigger.forEach((l) => {
        const nextDay = logByDate.get(addDays(l.id, 1));
        if (nextDay) nextDayWithValues.push(nextDay.symptoms[symptomKey] as number);
      });
      withoutTrigger.forEach((l) => {
        const nextDay = logByDate.get(addDays(l.id, 1));
        if (nextDay) nextDayWithoutValues.push(nextDay.symptoms[symptomKey] as number);
      });

      const nextDayAvgWith = mean(nextDayWithValues);
      const nextDayAvgWithout = mean(nextDayWithoutValues);
      const nextDayDiff = nextDayAvgWith - nextDayAvgWithout;

      // Combined effect: weighted average (same-day slightly more weight)
      const combinedEffect = sameDayDiff * 0.6 + nextDayDiff * 0.4;

      if (Math.abs(combinedEffect) > Math.abs(bestCombinedEffect)) {
        bestCombinedEffect = combinedEffect;

        // Assign confidence
        let confidence: TriggerCorrelation["confidence"] = "insufficient_data";
        if (
          Math.abs(combinedEffect) >= 1.0 &&
          occurrenceCount >= MIN_OCCURRENCES_FOR_STRONG
        ) {
          confidence = "strong";
        } else if (
          Math.abs(combinedEffect) >= 0.5 &&
          occurrenceCount >= MIN_OCCURRENCES_FOR_MODERATE
        ) {
          confidence = "moderate";
        } else if (
          Math.abs(combinedEffect) >= 0.3 &&
          occurrenceCount >= MIN_OCCURRENCES_FOR_POSSIBLE
        ) {
          confidence = "possible";
        }

        bestCorrelation = {
          triggerId,
          triggerName,
          symptomKey,
          symptomLabel: SYMPTOM_LABELS[symptomKey],
          avgSeverityWithTrigger: Math.round(avgWith * 100) / 100,
          avgSeverityWithoutTrigger: Math.round(avgWithout * 100) / 100,
          sameDayDifference: Math.round(sameDayDiff * 100) / 100,
          nextDayAvgWithTrigger: Math.round(nextDayAvgWith * 100) / 100,
          nextDayAvgWithoutTrigger: Math.round(nextDayAvgWithout * 100) / 100,
          nextDayDifference: Math.round(nextDayDiff * 100) / 100,
          combinedEffect: Math.round(combinedEffect * 100) / 100,
          occurrenceCount,
          confidence,
          computedAt: now,
        };
      }
    }

    if (bestCorrelation && bestCorrelation.confidence !== "insufficient_data") {
      correlations.push(bestCorrelation);
    }
  }

  // Sort by |combinedEffect| descending
  correlations.sort(
    (a, b) => Math.abs(b.combinedEffect) - Math.abs(a.combinedEffect)
  );

  const topTriggers = correlations.slice(0, 3);

  return {
    correlations,
    topTriggers,
    dataPointsAnalysed: logsWithTriggers.length,
    minimumDataMet: true,
    lastComputedAt: now,
  };
}

// ─── Treatment Response Algorithm ────────────────────────────────────────────
// Compares PSS and per-symptom scores from 30 days before vs. after a
// medication start date. Requires ≥7 days of data on each side.

const MIN_DAYS_FOR_RESPONSE = 7;
const RESPONSE_WINDOW_DAYS = 30;

export function computeTreatmentResponse(
  medication: HRTMedication,
  logs: DayLog[]
): TreatmentResponseSummary {
  const startDate = medication.startDate;

  const beforeLogs = logs
    .filter((l) => l.date < startDate)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, RESPONSE_WINDOW_DAYS);

  const afterLogs = logs
    .filter((l) => l.date >= startDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, RESPONSE_WINDOW_DAYS);

  if (
    beforeLogs.length < MIN_DAYS_FOR_RESPONSE ||
    afterLogs.length < MIN_DAYS_FOR_RESPONSE
  ) {
    return {
      medicationId: medication.id,
      medicationName: medication.name,
      startDate,
      beforePSS: 0,
      afterPSS: 0,
      pssChangePercent: 0,
      beforeDays: beforeLogs.length,
      afterDays: afterLogs.length,
      topImprovedSymptoms: [],
      topWorsenedSymptoms: [],
      insufficientData: true,
    };
  }

  const beforePSS = computePSSFromLogs(beforeLogs);
  const afterPSS = computePSSFromLogs(afterLogs);
  const pssChangePercent =
    beforePSS > 0
      ? Math.round(((afterPSS - beforePSS) / beforePSS) * 100)
      : 0;

  // Per-symptom comparison
  const symptomKeys = Object.keys(SYMPTOM_LABELS) as (keyof SymptomLog)[];
  const symptomChanges = symptomKeys.map((key) => {
    const beforeAvg = mean(beforeLogs.map((l) => l.symptoms[key] as number));
    const afterAvg = mean(afterLogs.map((l) => l.symptoms[key] as number));
    return {
      key,
      label: SYMPTOM_LABELS[key],
      change: Math.round((afterAvg - beforeAvg) * 100) / 100,
    };
  });

  // Sort: most improved (most negative change) first
  const sorted = [...symptomChanges].sort((a, b) => a.change - b.change);
  const topImprovedSymptoms = sorted.filter((s) => s.change < -0.1).slice(0, 3);
  const topWorsenedSymptoms = sorted
    .filter((s) => s.change > 0.1)
    .reverse()
    .slice(0, 3);

  return {
    medicationId: medication.id,
    medicationName: medication.name,
    startDate,
    beforePSS,
    afterPSS,
    pssChangePercent,
    beforeDays: beforeLogs.length,
    afterDays: afterLogs.length,
    topImprovedSymptoms,
    topWorsenedSymptoms,
    insufficientData: false,
  };
}

// ─── Next Due Date Calculator ─────────────────────────────────────────────────
// Given a medication and the last dose log, compute the next due date.

export function computeNextDueDate(
  medication: HRTMedication,
  lastDoseDate: string | null,
  today: string
): string | null {
  if (!lastDoseDate) return today; // Never taken — due today

  switch (medication.scheduleType) {
    case "daily":
      return addDays(lastDoseDate, 1);

    case "every_n_days":
      if (!medication.intervalDays) return null;
      return addDays(lastDoseDate, medication.intervalDays);

    case "days_of_week": {
      if (!medication.daysOfWeek || medication.daysOfWeek.length === 0) return null;
      const todayDate = new Date(today + "T12:00:00");
      const todayDay = todayDate.getDay();
      const sortedDays = [...medication.daysOfWeek].sort((a, b) => a - b);
      // Find the next scheduled day
      const nextDay = sortedDays.find((d) => d > todayDay) ?? sortedDays[0];
      const daysUntil = nextDay > todayDay ? nextDay - todayDay : 7 - todayDay + nextDay;
      return addDays(today, daysUntil);
    }

    case "cycle_days":
      // Cycle-based — cannot compute without cycle data; return null
      return null;

    case "as_needed":
      return null;

    default:
      return null;
  }
}

// ─── Adherence Calculator ─────────────────────────────────────────────────────
// Returns adherence percentage for a medication over the last N days.

export function computeAdherence(
  medication: HRTMedication,
  doseLogs: import("../../../shared/types").HRTDoseLog[],
  windowDays = 30
): { percentage: number; takenCount: number; expectedCount: number } {
  const today = new Date().toISOString().split("T")[0];
  const windowStart = addDays(today, -windowDays);

  const relevantLogs = doseLogs.filter(
    (l) =>
      l.medicationId === medication.id &&
      l.scheduledDate >= windowStart &&
      l.scheduledDate <= today
  );

  const takenCount = relevantLogs.filter((l) => !l.skipped).length;
  const skippedCount = relevantLogs.filter((l) => l.skipped).length;

  // Estimate expected doses based on schedule
  let expectedCount = 0;
  if (medication.scheduleType === "daily") {
    expectedCount = windowDays;
  } else if (medication.scheduleType === "every_n_days" && medication.intervalDays) {
    expectedCount = Math.floor(windowDays / medication.intervalDays);
  } else if (medication.scheduleType === "days_of_week" && medication.daysOfWeek) {
    expectedCount = Math.floor((windowDays / 7) * medication.daysOfWeek.length);
  } else {
    // For other types, use actual logged count as expected
    expectedCount = takenCount + skippedCount;
  }

  const percentage =
    expectedCount > 0 ? Math.round((takenCount / expectedCount) * 100) : 0;

  return { percentage: Math.min(100, percentage), takenCount, expectedCount };
}
