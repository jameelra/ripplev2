// ─── Ripple v2 — Cycle Intelligence Engine ────────────────────────────────────
// Manages cycle events, computes predictions, and detects irregular patterns.
// All data is stored encrypted in the vault — never on the server in plaintext.

export type CycleEventType =
  | "period_start"
  | "period_active"
  | "period_end"
  | "ovulation"
  | "spotting"
  | "predicted_period"
  | "predicted_ovulation";

export interface CycleEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: CycleEventType;
  flowIntensity?: "light" | "medium" | "heavy" | "spotting";
  notes?: string;
  createdAt: string;
}

export interface CycleSummary {
  cycleNumber: number;
  startDate: string;
  endDate?: string;
  lengthDays?: number;
  bleedingDays: number;
}

export interface ReproductiveWindowIntelligence {
  status: "insufficient_data" | "analyzing" | "ready";
  minDataRequired: number;
  periodsLogged: number;
  averageCycleLength?: number;
  cycleVariability?: "regular" | "slightly_irregular" | "irregular" | "very_irregular";
  nextPeriodPrediction?: string; // YYYY-MM-DD
  ovulationWindowStart?: string;
  ovulationWindowEnd?: string;
  predictedOvulation?: string;
  irregularityNote?: string;
  lastUpdated?: string;
}

