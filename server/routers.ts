import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { billingRouter } from "./billing/router";
import { invokeLLM } from "./_core/llm";
import { getVaultBlob, upsertVaultBlob } from "./db";
import { GREENE_SUBSCALE_MAX, describeRelativeLevel } from "../shared/greeneClimactericScale";
import { z } from "zod";

// Fixed vaultBlobs key for the Greene score history blob. Scoped to this one
// history list — not a general-purpose vault sync path. See server/db.ts for
// the (currently Greene-only) upsertVaultBlob/getVaultBlob helpers this wraps.
const GREENE_SCORES_BLOB_KEY = "greene_scores";

// ─── Heuristic Fallbacks ──────────────────────────────────────────────────────
function heuristicDiaryAnalysis(text: string) {
  const t = text.toLowerCase();
  const insights: string[] = [];
  let hormonePrediction = "Hormonal baseline stable";

  if (t.includes("flash") || t.includes("hot") || t.includes("sweat")) {
    insights.push("Vasomotor symptoms detected — possible estrogen fluctuation.");
    hormonePrediction = "Estrogen Volatility Alert";
  }
  if (t.includes("sleep") || t.includes("wake") || t.includes("insomnia") || t.includes("3am") || t.includes("3 am")) {
    insights.push("Sleep disruption noted — low progesterone may be reducing GABA-mediated sleep quality.");
    hormonePrediction = "Progesterone Decline Window";
  }
  if (t.includes("joint") || t.includes("stiff") || t.includes("ache")) {
    insights.push("Joint stiffness correlates with reduced estrogen's anti-inflammatory effect on synovial tissue.");
    hormonePrediction = "Estrogen Drop Baseline";
  }
  if (t.includes("fog") || t.includes("forget") || t.includes("concentrate") || t.includes("memory")) {
    insights.push("Cognitive symptoms noted — estrogen modulates acetylcholine and neural glucose metabolism.");
    hormonePrediction = "Cognitive Fluctuation Alert";
  }
  if (t.includes("anx") || t.includes("worry") || t.includes("panic")) {
    insights.push("Anxiety signals detected — fluctuating estrogen affects serotonin and GABA receptor sensitivity.");
  }
  if (t.includes("tired") || t.includes("fatigue") || t.includes("exhaust")) {
    insights.push("Fatigue pattern noted — adrenal and thyroid function may be affected by hormonal cascade.");
  }

  return {
    narrativeInsight: insights.length > 0
      ? insights.join(" ")
      : "Your diary entry has been logged. Continue tracking to identify patterns over time.",
    hormonePrediction,
    extractedKeywords: insights.length,
  };
}

// frequencyNote is intentionally qualitative, not a percentage: none of these
// eight symptom associations have a verifiable per-symptom prevalence figure,
// and their previous "X% of perimenopausal women" values were uncited and
// unverifiable. Do not reintroduce a specific percentage here without a named,
// retrievable source — see server/reverseLookup.test.ts.
export const UNVERIFIED_FREQUENCY_NOTE = "Reported by some women during perimenopause";

