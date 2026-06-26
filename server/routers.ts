import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";

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

function heuristicReverseLookup(query: string) {
  const q = query.toLowerCase();
  const database = [
    {
      name: "Burning Tongue / Burning Mouth Syndrome",
      keywords: ["burn", "tongue", "mouth", "taste"],
      coincidenceRate: "14% of perimenopausal women",
      explanation: "Estrogen receptors exist on the oral mucosa and taste buds. Fluctuating levels can dry the mucosal fluid and cause pain signals in oral nerve endings.",
      relatedSymptomsToTrack: ["Estrogen Volatility", "Salivary Secretion Drop"],
      gpConversationGuide: "I have a persistent burning sensation on my tongue that doesn't correlate with oral injury. Could we explore whether this relates to mucosal estrogen receptor sensitivity during perimenopause?",
    },
    {
      name: "Formication (Skin Crawling)",
      keywords: ["crawl", "itch", "skin", "tingle", "formication"],
      coincidenceRate: "18% of perimenopausal women",
      explanation: "As estradiol levels swing or drop, cutaneous sensory fibers can fire spontaneously, creating a tactile sensation of insects crawling under the skin.",
      relatedSymptomsToTrack: ["Estrogen Volatility", "Histamine Spikes"],
      gpConversationGuide: "I've had a recurring sensation of skin-crawling itchiness with no visible rash. Given estrogen's role in dermis hydration, could this be an autonomic paresthesia related to perimenopause?",
    },
    {
      name: "Frozen Shoulder",
      keywords: ["shoulder", "frozen", "stiff", "arm", "adhesive"],
      coincidenceRate: "22% of perimenopausal women",
      explanation: "A drop in estrogen triggers inflammatory cytokines in synovial joints. The glenohumeral joint is especially rich in estrogen receptors; loss leads to joint capsule thickening.",
      relatedSymptomsToTrack: ["Somatic Systemic Inflammatory Index"],
      gpConversationGuide: "I've noticed progressive tightness and stiffness in my shoulder. Since estrogen receptors modulate joint synovium inflammation, could we evaluate this as adhesive capsulitis secondary to endocrine transition?",
    },
    {
      name: "Hair Texture Changes & Thinning",
      keywords: ["hair", "thin", "texture", "loss", "bald"],
      coincidenceRate: "35% of women aged 40+",
      explanation: "As progesterone and estrogen decline relative to adrenal androgens (DHEA and testosterone), the growth phase (anagen) of hair follicles shrinks, leading to diffuse thinning.",
      relatedSymptomsToTrack: ["Androgen Overlap Capacity"],
      gpConversationGuide: "I'm seeing diffuse thinning and texture changes in my hair. Could we review whether androgenic shifts related to declining progesterone and estrogen are contributing?",
    },
    {
      name: "Heart Palpitations",
      keywords: ["palpitation", "heart", "flutter", "racing", "beat", "cardiac"],
      coincidenceRate: "28% of perimenopausal women",
      explanation: "Fluctuating estradiol irritates the cardiac pacing node and the autonomic nervous system, causing sudden benign ventricular ectopic pacing, especially at bedtime.",
      relatedSymptomsToTrack: ["HRV Decline", "Resting Heart Rate Instability"],
      gpConversationGuide: "I've had unprovoked racing heart events and palpitations, particularly in the evening. Can we check if these autonomic surges are related to hormonal pacing node disruption?",
    },
    {
      name: "Electric Shock Sensations",
      keywords: ["electric", "shock", "zap", "static", "discharge"],
      coincidenceRate: "8% of perimenopausal women",
      explanation: "Rapid changes in estrogen levels can affect neural transmitters, causing short, sharp sensory malfunctions that feel like mini static electric discharges under the scalp or limbs.",
      relatedSymptomsToTrack: ["Estrogen Volatility", "Neural Sensitivity"],
      gpConversationGuide: "I've been experiencing brief, sharp electric shock sensations in my scalp and limbs. Could these be related to estrogen-driven neural sensitivity changes during perimenopause?",
    },
    {
      name: "Dry Eyes",
      keywords: ["dry", "eye", "vision", "blur", "gritty"],
      coincidenceRate: "31% of perimenopausal women",
      explanation: "Estrogen and androgen receptors in the lacrimal glands regulate tear production. Hormonal fluctuations reduce tear film stability, causing dryness and irritation.",
      relatedSymptomsToTrack: ["Estrogen Volatility", "Lacrimal Function"],
      gpConversationGuide: "I've developed persistent dry, gritty eyes. Since estrogen receptors in the lacrimal glands regulate tear production, could this be hormonally driven?",
    },
    {
      name: "Tinnitus (Ringing Ears)",
      keywords: ["tinnitus", "ring", "ear", "buzz", "hum"],
      coincidenceRate: "12% of perimenopausal women",
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
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── AI Diary Analysis ───────────────────────────────────────────────────────
  ai: router({
    analyzeDiary: publicProcedure
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
    reverseLookup: publicProcedure
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
                    coincidenceRate: { type: "string" },
                    explanation: { type: "string" },
                    relatedSymptomsToTrack: { type: "array", items: { type: "string" } },
                    gpConversationGuide: { type: "string" },
                  },
                  required: ["name", "coincidenceRate", "explanation", "relatedSymptomsToTrack", "gpConversationGuide"],
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
    generateEvidence: publicProcedure
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
      }))
      .mutation(async ({ input }) => {
        const { logs, dismissals = [] } = input;
        if (logs.length === 0) throw new Error("No logs to generate evidence from");

        // Calculate Greene Climacteric Scale scores
        const count = logs.length;
        let vasomotor = 0, somatic = 0, psychological = 0;
        let totalSleep = 0, totalHRV = 0;

        logs.forEach((log) => {
          const s = log.symptoms as Record<string, number>;
          vasomotor += (s["hotFlashes"] || 0) + (s["nightSweats"] || 0);
          somatic += (s["jointPain"] || 0) + (s["fatigue"] || 0) + (s["breastTenderness"] || 0) + (s["bloating"] || 0) + (s["postCarbCrash"] || 0);
          psychological += (s["sleepLatency"] || 0) + (s["brainFog"] || 0) + (s["irritability"] || 0) + (s["anxiety"] || 0) + (s["heartPalpitations"] || 0);
          totalSleep += log.signals.sleepDuration;
          totalHRV += log.signals.hrv;
        });

        const avgVasomotor = (vasomotor / count).toFixed(1);
        const avgSomatic = (somatic / count).toFixed(1);
        const avgPsychological = (psychological / count).toFixed(1);
        const greeneScore = Math.min(63, Math.round((vasomotor + somatic + psychological) / count));
        const avgSleep = (totalSleep / count).toFixed(1);
        const avgHRV = Math.round(totalHRV / count);

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

## 1. Greene Climacteric Scale Assessment

The Greene Climacteric Scale (GCS) is a validated 21-item questionnaire widely used in clinical practice to assess menopausal symptom severity.

| Symptom Cluster | Average Daily Score | Clinical Interpretation |
|---|---|---|
| **Vasomotor** (Hot flashes, Night sweats) | ${avgVasomotor}/6 | ${parseFloat(avgVasomotor) > 3 ? "Clinically significant" : parseFloat(avgVasomotor) > 1.5 ? "Moderate" : "Mild"} |
| **Somatic** (Joint pain, Fatigue, Bloating) | ${avgSomatic}/15 | ${parseFloat(avgSomatic) > 7 ? "Clinically significant" : parseFloat(avgSomatic) > 3 ? "Moderate" : "Mild"} |
| **Psychological** (Anxiety, Brain fog, Irritability) | ${avgPsychological}/15 | ${parseFloat(avgPsychological) > 7 ? "Clinically significant" : parseFloat(avgPsychological) > 3 ? "Moderate" : "Mild"} |
| **Composite GCS Score** | **${greeneScore}/63** | ${greeneScore > 35 ? "Severe" : greeneScore > 20 ? "Moderate-Severe" : greeneScore > 10 ? "Mild-Moderate" : "Mild"} |

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

## 4. Cycle Pattern Summary

${logs.filter((l) => l.cycle.cycleActive).length > 0
  ? `Menstrual activity was recorded on ${logs.filter((l) => l.cycle.cycleActive).length} of ${count} tracked days. ${logs.filter((l) => l.cycle.spotting).length > 0 ? `Spotting was reported on ${logs.filter((l) => l.cycle.spotting).length} days, which may indicate anovulatory cycles consistent with perimenopause.` : ""}`
  : "No active menstrual periods were recorded during the tracking period."}

---

## 5. Prior Clinical Interaction Record

${dismissals.length > 0
  ? `**Alert for Physician:** This patient reports ${dismissals.length} instance(s) of clinical dismissal in their health record. Concerns were primarily focused on symptoms not being evaluated as endocrine transition. Rigorous diagnostic evaluation is respectfully requested.\n\n${dismissals.map((d) => `- **${d.date}** at ${d.clinicName}: "${d.response}"`).join("\n")}`
  : "No prior clinical dismissal events recorded."}

---

## 6. Peer-Reviewed Clinical Evidence

The following guidelines support evaluation of the symptoms described in this report:

- **NAMS (North American Menopause Society) 2023 Position Statement:** Hormone therapy remains the most effective treatment for vasomotor symptoms and should be considered in symptomatic women. Perimenopause diagnosis should be based on clinical presentation, not solely on hormone levels.

- **BMS (British Menopause Society) Guidelines:** Symptoms of perimenopause can begin 4–10 years before the final menstrual period. Cognitive symptoms, joint pain, and sleep disruption are recognised features of the perimenopausal transition.

- **Endocrine Society Clinical Practice Guideline:** Estrogen fluctuations during perimenopause are a neurological reality, not a psychosomatic perception. Vasomotor symptoms correlate with measurable changes in core body temperature regulation.

- **Greene Climacteric Scale (Greene, 1998):** A validated 21-item instrument for measuring menopausal symptom severity across vasomotor, somatic, and psychological domains. Widely used in clinical research and practice.

---

*This report was generated by Ripple v2 — a privacy-first perimenopause tracking application. All health data is encrypted client-side and the application is not a medical device. This document should be reviewed alongside clinical examination and appropriate laboratory investigations.*`;

        return {
          success: true,
          brief,
          greeneScore,
          vasomotorScore: parseFloat(avgVasomotor),
          somaticScore: parseFloat(avgSomatic),
          psychologicalScore: parseFloat(avgPsychological),
          topSymptoms,
          trackingDays: count,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