// ── Date helpers ──────────────────────────────────────────────────────────────
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00");
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function diffDays(a: string, b: string): number {
  const da = parseDate(a).getTime();
  const db = parseDate(b).getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

export function isSameMonth(dateStr: string, year: number, month: number): boolean {
  const d = parseDate(dateStr);
  return d.getFullYear() === year && d.getMonth() === month;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0 = Sunday
}

// ── Cycle Analysis ────────────────────────────────────────────────────────────

export function computeCycleSummaries(events: CycleEvent[]): CycleSummary[] {
  const periodStarts = events
    .filter((e) => e.type === "period_start")
    .sort((a, b) => a.date.localeCompare(b.date));

  if (periodStarts.length < 1) return [];

  return periodStarts.map((start, i) => {
    const nextStart = periodStarts[i + 1];
    const lengthDays = nextStart ? diffDays(start.date, nextStart.date) : undefined;

    // Count bleeding days for this cycle
    const cycleEnd = nextStart ? nextStart.date : addDays(start.date, 7);
    const bleedingDays = events.filter(
      (e) =>
        (e.type === "period_active" || e.type === "period_start") &&
        e.date >= start.date &&
        e.date < cycleEnd
    ).length + 1; // +1 for start day

    return {
      cycleNumber: i + 1,
      startDate: start.date,
      endDate: nextStart ? addDays(nextStart.date, -1) : undefined,
      lengthDays,
      bleedingDays: Math.min(bleedingDays, 10),
    };
  });
}

export function computeReproductiveIntelligence(
  events: CycleEvent[]
): ReproductiveWindowIntelligence {
  const MIN_PERIODS = 2;
  const periodStarts = events
    .filter((e) => e.type === "period_start")
    .sort((a, b) => a.date.localeCompare(b.date));

  if (periodStarts.length < MIN_PERIODS) {
    return {
      status: "insufficient_data",
      minDataRequired: MIN_PERIODS,
      periodsLogged: periodStarts.length,
    };
  }

  // Calculate cycle lengths
  const cycleLengths: number[] = [];
  for (let i = 0; i < periodStarts.length - 1; i++) {
    const len = diffDays(periodStarts[i].date, periodStarts[i + 1].date);
    if (len >= 14 && len <= 90) cycleLengths.push(len); // sanity filter
  }

  if (cycleLengths.length === 0) {
    return {
      status: "insufficient_data",
      minDataRequired: MIN_PERIODS,
      periodsLogged: periodStarts.length,
    };
  }

  const avgCycleLength = Math.round(
    cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
  );

  // Variability
  const maxLen = Math.max(...cycleLengths);
  const minLen = Math.min(...cycleLengths);
  const variabilityRange = maxLen - minLen;
  let cycleVariability: ReproductiveWindowIntelligence["cycleVariability"];
  let irregularityNote: string | undefined;

  if (variabilityRange <= 3) {
    cycleVariability = "regular";
  } else if (variabilityRange <= 7) {
    cycleVariability = "slightly_irregular";
    irregularityNote = `Your cycles vary by up to ${variabilityRange} days — mild irregularity consistent with early perimenopause.`;
  } else if (variabilityRange <= 14) {
    cycleVariability = "irregular";
    irregularityNote = `Your cycles vary by ${variabilityRange} days — significant irregularity. This is a hallmark of perimenopause. Include this in your Evidence Engine brief.`;
  } else {
    cycleVariability = "very_irregular";
    irregularityNote = `Your cycles vary by more than ${variabilityRange} days — highly irregular. This strongly suggests active perimenopause transition. Discuss with your GP.`;
  }

  // Predict next period from last start
  const lastStart = periodStarts[periodStarts.length - 1].date;
  const nextPeriodPrediction = addDays(lastStart, avgCycleLength);

  // Predict ovulation (typically ~14 days before next period)
  const predictedOvulation = addDays(nextPeriodPrediction, -14);
  const ovulationWindowStart = addDays(predictedOvulation, -2);
  const ovulationWindowEnd = addDays(predictedOvulation, 2);

  return {
    status: "ready",
    minDataRequired: MIN_PERIODS,
    periodsLogged: periodStarts.length,
    averageCycleLength: avgCycleLength,
    cycleVariability,
    nextPeriodPrediction,
    predictedOvulation,
    ovulationWindowStart,
    ovulationWindowEnd,
    irregularityNote,
    lastUpdated: new Date().toISOString(),
  };
}

// ── Generate predicted events for calendar display ────────────────────────────
export function generatePredictedEvents(
  intelligence: ReproductiveWindowIntelligence
): CycleEvent[] {
  if (intelligence.status !== "ready") return [];
  const predicted: CycleEvent[] = [];

  if (intelligence.nextPeriodPrediction) {
    // Predict 5 days of period
    for (let i = 0; i < 5; i++) {
      predicted.push({
        id: `pred_period_${i}`,
        date: addDays(intelligence.nextPeriodPrediction, i),
        type: i === 0 ? "predicted_period" : "predicted_period",
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (intelligence.predictedOvulation) {
    predicted.push({
      id: "pred_ovulation",
      date: intelligence.predictedOvulation,
      type: "predicted_ovulation",
      createdAt: new Date().toISOString(),
    });
  }

  return predicted;
}

// ── Event colour map ──────────────────────────────────────────────────────────
export const EVENT_STYLES: Record<CycleEventType, { bg: string; text: string; label: string; dotColor: string }> = {
  period_start:      { bg: "bg-[#8B1A1A]",   text: "text-white",        label: "Period (Began)",     dotColor: "#8B1A1A" },
  period_active:     { bg: "bg-[#F4A0A0]",   text: "text-[#8B1A1A]",   label: "Active Period Day",  dotColor: "#F4A0A0" },
  period_end:        { bg: "bg-[#F4A0A0]",   text: "text-[#8B1A1A]",   label: "Period Ended",       dotColor: "#F4A0A0" },
  ovulation:         { bg: "bg-[#2D6A4F]",   text: "text-white",        label: "Ovulation Day",      dotColor: "#2D6A4F" },
  spotting:          { bg: "bg-[#F9E4B7]",   text: "text-[#8B6914]",   label: "Spotting",           dotColor: "#F9E4B7" },
  predicted_period:  { bg: "bg-[#F4A0A0]/40", text: "text-[#8B1A1A]",  label: "Predicted Period",   dotColor: "#F4A0A0" },
  predicted_ovulation:{ bg: "bg-[#2D6A4F]/30", text: "text-[#2D6A4F]", label: "Predicted Ovulation",dotColor: "#2D6A4F" },
};