export function heuristicReverseLookup(query: string) {
  const q = query.toLowerCase();
  const database = [
    {
      name: "Burning Tongue / Burning Mouth Syndrome",
      keywords: ["burn", "tongue", "mouth", "taste"],
      frequencyNote: UNVERIFIED_FREQUENCY_NOTE,
      explanation: "Estrogen receptors exist on the oral mucosa and taste buds. Fluctuating levels can dry the mucosal fluid and cause pain signals in oral nerve endings.",
      relatedSymptomsToTrack: ["Estrogen Volatility", "Salivary Secretion Drop"],
      gpConversationGuide: "I have a persistent burning sensation on my tongue that doesn't correlate with oral injury. Could we explore whether this relates to mucosal estrogen receptor sensitivity during perimenopause?",
    },
    {
      name: "Formication (Skin Crawling)",
      keywords: ["crawl", "itch", "skin", "tingle", "formication"],
      frequencyNote: UNVERIFIED_FREQUENCY_NOTE,
      explanation: "As estradiol levels swing or drop, cutaneous sensory fibers can fire spontaneously, creating a tactile sensation of insects crawling under the skin.",
      relatedSymptomsToTrack: ["Estrogen Volatility", "Histamine Spikes"],
      gpConversationGuide: "I've had a recurring sensation of skin-crawling itchiness with no visible rash. Given estrogen's role in dermis hydration, could this be an autonomic paresthesia related to perimenopause?",
    },
    {
      name: "Frozen Shoulder",
      keywords: ["shoulder", "frozen", "stiff", "arm", "adhesive"],
      frequencyNote: UNVERIFIED_FREQUENCY_NOTE,
      explanation: "A drop in estrogen triggers inflammatory cytokines in synovial joints. The glenohumeral joint is especially rich in estrogen receptors; loss leads to joint capsule thickening.",
      relatedSymptomsToTrack: ["Somatic Systemic Inflammatory Index"],
      gpConversationGuide: "I've noticed progressive tightness and stiffness in my shoulder. Since estrogen receptors modulate joint synovium inflammation, could we evaluate this as adhesive capsulitis secondary to endocrine transition?",
    },
    {
      name: "Hair Texture Changes & Thinning",
      keywords: ["hair", "thin", "texture", "loss", "bald"],
      frequencyNote: UNVERIFIED_FREQUENCY_NOTE,
      explanation: "As progesterone and estrogen decline relative to adrenal androgens (DHEA and testosterone), the growth phase (anagen) of hair follicles shrinks, leading to diffuse thinning.",
      relatedSymptomsToTrack: ["Androgen Overlap Capacity"],
      gpConversationGuide: "I'm seeing diffuse thinning and texture changes in my hair. Could we review whether androgenic shifts related to declining progesterone and estrogen are contributing?",
    },
    {
      name: "Heart Palpitations",
      keywords: ["palpitation", "heart", "flutter", "racing", "beat", "cardiac"],
      frequencyNote: UNVERIFIED_FREQUENCY_NOTE,
      explanation: "Fluctuating estradiol irritates the cardiac pacing node and the autonomic nervous system, causing sudden benign ventricular ectopic pacing, especially at bedtime.",
      relatedSymptomsToTrack: ["HRV Decline", "Resting Heart Rate Instability"],
      gpConversationGuide: "I've had unprovoked racing heart events and palpitations, particularly in the evening. Can we check if these autonomic surges are related to hormonal pacing node disruption?",
    },
    {
      name: "Electric Shock Sensations",
      keywords: ["electric", "shock", "zap", "static", "discharge"],
      frequencyNote: UNVERIFIED_FREQUENCY_NOTE,
      explanation: "Rapid changes in estrogen levels can affect neural transmitters, causing short, sharp sensory malfunctions that feel like mini static electric discharges under the scalp or limbs.",
      relatedSymptomsToTrack: ["Estrogen Volatility", "Neural Sensitivity"],
      gpConversationGuide: "I've been experiencing brief, sharp electric shock sensations in my scalp and limbs. Could these be related to estrogen-driven neural sensitivity changes during perimenopause?",
    },
    {
      name: "Dry Eyes",
      keywords: ["dry", "eye", "vision", "blur", "gritty"],
      frequencyNote: UNVERIFIED_FREQUENCY_NOTE,
      explanation: "Estrogen and androgen receptors in the lacrimal glands regulate tear production. Hormonal fluctuations reduce tear film stability, causing dryness and irritation.",
      relatedSymptomsToTrack: ["Estrogen Volatility", "Lacrimal Function"],
      gpConversationGuide: "I've developed persistent dry, gritty eyes. Since estrogen receptors in the lacrimal glands regulate tear production, could this be hormonally driven?",
    },
    {
      name: "Tinnitus (Ringing Ears)",
      keywords: ["tinnitus", "ring", "ear", "buzz", "hum"],
      frequencyNote: UNVERIFIED_FREQUENCY_NOTE,
      explanation: "Estrogen has a protective effect on the cochlea and auditory nerve. Declining levels can increase sensitivity to tinnitus and alter auditory processing.",
      relatedSymptomsToTrack: ["Estrogen Volatility", "Auditory Sensitivity"],
      gpConversationGuide: "I've noticed a persistent ringing in my ears that started around the time my other perimenopausal symptoms began. Could estrogen's cochlear protective role be relevant here?",
    },
  ];

  const matches = database.filter((item) =>
    item.keywords.some((kw) => q.includes(kw)) ||
    item.name.toLowerCase().includes(q)
  );

  return matches.length > 0 ? matches : null;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  billing: billingRouter,
  auth: router({
    // Supabase manages the session itself (browser storage + its own sign-out
    // call); this just reports who the verified bearer token belongs to.
    me: publicProcedure.query((opts) => opts.ctx.user),
  }),

  // ── AI Diary Analysis ───────────────────────────────────────────────────────
  ai: router({
    analyzeDiary: protectedProcedure
      .input(z.object({
        text: z.string().min(1).max(2000),
        currentSymptoms: z.record(z.string(), z.number()).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a perimenopause health assistant. Your role is to analyze diary entries from women experiencing perimenopause and extract medically relevant insights. 
                
                IMPORTANT: You are NOT a doctor and do NOT provide medical diagnoses. You provide educational health tracking insights only.
                
                Analyze the diary entry and return a JSON object with:
                - narrativeInsight: A 2-3 sentence educational insight about the symptoms described, referencing relevant hormonal mechanisms (estrogen, progesterone, cortisol)
                - hormonePrediction: A short label (e.g., "Estrogen Volatility Alert", "Progesterone Decline Window", "Cortisol Surge Pattern")
                - extractedSymptoms: An array of symptom keywords detected
                - disclaimer: Always include "This is educational information only, not medical advice."`,
              },
              {
                role: "user",
                content: `Diary entry: "${input.text}"`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "diary_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    narrativeInsight: { type: "string" },
                    hormonePrediction: { type: "string" },
                    extractedSymptoms: { type: "array", items: { type: "string" } },
                    disclaimer: { type: "string" },
                  },
                  required: ["narrativeInsight", "hormonePrediction", "extractedSymptoms", "disclaimer"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (content && typeof content === "string") {
            const parsed = JSON.parse(content);
            return { success: true, data: parsed };
          }
          throw new Error("Empty LLM response");
        } catch {
          // Heuristic fallback
          const fallback = heuristicDiaryAnalysis(input.text);
          return {
            success: true,
            data: {
              ...fallback,
              extractedSymptoms: [],
              disclaimer: "This is educational information only, not medical advice. (Heuristic analysis — AI unavailable)",
            },
          };
        }
      }),

    // ── Reverse Symptom Lookup ────────────────────────────────────────────────
    reverseLookup: protectedProcedure
      .input(z.object({ query: z.string().min(1).max(200) }))
      .mutation(async ({ input }) => {
        // First try heuristic database
        const heuristicResults = heuristicReverseLookup(input.query);
        if (heuristicResults) {
          return { success: true, results: heuristicResults, source: "database" };
        }

        // Fallback to LLM for unlisted symptoms
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a perimenopause health educator. A user is searching for information about an unusual symptom and whether it might be related to perimenopause.

                Return a JSON object with a single result explaining the potential perimenopause connection. Always include the disclaimer that this is educational information only.

                For frequencyNote, do not invent a specific percentage or prevalence figure — you have no verified source for one. Write a brief, honest qualitative note instead (e.g. "Reported by some women during perimenopause").

                Base your response on established medical literature about estrogen, progesterone, and their effects on various body systems.`,
              },
              {
                role: "user",
                content: `Symptom query: "${input.query}". Is this potentially related to perimenopause? Explain the mechanism if so.`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "symptom_lookup",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    frequencyNote: { type: "string" },
                    explanation: { type: "string" },
                    relatedSymptomsToTrack: { type: "array", items: { type: "string" } },
                    gpConversationGuide: { type: "string" },
                  },
                  required: ["name", "frequencyNote", "explanation", "relatedSymptomsToTrack", "gpConversationGuide"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (content && typeof content === "string") {
            const parsed = JSON.parse(content);
            return { success: true, results: [parsed], source: "ai" };
          }
        } catch {
          // ignore
        }

        return {
          success: false,
          results: [],
          source: "none",
          message: "No perimenopause correlation found for this symptom in our database.",
        };
      }),

    // ── Evidence Engine (GP Brief Generator) ─────────────────────────────────
    generateEvidence: protectedProcedure
      .input(z.object({
        logs: z.array(z.object({
          id: z.string(),
          date: z.string(),
          symptoms: z.record(z.string(), z.number()),
          signals: z.object({
            sleepDuration: z.number(),
            sleepEfficiency: z.number(),
            hrv: z.number(),
            restingHeartRate: z.number(),
          }),
          cycle: z.object({
            cycleActive: z.boolean(),
            flowIntensity: z.string().optional(),
            spotting: z.boolean(),
          }),
          diaryText: z.string(),
        })),
        dismissals: z.array(z.object({
          id: z.string(),
          date: z.string(),
          clinicName: z.string(),
          clinicianName: z.string().optional().default(""),
          symptomsReported: z.array(z.string()),
          response: z.string(),
          wasResolved: z.boolean(),
        })).optional(),
        cycleEvents: z.array(z.object({
          id: z.string(),
          date: z.string(),
          type: z.enum(["period_start", "period_active", "period_end", "ovulation", "spotting", "predicted_period", "predicted_ovulation"]),
          flowIntensity: z.enum(["light", "medium", "heavy", "spotting"]).optional(),
          notes: z.string().optional(),
          createdAt: z.string(),
        })).optional(),
        hrtMedications: z.array(z.object({
          id: z.string(),
          name: z.string(),
          activeIngredient: z.string(),
          deliveryMethod: z.string(),
          dose: z.string(),
          scheduleType: z.string(),
          startDate: z.string(),
          endDate: z.string().optional(),
          isActive: z.boolean(),
          notes: z.string().optional(),
        })).optional(),
        triggerAnalysis: z.object({
          topTriggers: z.array(z.object({
            triggerName: z.string(),
            symptomLabel: z.string(),
            sameDayDifference: z.number(),
            nextDayDifference: z.number(),
            combinedEffect: z.number(),
            confidence: z.enum(["strong", "moderate", "possible", "insufficient_data"]),
            occurrenceCount: z.number(),
          })),
          minimumDataMet: z.boolean(),
          dataPointsAnalysed: z.number(),
        }).optional(),
        // Real, validated 21-item Greene Climacteric Scale history (see
        // client/src/pages/GreeneAssessment.tsx) — distinct from the daily
        // symptom log above, which uses an unrelated set of fields.
        greeneScores: z.array(z.object({
          takenAt: z.string(),
          total: z.number(),
          psychological: z.number(),
          somatic: z.number(),
          vasomotor: z.number(),
          sexual: z.number(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { logs, dismissals = [], cycleEvents = [], hrtMedications = [], triggerAnalysis, greeneScores = [] } = input;
        if (logs.length === 0) throw new Error("No logs to generate evidence from");

        const count = logs.length;
        let totalSleep = 0, totalHRV = 0;
        logs.forEach((log) => {
          totalSleep += log.signals.sleepDuration;
          totalHRV += log.signals.hrv;
        });
        const avgSleep = (totalSleep / count).toFixed(1);
        const avgHRV = Math.round(totalHRV / count);

        // Most recent first, for both the summary line and the compact history table.
        const greeneSorted = [...greeneScores].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
        const latestGreene = greeneSorted[0] ?? null;
        const greeneHistory = greeneSorted.slice(0, 6);

        // Top 3 symptoms
        const symptomTotals: Record<string, number> = {};
        logs.forEach((log) => {
          Object.entries(log.symptoms).forEach(([k, v]) => {
            symptomTotals[k] = (symptomTotals[k] || 0) + (v as number);
          });
        });
        const topSymptoms = Object.entries(symptomTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k]) => k.replace(/([A-Z])/g, " $1").toLowerCase().trim());

        const brief = `# CLINICAL APPOINTMENT BRIEF
## Ripple Perimenopause Tracking Record

**Generated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
**Tracking Period:** ${logs[0].date} to ${logs[logs.length - 1].date} (${count} days)
**Status:** Evidence-Ready Clinical Summary

---

> ⚠️ **Medical Disclaimer:** This document is generated by Ripple, a general wellness tracking application. It is for informational purposes only and does not constitute a medical diagnosis. All information should be reviewed and interpreted by a qualified healthcare provider.

---

## 1. Greene Climacteric Scale

${latestGreene ? `The Greene Climacteric Scale (GCS) is a validated 21-item questionnaire used to track the severity of menopausal symptoms over time. It does not define a diagnostic cutoff — it describes symptom severity relative to the scale's possible range.

**Most recent assessment:** ${latestGreene.total}/${GREENE_SUBSCALE_MAX.total}, taken ${new Date(latestGreene.takenAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} (${describeRelativeLevel(latestGreene.total, GREENE_SUBSCALE_MAX.total)} third of the scale's possible range).

| Subscale | Score |
|---|---|
| **Psychological** (anxiety, low mood) | ${latestGreene.psychological}/${GREENE_SUBSCALE_MAX.psychological} |
| **Somatic** (physical symptoms) | ${latestGreene.somatic}/${GREENE_SUBSCALE_MAX.somatic} |
| **Vasomotor** (hot flushes, night sweats) | ${latestGreene.vasomotor}/${GREENE_SUBSCALE_MAX.vasomotor} |
| **Sexual Function** (reported separately, not summed into total) | ${latestGreene.sexual}/${GREENE_SUBSCALE_MAX.sexual} |

**History** (${greeneHistory.length === greeneSorted.length ? "all assessments" : `most recent ${greeneHistory.length}`}, most recent first)

| Date | Total | Psych. | Somatic | Vasomotor | Sexual |
|---|---|---|---|---|---|
${greeneHistory.map((g) => `| ${new Date(g.takenAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} | ${g.total}/${GREENE_SUBSCALE_MAX.total} | ${g.psychological}/${GREENE_SUBSCALE_MAX.psychological} | ${g.somatic}/${GREENE_SUBSCALE_MAX.somatic} | ${g.vasomotor}/${GREENE_SUBSCALE_MAX.vasomotor} | ${g.sexual}/${GREENE_SUBSCALE_MAX.sexual} |`).join("\n")}

*Greene JG. Constructing a Standard Climacteric Scale. Maturitas. 1998;29(1):25–31.*`
: `No Greene Climacteric Scale assessments have been recorded yet. Complete the validated 21-item assessment in the Greene Assessment tab to include this section in future reports.`}

---

## 2. Top 3 Clinician Cues

The following symptoms showed the highest sustained severity over the tracking period:

1. **${topSymptoms[0] || "Hot flashes"}** — Persistent across ${count} tracked days
2. **${topSymptoms[1] || "Sleep disruption"}** — Correlating with reduced sleep efficiency
3. **${topSymptoms[2] || "Fatigue"}** — Linked to HRV variability patterns

---

## 3. Objective Biometric Data

| Metric | Patient Average | Clinical Reference Range |
|---|---|---|
| Sleep Duration | **${avgSleep} hours/night** | 7–9 hours recommended |
| Heart Rate Variability (HRV) | **${avgHRV} ms SDNN** | >50ms considered healthy |
| Tracking Consistency | **${count} consecutive days** | — |

---

## 4. Current Treatment Regimen

${hrtMedications.length > 0 ? `
This patient is currently managing the following hormone therapy regimen. This information is provided to support clinical review and dosage assessment.

| Medication | Active Ingredient | Delivery | Dose | Schedule | Started |
|---|---|---|---|---|---|
${hrtMedications.filter((m) => m.isActive).map((m) => `| **${m.name}** | ${m.activeIngredient} | ${m.deliveryMethod} | ${m.dose} | ${m.scheduleType} | ${m.startDate} |`).join("\n")}
${hrtMedications.filter((m) => !m.isActive && m.endDate).length > 0 ? `\n**Previously Discontinued:**\n${hrtMedications.filter((m) => !m.isActive).map((m) => `- ${m.name} (${m.activeIngredient}, ${m.dose}) — discontinued ${m.endDate ?? "date unknown"}`).join("\n")}` : ""}
` : "No hormone therapy or medications have been logged in the Ripple HRT Tracker. The patient may wish to add their current medications to provide a complete clinical picture."}

---

## 5. Identified Symptom Triggers

${triggerAnalysis?.minimumDataMet && triggerAnalysis.topTriggers.length > 0 ? `
Pattern analysis across ${triggerAnalysis.dataPointsAnalysed} logged days has identified the following symptom triggers with statistical significance:

| Trigger | Most Affected Symptom | Same-Day Effect | Next-Day Effect | Confidence | Observations |
|---|---|---|---|---|---|
${triggerAnalysis.topTriggers.map((t) => `| **${t.triggerName}** | ${t.symptomLabel} | ${t.sameDayDifference > 0 ? "+" : ""}${t.sameDayDifference.toFixed(1)} pts | ${t.nextDayDifference > 0 ? "+" : ""}${t.nextDayDifference.toFixed(1)} pts | ${t.confidence.charAt(0).toUpperCase() + t.confidence.slice(1)} | ${t.occurrenceCount} days |`).join("\n")}

**Clinical Note:** A positive effect value indicates the trigger worsens the symptom on the same day or the following day (24-hour lag). These correlations are observational and derived from the patient's own tracking data. They should be interpreted alongside clinical assessment and are not diagnostic. However, they may inform lifestyle modification recommendations.
` : "Insufficient trigger data for correlation analysis. The patient requires at least 14 days of co-logged trigger and symptom data to generate reliable patterns. Trigger tracking is available in the Ripple Trigger Tracker."}

---

## 6. Menstrual Cycle Analysis

${(() => {
  const periodStarts = cycleEvents.filter((e) => e.type === "period_start").sort((a, b) => a.date.localeCompare(b.date));
  const ovulationEvents = cycleEvents.filter((e) => e.type === "ovulation");
  const spottingEvents = cycleEvents.filter((e) => e.type === "spotting");
  const activeEvents = cycleEvents.filter((e) => e.type === "period_active" || e.type === "period_start");
  const bleedingDays = activeEvents.length;

  if (periodStarts.length === 0 && cycleEvents.length === 0) {
    return "No cycle data has been logged in the Ripple Cycle Calendar for this tracking period. The patient may wish to begin logging cycle events to provide additional clinical context.";
  }

  // Compute cycle lengths
  const cycleLengths: number[] = [];
  for (let i = 0; i < periodStarts.length - 1; i++) {
    const a = new Date(periodStarts[i].date).getTime();
    const b = new Date(periodStarts[i + 1].date).getTime();
    const len = Math.round((b - a) / (1000 * 60 * 60 * 24));
    if (len >= 14 && len <= 90) cycleLengths.push(len);
  }

  const avgCycleLen = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : null;

  const maxLen = cycleLengths.length > 0 ? Math.max(...cycleLengths) : 0;
  const minLen = cycleLengths.length > 0 ? Math.min(...cycleLengths) : 0;
  const variabilityRange = maxLen - minLen;
  const variabilityLabel = variabilityRange <= 3 ? "Regular (±3 days)" :
    variabilityRange <= 7 ? "Slightly Irregular (±7 days)" :
    variabilityRange <= 14 ? "Irregular (±14 days) — consistent with perimenopause" :
    `Highly Irregular (±${variabilityRange} days) — strongly suggestive of perimenopausal transition`;

  const lines: string[] = [];

  lines.push(`| Metric | Value | Clinical Note |`);
  lines.push(`|---|---|---|`);
  lines.push(`| Period Start Events Logged | **${periodStarts.length}** | ${periodStarts.length >= 2 ? "Sufficient for cycle analysis" : "Insufficient for prediction — log more cycles"} |`);
  if (avgCycleLen) lines.push(`| Average Cycle Length | **${avgCycleLen} days** | Normal range: 21–35 days |`);
  if (cycleLengths.length >= 2) lines.push(`| Cycle Variability | **${variabilityLabel}** | ${variabilityRange > 7 ? "⚠ Clinically significant irregularity" : "Within acceptable range"} |`);
  lines.push(`| Ovulation Events Logged | **${ovulationEvents.length}** | ${ovulationEvents.length === 0 ? "No confirmed ovulation logged" : "Ovulation confirmed on tracked days"} |`);
  if (bleedingDays > 0) lines.push(`| Bleeding Days Logged | **${bleedingDays} day${bleedingDays !== 1 ? "s" : ""}** | ${bleedingDays > 7 ? "⚠ Prolonged bleeding — may warrant investigation" : bleedingDays < 2 ? "Short bleeding duration logged" : "Within typical range (2–7 days)"} |`);
  lines.push(`| Spotting Events | **${spottingEvents.length}** | ${spottingEvents.length > 0 ? "⚠ Intermenstrual spotting noted — may indicate anovulatory cycles" : "No spotting reported"} |`);

  let narrative = "\n\n";
  if (variabilityRange > 7 && cycleLengths.length >= 2) {
    narrative += `**Clinical Note:** This patient's cycle data shows ${variabilityLabel.toLowerCase()}. According to NAMS guidelines, cycle irregularity is one of the earliest and most reliable clinical markers of the perimenopausal transition. The Stages of Reproductive Aging Workshop (STRAW+10) criteria define the early menopausal transition as cycles varying by ≥7 days from the previous cycle. This patient's data meets or exceeds this threshold.\n\n`;
  }
  if (spottingEvents.length > 0) {
    narrative += `**Intermenstrual Spotting:** ${spottingEvents.length} spotting event(s) were recorded. Intermenstrual bleeding in perimenopausal women may indicate anovulatory cycles, endometrial changes, or polyps. Clinical investigation is recommended if spotting is persistent.\n\n`;
  }
  if (periodStarts.length >= 2 && avgCycleLen && (avgCycleLen < 21 || avgCycleLen > 35)) {
    narrative += `**Cycle Length Deviation:** The average cycle length of ${avgCycleLen} days falls outside the normal range of 21–35 days, which is consistent with hormonal dysregulation during perimenopause.\n\n`;
  }

  return lines.join("\n") + narrative;
})()}

---

## 7. Prior Clinical Interaction Record

${dismissals.length > 0
  ? `**Alert for Physician:** This patient reports ${dismissals.length} instance(s) of clinical dismissal in their health record. Concerns were primarily focused on symptoms not being evaluated as endocrine transition. Rigorous diagnostic evaluation is respectfully requested.\n\n${dismissals.map((d) => `- **${d.date}** at ${d.clinicName}: "${d.response}"`).join("\n")}`
  : "No prior clinical dismissal events recorded."}

---

## 8. Peer-Reviewed Clinical Evidence

The following guidelines support evaluation of the symptoms described in this report:

- **NAMS (North American Menopause Society) 2023 Position Statement:** Hormone therapy remains the most effective treatment for vasomotor symptoms and should be considered in symptomatic women. Perimenopause diagnosis should be based on clinical presentation, not solely on hormone levels.

- **BMS (British Menopause Society) Guidelines:** Symptoms of perimenopause can begin 4–10 years before the final menstrual period. Cognitive symptoms, joint pain, and sleep disruption are recognised features of the perimenopausal transition.

- **Endocrine Society Clinical Practice Guideline:** Estrogen fluctuations during perimenopause are a neurological reality, not a psychosomatic perception. Vasomotor symptoms correlate with measurable changes in core body temperature regulation.

- **Greene JG. Constructing a Standard Climacteric Scale. Maturitas. 1998;29(1):25–31.** A validated 21-item instrument for measuring menopausal symptom severity across psychological, somatic, vasomotor, and sexual domains. Widely used in clinical research and practice.

---

*This report was generated by Ripple v2 — a privacy-first perimenopause tracking application. All health data is encrypted client-side and the application is not a medical device. This document should be reviewed alongside clinical examination and appropriate laboratory investigations.*`;

        return {
          success: true,
          brief,
          greene: latestGreene
            ? {
                total: latestGreene.total,
                psychological: latestGreene.psychological,
                somatic: latestGreene.somatic,
                vasomotor: latestGreene.vasomotor,
                sexual: latestGreene.sexual,
                takenAt: latestGreene.takenAt,
              }
            : null,
          topSymptoms,
          trackingDays: count,
        };
      }),
  }),

  // ── Greene Climacteric Scale history (encrypted vault blob sync) ───────────
  // The client encrypts the full history array client-side (AES-GCM, same as
  // every other vault blob) before it ever reaches this router — the server
  // only ever stores and returns opaque ciphertext.
  greene: router({
    saveScores: protectedProcedure
      .input(z.object({ iv: z.string(), data: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await upsertVaultBlob(ctx.user.id, GREENE_SCORES_BLOB_KEY, JSON.stringify(input));
        return { success: true };
      }),

    loadScores: protectedProcedure.query(async ({ ctx }) => {
      const stored = await getVaultBlob(ctx.user.id, GREENE_SCORES_BLOB_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as { iv: string; data: string };
    }),
  }),
});

export type AppRouter = typeof appRouter;
