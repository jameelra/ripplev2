// ─── Ripple v2 — Pre-set HRT Medication Database ─────────────────────────────
// 30 common HRT medications, supplements, and non-hormonal options.
// Used for fast medication setup in the HRT Tracker.

import { HRTMedication, HRTDeliveryMethod, HRTScheduleType } from "../../../shared/types";

export interface MedicationTemplate {
  name: string;
  activeIngredient: string;
  deliveryMethod: HRTDeliveryMethod;
  defaultDose: string;
  defaultScheduleType: HRTScheduleType;
  defaultIntervalDays?: number;
  defaultDaysOfWeek?: number[];
  defaultCycleDayStart?: number;
  defaultCycleDayEnd?: number;
  defaultTimesOfDay?: string[];
  region: ("UK" | "US" | "AU" | "CA" | "Global")[];
  category: "oestrogen" | "progesterone" | "combined" | "testosterone" | "non_hormonal" | "supplement";
  notes?: string;
}

export const HRT_MEDICATION_TEMPLATES: MedicationTemplate[] = [
  // ── Oestrogen — Gels ────────────────────────────────────────────────────────
  {
    name: "Oestrogel",
    activeIngredient: "Oestradiol",
    deliveryMethod: "gel",
    defaultDose: "1–3 pumps (0.75–2.25mg)",
    defaultScheduleType: "daily",
    defaultTimesOfDay: ["08:00"],
    region: ["UK", "AU"],
    category: "oestrogen",
    notes: "Apply to inner arm or thigh. Allow to dry for 2 minutes.",
  },
  {
    name: "Sandrena",
    activeIngredient: "Oestradiol",
    deliveryMethod: "gel",
    defaultDose: "0.5–1.5mg sachet",
    defaultScheduleType: "daily",
    defaultTimesOfDay: ["08:00"],
    region: ["UK", "AU", "CA"],
    category: "oestrogen",
  },
  {
    name: "EstroGel",
    activeIngredient: "Oestradiol",
    deliveryMethod: "gel",
    defaultDose: "1.25g (0.75mg oestradiol)",
    defaultScheduleType: "daily",
    defaultTimesOfDay: ["08:00"],
    region: ["US", "CA"],
    category: "oestrogen",
  },
  {
    name: "Divigel",
    activeIngredient: "Oestradiol",
    deliveryMethod: "gel",
    defaultDose: "0.25–1.0g sachet",
    defaultScheduleType: "daily",
    defaultTimesOfDay: ["08:00"],
    region: ["US"],
    category: "oestrogen",
  },
  // ── Oestrogen — Sprays ──────────────────────────────────────────────────────
  {
    name: "Lenzetto",
    activeIngredient: "Oestradiol",
    deliveryMethod: "spray",
    defaultDose: "1–3 sprays (0.52mg per spray)",
    defaultScheduleType: "daily",
    defaultTimesOfDay: ["08:00"],
    region: ["UK", "AU"],
    category: "oestrogen",
    notes: "Apply to inner forearm. Do not apply to breast or genitals.",
  },
  {
    name: "Evamist",
    activeIngredient: "Oestradiol",
    deliveryMethod: "spray",
    defaultDose: "1–3 sprays",
    defaultScheduleType: "daily",
    region: ["US"],
    category: "oestrogen",
  },
  // ── Oestrogen — Patches ─────────────────────────────────────────────────────
  {
    name: "Evorel 25 / 50 / 75 / 100",
    activeIngredient: "Oestradiol",
    deliveryMethod: "patch",
    defaultDose: "50mcg/24hr",
    defaultScheduleType: "days_of_week",
    defaultDaysOfWeek: [0, 3], // Sunday and Wednesday
    region: ["UK"],
    category: "oestrogen",
    notes: "Change twice weekly. Rotate application sites.",
  },
  {
    name: "Estradot 25 / 37.5 / 50 / 75 / 100",
    activeIngredient: "Oestradiol",
    deliveryMethod: "patch",
    defaultDose: "50mcg/24hr",
    defaultScheduleType: "days_of_week",
    defaultDaysOfWeek: [0, 3],
    region: ["UK", "AU", "CA"],
    category: "oestrogen",
  },
  {
    name: "FemSeven 50 / 75 / 100",
    activeIngredient: "Oestradiol",
    deliveryMethod: "patch",
    defaultDose: "50mcg/24hr",
    defaultScheduleType: "every_n_days",
    defaultIntervalDays: 7,
    region: ["UK"],
    category: "oestrogen",
    notes: "Change once weekly.",
  },
  {
    name: "Vivelle-Dot",
    activeIngredient: "Oestradiol",
    deliveryMethod: "patch",
    defaultDose: "0.05mg/day",
    defaultScheduleType: "days_of_week",
    defaultDaysOfWeek: [0, 3],
    region: ["US"],
    category: "oestrogen",
  },
  {
    name: "Climara",
    activeIngredient: "Oestradiol",
    deliveryMethod: "patch",
    defaultDose: "0.025–0.1mg/day",
    defaultScheduleType: "every_n_days",
    defaultIntervalDays: 7,
    region: ["US", "CA"],
    category: "oestrogen",
  },
  // ── Oestrogen — Tablets ─────────────────────────────────────────────────────
  {
    name: "Elleste Solo 1mg / 2mg",
    activeIngredient: "Oestradiol",
    deliveryMethod: "tablet",
    defaultDose: "1mg",
    defaultScheduleType: "daily",
    region: ["UK"],
    category: "oestrogen",
  },
  {
    name: "Estrace",
    activeIngredient: "Oestradiol",
    deliveryMethod: "tablet",
    defaultDose: "1–2mg",
    defaultScheduleType: "daily",
    region: ["US", "CA"],
    category: "oestrogen",
  },
  // ── Progesterone ────────────────────────────────────────────────────────────
  {
    name: "Utrogestan 100mg / 200mg",
    activeIngredient: "Micronised Progesterone",
    deliveryMethod: "capsule",
    defaultDose: "200mg",
    defaultScheduleType: "cycle_days",
    defaultCycleDayStart: 15,
    defaultCycleDayEnd: 28,
    defaultTimesOfDay: ["22:00"],
    region: ["UK", "AU"],
    category: "progesterone",
    notes: "Take at bedtime. Has a sedative effect — do not drive after taking.",
  },
  {
    name: "Prometrium 100mg / 200mg",
    activeIngredient: "Micronised Progesterone",
    deliveryMethod: "capsule",
    defaultDose: "200mg",
    defaultScheduleType: "cycle_days",
    defaultCycleDayStart: 15,
    defaultCycleDayEnd: 28,
    defaultTimesOfDay: ["22:00"],
    region: ["US", "CA"],
    category: "progesterone",
    notes: "Take at bedtime. Has a sedative effect.",
  },
  {
    name: "Mirena IUS",
    activeIngredient: "Levonorgestrel",
    deliveryMethod: "implant",
    defaultDose: "20mcg/day (reducing over time)",
    defaultScheduleType: "as_needed",
    region: ["UK", "US", "AU", "CA"],
    category: "progesterone",
    notes: "Intrauterine system. Lasts up to 5 years. No daily action required.",
  },
  // ── Combined HRT ────────────────────────────────────────────────────────────
  {
    name: "Evorel Sequi",
    activeIngredient: "Oestradiol + Norethisterone",
    deliveryMethod: "patch",
    defaultDose: "Sequential (oestrogen phase then combined phase)",
    defaultScheduleType: "every_n_days",
    defaultIntervalDays: 3.5,
    region: ["UK"],
    category: "combined",
    notes: "Sequential combined HRT. First 8 patches are oestrogen-only, last 8 are combined.",
  },
  {
    name: "Femoston 1/10 or 2/10",
    activeIngredient: "Oestradiol + Dydrogesterone",
    deliveryMethod: "tablet",
    defaultDose: "Sequential",
    defaultScheduleType: "daily",
    region: ["UK", "AU"],
    category: "combined",
  },
  // ── Vaginal Oestrogen ───────────────────────────────────────────────────────
  {
    name: "Vagifem 10mcg",
    activeIngredient: "Oestradiol",
    deliveryMethod: "vaginal_pessary",
    defaultDose: "10mcg",
    defaultScheduleType: "days_of_week",
    defaultDaysOfWeek: [0, 3],
    region: ["UK", "US", "AU", "CA"],
    category: "oestrogen",
    notes: "Local vaginal oestrogen. Minimal systemic absorption. Safe for most women.",
  },
  {
    name: "Ovestin Cream",
    activeIngredient: "Oestriol",
    deliveryMethod: "vaginal_cream",
    defaultDose: "0.5mg (1 applicator)",
    defaultScheduleType: "daily",
    region: ["UK", "AU"],
    category: "oestrogen",
    notes: "Apply daily for 2–3 weeks, then reduce to twice weekly for maintenance.",
  },
  {
    name: "Premarin Vaginal Cream",
    activeIngredient: "Conjugated Oestrogens",
    deliveryMethod: "vaginal_cream",
    defaultDose: "0.5–2g",
    defaultScheduleType: "days_of_week",
    defaultDaysOfWeek: [0, 3],
    region: ["US", "CA"],
    category: "oestrogen",
  },
  // ── Testosterone ────────────────────────────────────────────────────────────
  {
    name: "AndroFeme 1% Cream",
    activeIngredient: "Testosterone",
    deliveryMethod: "gel",
    defaultDose: "0.5mL (5mg testosterone)",
    defaultScheduleType: "daily",
    defaultTimesOfDay: ["08:00"],
    region: ["UK", "AU"],
    category: "testosterone",
    notes: "Apply to inner thigh or abdomen. Rotate sites.",
  },
  {
    name: "Testogel 50mg",
    activeIngredient: "Testosterone",
    deliveryMethod: "gel",
    defaultDose: "Small amount (off-label for women)",
    defaultScheduleType: "daily",
    region: ["UK"],
    category: "testosterone",
    notes: "Off-label use for women. Typically a very small amount compared to male dosing.",
  },
  // ── Non-Hormonal Options ─────────────────────────────────────────────────────
  {
    name: "Fezolinetant (Veoza)",
    activeIngredient: "Fezolinetant (NK3 antagonist)",
    deliveryMethod: "tablet",
    defaultDose: "45mg",
    defaultScheduleType: "daily",
    region: ["US", "UK"],
    category: "non_hormonal",
    notes: "FDA-approved 2023 for moderate-to-severe vasomotor symptoms. Non-hormonal.",
  },
  {
    name: "Escitalopram (Lexapro)",
    activeIngredient: "Escitalopram (SSRI)",
    deliveryMethod: "tablet",
    defaultDose: "10–20mg",
    defaultScheduleType: "daily",
    region: ["US", "UK", "AU", "CA"],
    category: "non_hormonal",
    notes: "Low-dose SSRI for vasomotor symptoms. Also treats anxiety and depression.",
  },
  {
    name: "Venlafaxine (Effexor)",
    activeIngredient: "Venlafaxine (SNRI)",
    deliveryMethod: "capsule",
    defaultDose: "37.5–75mg",
    defaultScheduleType: "daily",
    region: ["US", "UK", "AU", "CA"],
    category: "non_hormonal",
    notes: "SNRI effective for hot flashes. Note: interacts with tamoxifen.",
  },
  // ── Supplements ─────────────────────────────────────────────────────────────
  {
    name: "Magnesium Glycinate",
    activeIngredient: "Magnesium",
    deliveryMethod: "supplement",
    defaultDose: "300–400mg",
    defaultScheduleType: "daily",
    defaultTimesOfDay: ["21:00"],
    region: ["Global"],
    category: "supplement",
    notes: "Take 1 hour before bed. Supports sleep and reduces anxiety.",
  },
  {
    name: "Vitamin D3 + K2",
    activeIngredient: "Vitamin D3 / Vitamin K2",
    deliveryMethod: "supplement",
    defaultDose: "2000–4000 IU D3 + 100mcg K2",
    defaultScheduleType: "daily",
    defaultTimesOfDay: ["08:00"],
    region: ["Global"],
    category: "supplement",
    notes: "Take with a fatty meal for best absorption.",
  },
  {
    name: "Omega-3 (EPA/DHA)",
    activeIngredient: "EPA + DHA",
    deliveryMethod: "supplement",
    defaultDose: "2–3g EPA+DHA daily",
    defaultScheduleType: "daily",
    region: ["Global"],
    category: "supplement",
    notes: "Anti-inflammatory. Take with food to reduce fishy aftertaste.",
  },
  {
    name: "Black Cohosh",
    activeIngredient: "Cimicifuga racemosa",
    deliveryMethod: "supplement",
    defaultDose: "As directed on product",
    defaultScheduleType: "daily",
    region: ["Global"],
    category: "supplement",
    notes: "Some evidence for mild hot flash reduction. Quality varies between products.",
  },
];

