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
  triggers?: TriggerLog;       // NEW: trigger log for this day
  quickLogOnly?: boolean;      // NEW: true if logged via Quick Log mode (minimal entry)
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

// ─── HRT Tracker Types ────────────────────────────────────────────────────────

export type HRTDeliveryMethod =
  | "gel"            // Daily topical gel (oestradiol, testosterone)
  | "patch"          // Transdermal patch (twice-weekly or every-3-4 days)
  | "tablet"         // Oral tablet
  | "capsule"        // Oral capsule (e.g. micronised progesterone)
  | "spray"          // Nasal or skin spray
  | "vaginal_cream"  // Vaginal oestrogen cream
  | "vaginal_pessary" // Vaginal pessary or ring
  | "injection"      // Injectable
  | "implant"        // Subcutaneous implant
  | "supplement"     // Supplement (magnesium, vitamin D, etc.)
  | "other";

export type HRTScheduleType =
  | "daily"          // Every day
  | "every_n_days"   // Every N days (e.g. patch every 3.5 days)
  | "days_of_week"   // Specific days of the week (e.g. Mon & Thu)
  | "cycle_days"     // Days X–Y of the menstrual cycle (e.g. Days 15–28)
  | "as_needed";     // PRN / as needed

export type ApplicationSite =
  | "left_arm" | "right_arm"
  | "left_abdomen" | "right_abdomen"
  | "left_thigh" | "right_thigh"
  | "buttock_left" | "buttock_right"
  | "other";

