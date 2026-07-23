import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, Printer, Copy, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, MessageSquare, BarChart2, Calendar,
  ShieldAlert, BookOpen, ExternalLink, Info, TrendingDown, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVaultStore } from "../stores/vaultStore";
import { SYMPTOM_LABELS, SymptomLog } from "../../../shared/types";
import { computeReproductiveIntelligence } from "../lib/cycleIntelligence";
import { computePSSFromLogs } from "../lib/hrtEngine";
import { CLINICAL_KNOWLEDGE_BASE } from "../lib/clinicalKnowledgeBase";

// ─── GP conversation scripts for common dismissals ────────────────────────────
// Exported so its exact wording can be pinned by a content-drift test — see
// server/dismissalResponses.test.ts, especially the "antidepressants" entry,
// which previously made an uncited "overprescribed" claim.
export const DISMISSAL_RESPONSES: Record<string, string> = {
  default: "I understand you may need more information. I have been tracking my symptoms daily using a validated tool (Greene Climacteric Scale) for the past {days} days. My composite score is {score}/63, which is clinically significant. I would like to discuss evidence-based treatment options as outlined in the NAMS 2023 Position Statement.",
  "too young": "NAMS guidelines state that perimenopause can begin in the early 40s and sometimes earlier. The average duration is 4–10 years before the final menstrual period. My symptoms align with the clinical presentation described in NAMS guidelines, and my tracking data demonstrates a consistent pattern over {days} days.",
  "normal levels": "NAMS guidelines explicitly state that perimenopause is a clinical diagnosis based on symptoms and age, not hormone levels alone. Hormone levels fluctuate significantly during perimenopause and a single test cannot capture the full picture. My symptom burden is documented and clinically significant.",
  "stress": "While stress can worsen symptoms, the pattern I am experiencing — particularly {topSymptom} — is consistent with the hormonal changes of perimenopause as described in the BMS guidelines. I would like to explore hormonal assessment and evidence-based treatment options.",
  "antidepressants": "I appreciate the suggestion, but I'd like to first understand whether hormone therapy might help. NICE's guideline on menopause (NG23) notes there's no clear evidence that antidepressants ease low mood caused by menopause itself when depression hasn't been diagnosed, and recommends considering hormone therapy for depressive symptoms that don't meet the criteria for a diagnosis (recommendation 1.5.21). Could we discuss that first?",
};