// ── Helper: create an HRTMedication from a template ──────────────────────────
export function createMedicationFromTemplate(
  template: MedicationTemplate,
  startDate: string,
  overrides?: Partial<HRTMedication>
): HRTMedication {
  const now = new Date().toISOString();
  return {
    id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: template.name,
    activeIngredient: template.activeIngredient,
    deliveryMethod: template.deliveryMethod,
    dose: template.defaultDose,
    scheduleType: template.defaultScheduleType,
    intervalDays: template.defaultIntervalDays,
    daysOfWeek: template.defaultDaysOfWeek,
    cycleDayStart: template.defaultCycleDayStart,
    cycleDayEnd: template.defaultCycleDayEnd,
    timesOfDay: template.defaultTimesOfDay,
    startDate,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ── Helper: search templates ──────────────────────────────────────────────────
export function searchMedicationTemplates(query: string): MedicationTemplate[] {
  const q = query.toLowerCase();
  return HRT_MEDICATION_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.activeIngredient.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
  );
}

// ── Category labels ───────────────────────────────────────────────────────────
export const MEDICATION_CATEGORY_LABELS: Record<MedicationTemplate["category"], string> = {
  oestrogen:     "Oestrogen",
  progesterone:  "Progesterone",
  combined:      "Combined HRT",
  testosterone:  "Testosterone",
  non_hormonal:  "Non-Hormonal",
  supplement:    "Supplement",
};