export interface HRTMedication {
  id: string;
  name: string;                       // e.g. "Oestrogel", "Utrogestan 200mg"
  activeIngredient: string;           // e.g. "Oestradiol", "Progesterone"
  deliveryMethod: HRTDeliveryMethod;
  dose: string;                       // e.g. "1.5mg", "2 pumps", "200mg"
  scheduleType: HRTScheduleType;
  intervalDays?: number;              // for every_n_days: e.g. 3.5
  daysOfWeek?: number[];              // for days_of_week: 0=Sun...6=Sat
  cycleDayStart?: number;             // for cycle_days: e.g. 15
  cycleDayEnd?: number;               // for cycle_days: e.g. 28
  timesOfDay?: string[];              // e.g. ["08:00"] or ["08:00", "20:00"]
  rotationSites?: ApplicationSite[];  // for patches/gels
  startDate: string;                  // YYYY-MM-DD — critical for treatment response
  endDate?: string;                   // YYYY-MM-DD — if discontinued
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HRTDoseLog {
  id: string;
  medicationId: string;               // FK → HRTMedication.id
  scheduledDate: string;              // YYYY-MM-DD — the date it was due
  takenAt: string;                    // ISO timestamp — when actually taken/applied
  skipped: boolean;                   // true if user explicitly marked as skipped
  applicationSite?: ApplicationSite;  // for patches/gels
  doseAdjustment?: string;            // if user took a different dose than usual
  notes?: string;
}

// ─── Trigger Tracker Types ────────────────────────────────────────────────────

export type TriggerCategory =
  | "dietary"
  | "lifestyle"
  | "environmental"
  | "hormonal"
  | "social"
  | "custom";

export interface TriggerEntry {
  id: string;                         // e.g. "alcohol", "caffeine", or UUID for custom
  name: string;
  category: TriggerCategory;
  isCustom: boolean;
  intensity?: 0 | 1 | 2;             // 0=mild, 1=moderate, 2=high (optional)
}

export interface TriggerLog {
  date: string;                       // YYYY-MM-DD
  triggers: TriggerEntry[];
  previousDayTriggers?: TriggerEntry[]; // for next-day effect analysis
}

export interface TriggerCorrelation {
  triggerId: string;
  triggerName: string;
  symptomKey: keyof SymptomLog;
  symptomLabel: string;
  avgSeverityWithTrigger: number;
  avgSeverityWithoutTrigger: number;
  sameDayDifference: number;          // positive = trigger worsens symptom
  nextDayAvgWithTrigger: number;
  nextDayAvgWithoutTrigger: number;
  nextDayDifference: number;
  combinedEffect: number;             // weighted average of same + next day
  occurrenceCount: number;
  confidence: "strong" | "moderate" | "possible" | "insufficient_data";
  computedAt: string;
}

export interface TriggerAnalysis {
  correlations: TriggerCorrelation[];
  topTriggers: TriggerCorrelation[];  // top 3 by |combinedEffect|
  dataPointsAnalysed: number;
  minimumDataMet: boolean;            // true if ≥14 days of co-logged data
  lastComputedAt: string;
}

export interface TreatmentResponseSummary {
  medicationId: string;
  medicationName: string;
  startDate: string;
  beforePSS: number;
  afterPSS: number;
  pssChangePercent: number;           // negative = improvement
  beforeDays: number;
  afterDays: number;
  topImprovedSymptoms: Array<{ key: keyof SymptomLog; label: string; change: number }>;
  topWorsenedSymptoms: Array<{ key: keyof SymptomLog; label: string; change: number }>;
  insufficientData: boolean;
}

// ─── Pre-set Trigger Definitions ─────────────────────────────────────────────

export const PRESET_TRIGGERS: TriggerEntry[] = [
  // Dietary
  { id: "alcohol",       name: "Alcohol",           category: "dietary",     isCustom: false },
  { id: "caffeine",      name: "Caffeine",           category: "dietary",     isCustom: false },
  { id: "spicy_food",    name: "Spicy Food",         category: "dietary",     isCustom: false },
  { id: "sugar",         name: "Sugar / Refined Carbs", category: "dietary",  isCustom: false },
  { id: "dairy",         name: "Dairy",              category: "dietary",     isCustom: false },
  { id: "late_meal",     name: "Large Late Meal",    category: "dietary",     isCustom: false },
  // Lifestyle
  { id: "poor_sleep",    name: "Poor Sleep (<6hrs)", category: "lifestyle",   isCustom: false },
  { id: "high_stress",   name: "High Stress",        category: "lifestyle",   isCustom: false },
  { id: "vigorous_exercise", name: "Vigorous Exercise", category: "lifestyle", isCustom: false },
  { id: "dehydration",   name: "Dehydration",        category: "lifestyle",   isCustom: false },
  // Environmental
  { id: "hot_weather",   name: "Hot Weather",        category: "environmental", isCustom: false },
  { id: "air_con",       name: "Air Conditioning",   category: "environmental", isCustom: false },
  // Social
  { id: "work_stress",   name: "Work Stress",        category: "social",      isCustom: false },
  { id: "conflict",      name: "Argument / Conflict", category: "social",     isCustom: false },
  { id: "social_event",  name: "Social Event",       category: "social",      isCustom: false },
];

export const TRIGGER_CATEGORY_LABELS: Record<TriggerCategory, string> = {
  dietary:       "Dietary",
  lifestyle:     "Lifestyle",
  environmental: "Environmental",
  hormonal:      "Hormonal",
  social:        "Social",
  custom:        "Custom",
};

export const HRT_DELIVERY_LABELS: Record<HRTDeliveryMethod, string> = {
  gel:              "Gel (topical)",
  patch:            "Patch (transdermal)",
  tablet:           "Tablet (oral)",
  capsule:          "Capsule (oral)",
  spray:            "Spray",
  vaginal_cream:    "Vaginal Cream",
  vaginal_pessary:  "Vaginal Pessary / Ring",
  injection:        "Injection",
  implant:          "Implant",
  supplement:       "Supplement",
  other:            "Other",
};

// ─── Trigger Experiment ──────────────────────────────────────────────────────

export interface TriggerExperiment {
  id: string;
  triggerId: string;
  triggerName: string;
  hypothesis: string;            // e.g. "Eliminating alcohol will reduce hot flashes"
  targetSymptomKey: keyof SymptomLog;
  targetSymptomLabel: string;
  startDate: string;             // YYYY-MM-DD
  durationDays: number;          // typically 14
  endDate: string;               // YYYY-MM-DD (computed: startDate + durationDays)
  status: "active" | "completed" | "abandoned";
  // Baseline (before experiment)
  baselineAvgSeverity?: number;
  // Results (after experiment)
  experimentAvgSeverity?: number;
  changePercent?: number;        // negative = improvement
  conclusion?: string;           // auto-generated summary
  createdAt: string;
  completedAt?: string;
}

export const HRT_SCHEDULE_LABELS: Record<HRTScheduleType, string> = {
  daily:         "Daily",
  every_n_days:  "Every N days",
  days_of_week:  "Specific days of the week",
  cycle_days:    "Specific days of the cycle",
  as_needed:     "As needed",
};