// ─── Section component ────────────────────────────────────────────────────────
function PrepSection({
  title,
  icon: Icon,
  color = "text-[#4a8a72]",
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  color?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ripple-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#faf8f5] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <p className="font-serif text-sm font-bold text-[#1a2b22]">{title}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#9a9490]" /> : <ChevronDown className="w-4 h-4 text-[#9a9490]" />}
      </button>
      {open && <div className="border-t border-[#f0ebe4] p-4">{children}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AppointmentPrep() {
  const { logs, dismissals, cycleEvents, hrtMedications, triggerAnalysis, setActiveTab } = useVaultStore();
  const [copied, setCopied] = useState(false);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // Compute key metrics
  const pssScore = useMemo(() => computePSSFromLogs(logs), [logs]);
  const trackingDays = logs.length;

  // Greene score (simplified from logs)
  const greeneData = useMemo(() => {
    if (logs.length === 0) return null;
    let vasomotor = 0, somatic = 0, psychological = 0;
    logs.forEach((log) => {
      const s = log.symptoms as unknown as Record<string, number>;
      vasomotor += (s.hotFlashes || 0) + (s.nightSweats || 0);
      somatic += (s.jointPain || 0) + (s.fatigue || 0) + (s.breastTenderness || 0) + (s.bloating || 0) + (s.postCarbCrash || 0);
      psychological += (s.sleepLatency || 0) + (s.brainFog || 0) + (s.irritability || 0) + (s.anxiety || 0) + (s.heartPalpitations || 0);
    });
    const count = logs.length;
    const composite = Math.min(63, Math.round((vasomotor + somatic + psychological) / count));
    return {
      composite,
      vasomotor: Math.round((vasomotor / count) * 10) / 10,
      somatic: Math.round((somatic / count) * 10) / 10,
      psychological: Math.round((psychological / count) * 10) / 10,
      label: composite > 35 ? "Severe" : composite > 20 ? "Moderate–Severe" : composite > 10 ? "Mild–Moderate" : "Mild",
    };
  }, [logs]);

  // Top 3 symptoms
  const topSymptoms = useMemo(() => {
    if (logs.length === 0) return [];
    const totals: Record<string, number> = {};
    logs.forEach((log) => {
      Object.entries(log.symptoms as unknown as Record<string, number>).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + (v as number);
      });
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, total]) => ({
        key: key as keyof SymptomLog,
        label: SYMPTOM_LABELS[key as keyof SymptomLog],
        avgSeverity: Math.round((total / logs.length) * 10) / 10,
        cknEntry: CLINICAL_KNOWLEDGE_BASE.find((e) => e.id === key.replace(/([A-Z])/g, "_$1").toLowerCase()),
      }));
  }, [logs]);

  // Cycle intelligence
  const cycleIntel = useMemo(() => computeReproductiveIntelligence(cycleEvents), [cycleEvents]);

  // Active HRT medications
  const activeMeds = hrtMedications.filter((m) => m.isActive);

  // Unresolved dismissals
  const unresolvedDismissals = dismissals.filter((d) => !d.wasResolved);

  // Generate printable summary
  const generateSummary = () => {
    const lines: string[] = [
      `RIPPLE APPOINTMENT PREPARATION SUMMARY`,
      `Generated: ${today}`,
      `Tracking Period: ${trackingDays} days`,
      ``,
      `─── MY SYMPTOMS ───────────────────────────────────────────`,
      `Greene Climacteric Scale Score: ${greeneData?.composite ?? "N/A"}/63 (${greeneData?.label ?? "N/A"})`,
      ``,
      `Top 3 Symptoms:`,
      ...topSymptoms.map((s, i) => `  ${i + 1}. ${s.label} — average severity ${s.avgSeverity}/3`),
      ``,
      `─── MY CURRENT TREATMENT ──────────────────────────────────`,
      activeMeds.length > 0
        ? activeMeds.map((m) => `  • ${m.name} (${m.dose}) — started ${m.startDate}`).join("\n")
        : "  No medications logged",
      ``,
      `─── CYCLE PATTERN ─────────────────────────────────────────`,
      cycleIntel.status === "ready"
        ? `  Average cycle length: ${cycleIntel.averageCycleLength} days\n  Variability: ${cycleIntel.cycleVariability}`
        : "  Insufficient cycle data",
      ``,
      `─── IDENTIFIED TRIGGERS ───────────────────────────────────`,
      triggerAnalysis?.minimumDataMet && triggerAnalysis.topTriggers.length > 0
        ? triggerAnalysis.topTriggers.map((t) => `  • ${t.triggerName} → ${t.symptomLabel} (${t.confidence} correlation)`).join("\n")
        : "  No trigger data available",
      ``,
      `─── PRIOR DISMISSALS ──────────────────────────────────────`,
      unresolvedDismissals.length > 0
        ? unresolvedDismissals.map((d) => `  • ${d.date} at ${d.clinicName}: "${d.response}"`).join("\n")
        : "  None recorded",
      ``,
      `─── GP CONVERSATION SCRIPTS ───────────────────────────────`,
      ...topSymptoms.filter((s) => s.cknEntry).map((s) => `  For ${s.label}:\n  "${s.cknEntry!.gpConversationScript}"`),
      ``,
      `─── WHAT I WANT TO DISCUSS ────────────────────────────────`,
      `  1. Review my symptom data and Greene Climacteric Scale score`,
      `  2. Discuss evidence-based treatment options (NAMS 2023 guidelines)`,
      `  3. Assess whether hormone therapy is appropriate for my situation`,
      `  4. Review my current medications and their effectiveness`,
      ``,
      `─── CLINICAL REFERENCES ───────────────────────────────────`,
      `  • NAMS 2023 Hormone Therapy Position Statement`,
      `  • BMS Menopause Guidelines`,
      `  • Greene Climacteric Scale (Greene, 1998)`,
      ``,
      `This summary was generated by Ripple — a privacy-first perimenopause tracking app.`,
      `For educational purposes only. Not a substitute for medical advice.`,
    ];
    return lines.join("\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateSummary());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  const hasData = logs.length >= 3;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="ripple-section-title">Appointment Prep</h1>
        <p className="text-sm text-[#6b7a72] mt-1">
          Your pre-appointment summary — review this the night before your GP visit
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>For educational purposes only.</strong> This summary is not a medical document. It is a personal reference to help you communicate your experience clearly to your doctor.
        </p>
      </div>

      {!hasData ? (
        <div className="ripple-card p-8 text-center space-y-3">
          <ClipboardList className="w-10 h-10 text-[#c8c0b8] mx-auto" />
          <div>
            <p className="font-serif text-base font-bold text-[#1a2b22]">Not enough data yet</p>
            <p className="text-xs text-[#6b7a72] max-w-sm mx-auto leading-relaxed mt-1">
              Log at least 3 days of symptoms to generate your appointment summary. You have {trackingDays} day{trackingDays !== 1 ? "s" : ""} logged so far.
            </p>
          </div>
          <Button onClick={() => setActiveTab("log_signals")} className="bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold px-6 py-3 rounded-xl">
            Log Today's Symptoms →
          </Button>
        </div>
      ) : (
        <>
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" className="flex-1 text-xs font-mono border-[#e0d5c8] text-[#6b7a72]">
              {copied ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />Copied!</> : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy Summary</>}
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1 text-xs font-mono border-[#e0d5c8] text-[#6b7a72]">
              <Printer className="w-3.5 h-3.5 mr-1.5" />Print
            </Button>
          </div>

          {/* 1. My Symptom Burden */}
          <PrepSection title="1. My Symptom Burden" icon={BarChart2}>
            <div className="space-y-4">
              {greeneData && (
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-3.5 rounded-xl border ${
                    greeneData.composite > 35 ? "bg-red-50 border-red-200" :
                    greeneData.composite > 20 ? "bg-orange-50 border-orange-200" :
                    greeneData.composite > 10 ? "bg-amber-50 border-amber-200" :
                    "bg-emerald-50 border-emerald-200"
                  }`}>
                    <div>
                      <p className="text-xs text-[#6b7a72]">Greene Climacteric Scale</p>
                      <p className="font-serif text-2xl font-bold text-[#1a2b22]">{greeneData.composite}<span className="text-sm font-sans text-[#6b7a72] ml-1">/63</span></p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                      greeneData.composite > 35 ? "bg-red-100 text-red-700" :
                      greeneData.composite > 20 ? "bg-orange-100 text-orange-700" :
                      greeneData.composite > 10 ? "bg-amber-100 text-amber-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>{greeneData.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Vasomotor", value: greeneData.vasomotor, max: 6 },
                      { label: "Somatic", value: greeneData.somatic, max: 15 },
                      { label: "Psychological", value: greeneData.psychological, max: 15 },
                    ].map(({ label, value, max }) => (
                      <div key={label} className="bg-[#f5f0ea] rounded-xl p-3">
                        <p className="text-[9px] font-mono uppercase tracking-wider text-[#9a9490] font-bold">{label}</p>
                        <p className="font-serif text-lg font-bold text-[#1a2b22]">{value}<span className="text-xs font-sans text-[#9a9490]">/{max}</span></p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#9a9490]">Based on {trackingDays} days of tracking</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="ripple-label">Top 3 Symptoms</p>
                {topSymptoms.map((s, i) => (
                  <div key={s.key} className="flex items-center justify-between bg-[#f5f0ea] rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#9a9490] w-4">{i + 1}.</span>
                      <p className="text-sm font-semibold text-[#1a2b22]">{s.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className={`w-2 h-2 rounded-full ${n <= Math.round(s.avgSeverity) ? "bg-[#c07060]" : "bg-[#e0d5c8]"}`} />
                        ))}
                      </div>
                      <span className="text-xs font-mono text-[#6b7a72]">{s.avgSeverity}/3</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* GP script for top symptom */}
              {topSymptoms[0]?.cknEntry && (
                <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#4a8a72] font-bold">GP Script for {topSymptoms[0].label}</p>
                  <p className="text-xs text-[#3a3a32] leading-relaxed italic">"{topSymptoms[0].cknEntry.gpConversationScript}"</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(topSymptoms[0].cknEntry!.gpConversationScript)}
                    className="text-[10px] text-[#4a8a72] font-mono font-bold hover:underline"
                  >
                    Copy script →
                  </button>
                </div>
              )}
            </div>
          </PrepSection>

          {/* 2. My Current Treatment */}
          <PrepSection title="2. My Current Treatment" icon={ClipboardList} color="text-[#c07060]">
            <div className="space-y-3">
              {activeMeds.length > 0 ? (
                activeMeds.map((med) => (
                  <div key={med.id} className="flex items-start gap-3 bg-[#f5f0ea] rounded-xl p-3">
                    <span className="text-lg shrink-0">💊</span>
                    <div>
                      <p className="text-sm font-bold text-[#1a2b22]">{med.name}</p>
                      <p className="text-xs text-[#6b7a72]">{med.dose} · {med.scheduleType} · started {med.startDate}</p>
                      {med.notes && <p className="text-[10px] text-[#9a9490] mt-0.5">{med.notes}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-[#9a9490]">No medications logged yet.</p>
                  <button onClick={() => setActiveTab("hrt_tracker")} className="text-xs text-[#4a8a72] font-semibold hover:underline">Add medications in HRT Tracker →</button>
                </div>
              )}

              {/* Questions to ask */}
              <div className="bg-[#faf5f3] border border-[#e8d8d0] rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#c07060] font-bold">Questions to Ask</p>
                <ul className="space-y-1.5 text-xs text-[#4a4a42]">
                  {activeMeds.length === 0 ? (
                    <>
                      <li>• "What hormone therapy options are available for my symptoms?"</li>
                      <li>• "Am I a candidate for MHT given my personal history?"</li>
                      <li>• "What non-hormonal options exist if I cannot take hormones?"</li>
                    </>
                  ) : (
                    <>
                      <li>• "Is my current dose appropriate given my symptom data?"</li>
                      <li>• "Should I consider adding or changing any component of my regimen?"</li>
                      <li>• "When should I expect to see improvement, and what should I monitor?"</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </PrepSection>

          {/* 3. Cycle Pattern */}
          <PrepSection title="3. Cycle Pattern" icon={Calendar} color="text-[#8B1A1A]">
            <div className="space-y-3">
              {cycleIntel.status === "ready" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#f5f0ea] rounded-xl p-3 text-center">
                      <p className="text-[9px] font-mono uppercase tracking-wider text-[#9a9490] font-bold">Avg Cycle</p>
                      <p className="font-serif text-xl font-bold text-[#1a2b22]">{cycleIntel.averageCycleLength}<span className="text-xs font-sans text-[#9a9490]"> days</span></p>
                    </div>
                    <div className={`rounded-xl p-3 text-center border ${
                      cycleIntel.cycleVariability === "very_irregular" ? "bg-red-50 border-red-200" :
                      cycleIntel.cycleVariability === "irregular" ? "bg-orange-50 border-orange-200" :
                      cycleIntel.cycleVariability === "slightly_irregular" ? "bg-amber-50 border-amber-200" :
                      "bg-emerald-50 border-emerald-200"
                    }`}>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-[#9a9490] font-bold">Variability</p>
                      <p className="text-xs font-bold text-[#1a2b22] capitalize">{cycleIntel.cycleVariability?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  {cycleIntel.irregularityNote && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs text-amber-800 leading-relaxed">{cycleIntel.irregularityNote}</p>
                    </div>
                  )}
                  <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-3">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#4a8a72] font-bold mb-1">Say this to your doctor</p>
                    <p className="text-xs text-[#3a3a32] leading-relaxed italic">
                      "My cycle tracking data shows {cycleIntel.cycleVariability?.replace(/_/g, " ")} cycles with an average length of {cycleIntel.averageCycleLength} days. According to STRAW+10 criteria, this pattern is consistent with the perimenopausal transition."
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-[#9a9490]">Log at least 2 period start events to generate cycle analysis.</p>
                  <button onClick={() => setActiveTab("cycle_calendar")} className="text-xs text-[#4a8a72] font-semibold hover:underline">Open Cycle Calendar →</button>
                </div>
              )}
            </div>
          </PrepSection>

          {/* 4. Identified Triggers */}
          {triggerAnalysis?.minimumDataMet && triggerAnalysis.topTriggers.length > 0 && (
            <PrepSection title="4. Identified Triggers" icon={AlertCircle} color="text-amber-600">
              <div className="space-y-3">
                {triggerAnalysis.topTriggers.map((t) => (
                  <div key={t.triggerId} className="flex items-center justify-between bg-[#f5f0ea] rounded-xl p-3">
                    <div>
                      <p className="text-sm font-bold text-[#1a2b22]">{t.triggerName}</p>
                      <p className="text-[10px] text-[#9a9490]">→ {t.symptomLabel} · {t.confidence} correlation</p>
                    </div>
                    <span className={`text-xs font-bold font-mono ${t.combinedEffect > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {t.combinedEffect > 0 ? "+" : ""}{t.combinedEffect.toFixed(1)} pts
                    </span>
                  </div>
                ))}
                <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#4a8a72] font-bold mb-1">Say this to your doctor</p>
                  <p className="text-xs text-[#3a3a32] leading-relaxed italic">
                    "My tracking data has identified {triggerAnalysis.topTriggers[0].triggerName} as a significant trigger for my {triggerAnalysis.topTriggers[0].symptomLabel}. I have documented this pattern across {triggerAnalysis.dataPointsAnalysed} days. Can we discuss lifestyle modifications alongside any treatment plan?"
                  </p>
                </div>
              </div>
            </PrepSection>
          )}

          {/* 5. Prior Dismissal Record */}
          {dismissals.length > 0 && (
            <PrepSection title={`5. Prior Dismissal Record (${unresolvedDismissals.length} unresolved)`} icon={ShieldAlert} color="text-[#c07060]">
              <div className="space-y-3">
                {unresolvedDismissals.length > 0 && (
                  <div className="bg-[#faf5f3] border border-[#e8d8d0] rounded-xl p-3 space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#c07060] font-bold">Alert for your doctor</p>
                    <p className="text-xs text-[#4a4a42] leading-relaxed">
                      I have had {unresolvedDismissals.length} previous appointment{unresolvedDismissals.length !== 1 ? "s" : ""} where my symptoms were dismissed or not fully investigated. I am requesting a thorough assessment today.
                    </p>
                  </div>
                )}
                {dismissals.slice(0, 3).map((d) => (
                  <div key={d.id} className="bg-[#f5f0ea] rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#1a2b22]">{d.clinicName}</p>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${d.wasResolved ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {d.wasResolved ? "Resolved" : "Unresolved"}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9a9490]">{d.date}</p>
                    <p className="text-xs text-[#4a4a42] leading-relaxed">"{d.response}"</p>
                  </div>
                ))}

                {/* Counter-script */}
                <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#4a8a72] font-bold">If dismissed again — say this</p>
                  {Object.entries(DISMISSAL_RESPONSES).slice(0, 3).map(([key, script]) => (
                    <div key={key} className="space-y-1">
                      {key !== "default" && <p className="text-[9px] font-mono text-[#9a9490] uppercase">If told: "{key}"</p>}
                      <p className="text-xs text-[#3a3a32] leading-relaxed italic">
                        "{script
                          .replace("{days}", String(trackingDays))
                          .replace("{score}", String(greeneData?.composite ?? "N/A"))
                          .replace("{topSymptom}", topSymptoms[0]?.label ?? "my symptoms")
                        }"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </PrepSection>
          )}

          {/* 6. Clinical References */}
          <PrepSection title="6. Clinical References to Mention" icon={BookOpen} defaultOpen={false}>
            <div className="space-y-2">
              {[
                { name: "NAMS 2023 Hormone Therapy Position Statement", note: "Hormone therapy is the most effective treatment for vasomotor symptoms", url: "https://menopause.org/wp-content/uploads/professional/nams-2022-hormone-therapy-position-statement.pdf" },
                { name: "BMS Menopause Guidelines", note: "Perimenopause can begin 4–10 years before the final menstrual period", url: "https://thebms.org.uk/publications/tools-for-clinicians/menopause/" },
                { name: "STRAW+10 Staging Criteria", note: "Cycles varying ≥7 days define the early menopausal transition", url: "https://pubmed.ncbi.nlm.nih.gov/22367258/" },
                { name: "Greene Climacteric Scale (1998)", note: "Validated 21-item instrument for menopausal symptom severity", url: "https://pubmed.ncbi.nlm.nih.gov/9643514/" },
              ].map((ref) => (
                <a key={ref.name} href={ref.url} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between gap-3 bg-[#f5f0ea] rounded-xl p-3 hover:bg-[#eef4f1] transition-colors group no-underline">
                  <div>
                    <p className="text-xs font-bold text-[#1a2b22]">{ref.name}</p>
                    <p className="text-[10px] text-[#9a9490] leading-relaxed">{ref.note}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#9a9490] shrink-0 mt-0.5 group-hover:text-[#4a8a72] transition-colors" />
                </a>
              ))}
            </div>
          </PrepSection>

          {/* Checklist */}
          <div className="ripple-card p-5 space-y-3">
            <p className="ripple-label">Pre-Appointment Checklist</p>
            {[
              { label: "Review my Greene score and top symptoms above", done: hasData },
              { label: "Copy or print this summary to bring to the appointment", done: false },
              { label: "Log today's symptoms before the appointment", done: logs.some((l) => l.id === new Date().toISOString().split("T")[0]) },
              { label: "Note any questions I want to ask", done: false },
              { label: "Bring a list of all current medications", done: activeMeds.length > 0 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${item.done ? "bg-[#4a8a72] border-[#4a8a72]" : "border-[#c8d8d0]"}`}>
                  {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <p className={`text-xs ${item.done ? "text-[#4a8a72] line-through" : "text-[#3a3a32]"}`}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-start gap-2 text-[10px] text-[#9a9490] bg-[#f5f0ea] rounded-xl p-3.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This summary is for personal reference only. All clinical data is encrypted in your vault and has not been shared with any third party. For the full clinical GP brief with peer-reviewed citations, use the{" "}
              <button onClick={() => setActiveTab("evidence_engine")} className="text-[#4a8a72] font-semibold hover:underline">Evidence Engine</button>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
