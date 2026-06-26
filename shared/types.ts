// ─── Ripple v2 Shared Types ───────────────────────────────────────────────────

export type SeverityScore = 0 | 1 | 2 | 3; // 0: None, 1: Mild, 2: Moderate, 3: Severe
export type LicenseTier = "Free" | "Pro" | "Premier";

export interface SymptomLog {
  hotFlashes: SeverityScore;
  nightSweats: SeverityScore;
  sleepLatency: SeverityScore;
  jointPain: SeverityScore;
  brainFog: SeverityScore;
  irritability: SeverityScore;
  anxiety: SeverityScore;
  fatigue: SeverityScore;
  heartPalpitations: SeverityScore;
  breastTenderness: SeverityScore;
  bloating: SeverityScore;
  postCarbCrash: SeverityScore;
}

export interface BiologicalSignals {
  sleepDuration: number;    // hours
  sleepEfficiency: number;  // percentage 0-100
  hrv: number;              // ms SDNN
  restingHeartRate: number; // bpm
}

export interface CycleLog {
  cycleActive: boolean;
  flowIntensity?: "light" | "medium" | "heavy" | "spotting";
  spotting: boolean;
  irregularPattern?: boolean;
}

export interface DayLog {
  id: string;         // YYYY-MM-DD
  date: string;
  symptoms: SymptomLog;
  signals: BiologicalSignals;
  cycle: CycleLog;
  diaryText: string;
  aiInsight?: string;
  hormonePrediction?: string;
  timestamp: string;
}

export interface DismissalRecord {
  id: string;
  date: string;
  clinicName: string;
  clinicianName: string;
  symptomsReported: string[];
  response: string;
  wasResolved: boolean;
}

export interface GPReportData {
  appointmentBrief: string;
  greeneScore: number;
  vasomotorScore: number;
  somaticScore: number;
  psychologicalScore: number;
  detectedPatterns: string[];
}

export interface ReverseSymptomResult {
  name: string;
  coincidenceRate: string;
  explanation: string;
  relatedSymptomsToTrack: string[];
  gpConversationGuide: string;
}

export const SYMPTOM_LABELS: Record<keyof SymptomLog, string> = {
  hotFlashes: "Hot Flashes",
  nightSweats: "Night Sweats",
  sleepLatency: "Sleep Difficulty",
  jointPain: "Joint Pain",
  brainFog: "Brain Fog",
  irritability: "Irritability",
  anxiety: "Anxiety",
  fatigue: "Fatigue",
  heartPalpitations: "Heart Palpitations",
  breastTenderness: "Breast Tenderness",
  bloating: "Bloating",
  postCarbCrash: "Post-Carb Crash",
};

export const SEVERITY_LABELS: Record<SeverityScore, string> = {
  0: "None",
  1: "Mild",
  2: "Moderate",
  3: "Severe",
};

export const SEVERITY_COLORS: Record<SeverityScore, string> = {
  0: "#6B7280",
  1: "#F59E0B",
  2: "#F97316",
  3: "#EF4444",
};

export const DEFAULT_SYMPTOMS: SymptomLog = {
  hotFlashes: 0,
  nightSweats: 0,
  sleepLatency: 0,
  jointPain: 0,
  brainFog: 0,
  irritability: 0,
  anxiety: 0,
  fatigue: 0,
  heartPalpitations: 0,
  breastTenderness: 0,
  bloating: 0,
  postCarbCrash: 0,
};

export const DEFAULT_SIGNALS: BiologicalSignals = {
  sleepDuration: 7,
  sleepEfficiency: 85,
  hrv: 55,
  restingHeartRate: 68,
};

export const DEFAULT_CYCLE: CycleLog = {
  cycleActive: false,
  spotting: false,
};
