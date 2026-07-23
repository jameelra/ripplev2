import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Printer, Copy, CheckCircle2, RefreshCw, Lock,
  AlertCircle, BarChart2, ExternalLink, BookOpen, GraduationCap,
  Stethoscope, Globe, CalendarDays, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useVaultStore } from "../stores/vaultStore";
import { useAuth } from "@/contexts/AuthContext";
import { Streamdown } from "streamdown";
import { GREENE_SUBSCALE_MAX, describeRelativeLevel, RelativeLevel } from "../../../shared/greeneClimactericScale";
import {
  WIKI_PAGES,
  WIKI_TREATMENT_LINKS,
  CLINICAL_GUIDELINE_LINKS,
  PROVIDER_DIRECTORY_LINKS,
} from "../lib/wikiLinks";

// ─── Wiki Resource Link ───────────────────────────────────────────────────────
function WikiResourceLink({
  href,
  label,
  description,
  icon: Icon = ExternalLink,
  variant = "default",
}: {
  href: string;
  label: string;
  description?: string;
  icon?: React.ElementType;
  variant?: "default" | "guideline" | "treatment";
}) {
  const styles = {
    default: "bg-[#f5f0ea] border-[#e0d5c8] hover:bg-[#eef4f1] hover:border-[#c8d8d0]",
    guideline: "bg-[#faf5f3] border-[#e8d8d0] hover:bg-[#f5ede9] hover:border-[#d8c0b8]",
    treatment: "bg-[#eef4f1] border-[#c8d8d0] hover:bg-[#ddeee7] hover:border-[#a8c8bc]",
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between border rounded-xl p-3.5 transition-colors group no-underline ${styles[variant]}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-4 h-4 shrink-0 ${variant === "guideline" ? "text-[#c07060]" : "text-[#4a8a72]"}`} />
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#1a2b22] truncate">{label}</p>
          {description && <p className="text-[10px] text-[#6b7a72] leading-snug mt-0.5 truncate">{description}</p>}
        </div>
      </div>
      <ExternalLink className="w-3 h-3 text-[#9a9490] shrink-0 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
    </a>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EvidenceEngine() {
  const { logs, dismissals, cycleEvents, hrtMedications, triggerAnalysis, greeneScores, licenseTier, setActiveTab } = useVaultStore();
  const { user, openAuthModal } = useAuth();
  const [brief, setBrief] = useState<string | null>(null);
  const [scores, setScores] = useState<{
    greene: {
      total: number;
      psychological: number;
      somatic: number;
      vasomotor: number;
      sexual: number;
      takenAt: string;
    } | null;
    trackingDays: number;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setTab] = useState<"brief" | "references" | "providers">("brief");

  const generateMutation = trpc.ai.generateEvidence.useMutation({
    onSuccess: (data) => {
      setBrief(data.brief);
      setScores({
        greene: data.greene,
        trackingDays: data.trackingDays,
      });
      setIsGenerating(false);
      setTab("brief");
    },
    onError: () => setIsGenerating(false),
  });

  const handleGenerate = () => {
    if (logs.length < 3) return;
    if (!user) {
      openAuthModal();
      return;
    }
    setIsGenerating(true);
    setBrief(null);
    generateMutation.mutate({
      dismissals: dismissals.map((d) => ({
        id: d.id,
        date: d.date,
        clinicName: d.clinicName,
        clinicianName: d.clinicianName ?? "",
        symptomsReported: d.symptomsReported,
        response: d.response,
        wasResolved: d.wasResolved,
      })),
      cycleEvents: cycleEvents.map((e) => ({
        id: e.id,
        date: e.date,
        type: e.type as "period_start" | "period_active" | "period_end" | "ovulation" | "spotting" | "predicted_period" | "predicted_ovulation",
        flowIntensity: e.flowIntensity as "light" | "medium" | "heavy" | "spotting" | undefined,
        notes: e.notes,
        createdAt: e.createdAt,
      })),
      hrtMedications: hrtMedications.map((m) => ({
        id: m.id,
        name: m.name,
        activeIngredient: m.activeIngredient,
        deliveryMethod: m.deliveryMethod,
        dose: m.dose,
        scheduleType: m.scheduleType,
        startDate: m.startDate,
        endDate: m.endDate,
        isActive: m.isActive,
        notes: m.notes,
      })),
      triggerAnalysis: triggerAnalysis?.minimumDataMet ? {
        topTriggers: triggerAnalysis.topTriggers.map((t) => ({
          triggerName: t.triggerName,
          symptomLabel: t.symptomLabel,
          sameDayDifference: t.sameDayDifference,
          nextDayDifference: t.nextDayDifference,
          combinedEffect: t.combinedEffect,
          confidence: t.confidence,
          occurrenceCount: t.occurrenceCount,
        })),
        minimumDataMet: true,
        dataPointsAnalysed: triggerAnalysis.dataPointsAnalysed,
      } : undefined,
      logs: logs.map((l) => ({
        id: l.id,
        date: l.date,
        symptoms: l.symptoms as unknown as Record<string, number>,
        signals: l.signals,
        cycle: {
          cycleActive: l.cycle.cycleActive,
          flowIntensity: l.cycle.flowIntensity,
          spotting: l.cycle.spotting,
        },
        diaryText: l.diaryText,
      })),
      greeneScores: greeneScores.map((g) => ({
        takenAt: g.takenAt,
        total: g.total,
        psychological: g.psychological,
        somatic: g.somatic,
        vasomotor: g.vasomotor,
        sexual: g.sexual,
      })),
    });
  };

  const handleCopy = async () => {
    if (!brief) return;
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isProOrPremier = licenseTier === "Pro" || licenseTier === "Premier";
  const hasEnoughData = logs.length >= 3;

  // Purely descriptive placement within the scale's possible range — Greene
  // (1998) publishes no diagnostic cutoff, so this never implies "mild" vs
  // "severe" in a clinical sense. See shared/greeneClimactericScale.ts.
  const getGreeneRangeBand = (level: RelativeLevel) => {
    if (level === "lower") return { label: "Lower third of range", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
    if (level === "middle") return { label: "Middle third of range", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
    return { label: "Upper third of range", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="ripple-section-title">Evidence Engine</h1>
        <p className="text-sm text-[#6b7a72] mt-1">
          Generate a clinical-grade GP brief with Greene Climacteric Scale scores and peer-reviewed citations
        </p>
      </div>

      {/* What is this */}
      <div className="ripple-card p-5 bg-[#f5f0ea] border-[#e0d5c8]">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-[#4a8a72] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#1a2b22]">What is the Evidence Engine?</p>
            <p className="text-xs text-[#6b7a72] leading-relaxed">
              It compiles your tracked symptom data into a structured clinical brief — including validated Greene Climacteric Scale scores, biometric averages, and peer-reviewed citations from NAMS, BMS, and the Endocrine Society. Print it or share it with your doctor.
            </p>
          </div>
        </div>
      </div>

      {/* Data status */}
      <div className={`ripple-card p-4 flex items-center justify-between ${hasEnoughData ? "border-[#c8d8d0] bg-[#eef4f1]" : "border-[#e0d5c8]"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${hasEnoughData ? "bg-[#4a8a72]/10" : "bg-[#e0d5c8]/50"}`}>
            <BarChart2 className={`w-4.5 h-4.5 ${hasEnoughData ? "text-[#4a8a72]" : "text-[#9a9490]"}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1a2b22]">{logs.length} days tracked</p>
            <p className="text-xs text-[#6b7a72]">
              {hasEnoughData ? "Enough data to generate your report" : `Log ${3 - logs.length} more days to unlock`}
            </p>
          </div>
        </div>
        {!hasEnoughData && (
          <button onClick={() => setActiveTab("log_signals")} className="text-xs font-mono font-bold text-[#4a8a72] hover:underline">
            Log now →
          </button>
        )}
      </div>

      {/* Pro gate */}
      {!isProOrPremier && (
        <div className="ripple-card p-5 border-[#e8d8d0] bg-[#faf5f3] space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#c07060]" />
            <p className="text-sm font-bold text-[#1a2b22]">Pro Feature</p>
          </div>
          <p className="text-xs text-[#6b7a72] leading-relaxed">
            The full Evidence Engine with Greene Climacteric Scale scoring, peer-reviewed citations, and printable GP briefs is available on the Pro plan.
          </p>
          <div className="bg-[#f5f0ea] rounded-xl p-3 space-y-1 text-xs text-[#4a4a42]">
            <p className="font-bold text-[#1a2b22]">Free tier includes:</p>
            <p>✓ Basic symptom summary · ✓ Top 3 symptoms overview</p>
            <p className="font-bold text-[#1a2b22] mt-2">Pro ($9.99/mo) unlocks:</p>
            <p>✓ Full Greene Climacteric Scale scores</p>
            <p>✓ Peer-reviewed NAMS/BMS citations</p>
            <p>✓ Printable clinical GP brief</p>
          </div>
          <Button
            onClick={() => setActiveTab("upgrade_hub")}
            className="w-full bg-[#c07060] hover:bg-[#a05848] text-white font-mono text-xs font-bold py-3 rounded-xl"
          >
            Upgrade to Pro — $9.99/mo
          </Button>
        </div>
      )}

      {/* HRT data preview card */}
      {hasEnoughData && (
        <div className={`ripple-card p-4 flex items-start gap-3 ${
          hrtMedications.filter((m) => m.isActive).length > 0 ? "border-[#c8d8d0] bg-[#eef4f1]" : "border-[#e0d5c8]"
        }`}>
          <span className="text-lg shrink-0 mt-0.5">💊</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#1a2b22]">
              HRT Regimen: {hrtMedications.filter((m) => m.isActive).length > 0
                ? `${hrtMedications.filter((m) => m.isActive).length} active medication${hrtMedications.filter((m) => m.isActive).length !== 1 ? "s" : ""}`
                : "No medications logged"}
            </p>
            <p className="text-xs text-[#6b7a72] mt-0.5 leading-relaxed">
              {hrtMedications.filter((m) => m.isActive).length > 0
                ? `${hrtMedications.filter((m) => m.isActive).map((m) => m.name).join(", ")} — will appear in Section 4 of your GP brief.`
                : "Add your medications in the HRT Tracker to include your treatment regimen in the GP brief."}
            </p>
          </div>
          {hrtMedications.filter((m) => m.isActive).length === 0 && (
            <button onClick={() => setActiveTab("hrt_tracker")} className="text-xs font-mono font-bold text-[#4a8a72] hover:underline shrink-0">Add →</button>
          )}
        </div>
      )}

      {/* Trigger data preview card */}
      {hasEnoughData && (
        <div className={`ripple-card p-4 flex items-start gap-3 ${
          triggerAnalysis?.minimumDataMet ? "border-[#c8d8d0] bg-[#eef4f1]" : "border-[#e0d5c8]"
        }`}>
          <Zap className={`w-5 h-5 shrink-0 mt-0.5 ${triggerAnalysis?.minimumDataMet ? "text-[#4a8a72]" : "text-[#9a9490]"}`} />
          <div className="flex-1">
            <p className="text-sm font-bold text-[#1a2b22]">
              Trigger Analysis: {triggerAnalysis?.minimumDataMet
                ? `${triggerAnalysis.topTriggers.length} correlation${triggerAnalysis.topTriggers.length !== 1 ? "s" : ""} identified`
                : "Not yet available"}
            </p>
            <p className="text-xs text-[#6b7a72] mt-0.5 leading-relaxed">
              {triggerAnalysis?.minimumDataMet
                ? `${triggerAnalysis.dataPointsAnalysed} days analysed — trigger correlations will appear in Section 5 of your GP brief.`
                : "Log triggers alongside symptoms for 14 days to unlock trigger analysis in your GP brief."}
            </p>
          </div>
          {!triggerAnalysis?.minimumDataMet && (
            <button onClick={() => setActiveTab("trigger_tracker")} className="text-xs font-mono font-bold text-[#4a8a72] hover:underline shrink-0">Log →</button>
          )}
        </div>
      )}

      {/* Cycle data preview card */}
      {hasEnoughData && (() => {
        const periodStarts = cycleEvents.filter((e) => e.type === "period_start");
        const spottingCount = cycleEvents.filter((e) => e.type === "spotting").length;
        return (
          <div className={`ripple-card p-4 flex items-start gap-3 ${
            cycleEvents.length > 0 ? "border-[#c8d8d0] bg-[#eef4f1]" : "border-[#e0d5c8]"
          }`}>
            <CalendarDays className={`w-5 h-5 shrink-0 mt-0.5 ${
              cycleEvents.length > 0 ? "text-[#4a8a72]" : "text-[#9a9490]"
            }`} />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#1a2b22]">
                Cycle Data: {cycleEvents.length > 0 ? `${cycleEvents.length} events logged` : "No cycle events logged"}
              </p>
              <p className="text-xs text-[#6b7a72] mt-0.5 leading-relaxed">
                {cycleEvents.length > 0
                  ? `${periodStarts.length} period start${periodStarts.length !== 1 ? "s" : ""}${
                      spottingCount > 0 ? `, ${spottingCount} spotting event${spottingCount !== 1 ? "s" : ""}` : ""
                    } — cycle analysis will be included in Section 4 of your GP brief.`
                  : "Log cycle events in the Cycle Calendar to include a menstrual cycle analysis in your GP brief."}
              </p>
            </div>
            {cycleEvents.length === 0 && (
              <button
                onClick={() => setActiveTab("cycle_calendar")}
                className="text-xs font-mono font-bold text-[#4a8a72] hover:underline shrink-0"
              >
                Log →
              </button>
            )}
          </div>
        );
      })()}

      {/* Generate button */}
      {hasEnoughData && (
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold py-4 rounded-xl"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Generating Clinical Brief…</span>
          ) : (
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" />Generate GP Appointment Brief</span>
          )}
        </Button>
      )}

      {/* Results section */}
      <AnimatePresence>
        {scores && brief && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Greene Score */}
            <div className="ripple-card p-5 space-y-4">
              <p className="ripple-label">Greene Climacteric Scale</p>
              {scores.greene ? (
                <>
                  <div
                    className={`flex items-center justify-between p-4 rounded-xl border ${getGreeneRangeBand(describeRelativeLevel(scores.greene.total, GREENE_SUBSCALE_MAX.total)).bg}`}
                  >
                    <div>
                      <p className="text-xs text-[#6b7a72]">
                        Total score · {new Date(scores.greene.takenAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                      <p
                        className={`font-serif text-3xl font-bold ${getGreeneRangeBand(describeRelativeLevel(scores.greene.total, GREENE_SUBSCALE_MAX.total)).color}`}
                      >
                        {scores.greene.total}
                        <span className="text-sm font-sans font-normal text-[#6b7a72] ml-1">/{GREENE_SUBSCALE_MAX.total}</span>
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold px-3 py-1.5 rounded-full border ${getGreeneRangeBand(describeRelativeLevel(scores.greene.total, GREENE_SUBSCALE_MAX.total)).bg} ${getGreeneRangeBand(describeRelativeLevel(scores.greene.total, GREENE_SUBSCALE_MAX.total)).color}`}
                    >
                      {getGreeneRangeBand(describeRelativeLevel(scores.greene.total, GREENE_SUBSCALE_MAX.total)).label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Psychological", score: scores.greene.psychological, max: GREENE_SUBSCALE_MAX.psychological },
                      { label: "Somatic", score: scores.greene.somatic, max: GREENE_SUBSCALE_MAX.somatic },
                      { label: "Vasomotor", score: scores.greene.vasomotor, max: GREENE_SUBSCALE_MAX.vasomotor },
                      { label: "Sexual", score: scores.greene.sexual, max: GREENE_SUBSCALE_MAX.sexual },
                    ].map(({ label, score, max }) => (
                      <div key={label} className="bg-[#f5f0ea] rounded-xl p-3 text-center">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-[#9a9490] font-bold">{label}</p>
                        <p className="font-serif text-xl font-bold text-[#1a2b22] mt-1">
                          {score}<span className="text-xs font-sans text-[#6b7a72]">/{max}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-[#f5f0ea] rounded-xl p-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-[#6b7a72] leading-relaxed">
                    No Greene Climacteric Scale assessment recorded yet — complete the 21-item questionnaire to include it in this brief.
                  </p>
                  <button
                    onClick={() => setActiveTab("greene_assessment")}
                    className="shrink-0 text-xs font-mono font-bold text-[#4a8a72] hover:underline"
                  >
                    Take assessment →
                  </button>
                </div>
              )}
              <p className="text-[10px] text-[#9a9490] leading-relaxed">
                Greene JG. Constructing a Standard Climacteric Scale. <em>Maturitas</em>. 1998;29(1):25–31.
              </p>
            </div>

            {/* Content tabs */}
            <div className="flex gap-1 bg-[#f5f0ea] p-1 rounded-xl">
              {[
                { id: "brief" as const, label: "GP Brief" },
                { id: "references" as const, label: "Clinical References" },
                { id: "providers" as const, label: "Find a Provider" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab.id ? "bg-white text-[#1a2b22] shadow-sm" : "text-[#6b7a72] hover:text-[#1a2b22]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* GP Brief tab */}
            {activeTab === "brief" && (
              <div className="space-y-3">
                <div className="flex gap-2 no-print">
                  <Button onClick={handleCopy} variant="outline" className="flex-1 text-xs font-mono border-[#e0d5c8] text-[#6b7a72]">
                    {copied ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />Copied!</> : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy Brief</>}
                  </Button>
                  <Button onClick={() => window.print()} variant="outline" className="flex-1 text-xs font-mono border-[#e0d5c8] text-[#6b7a72]">
                    <Printer className="w-3.5 h-3.5 mr-1.5" />Print Brief
                  </Button>
                </div>
                <div className="ripple-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#4a8a72]" />
                    <p className="ripple-label">Clinical GP Brief</p>
                  </div>
                  <div className="prose prose-sm max-w-none text-[#3a3a32] text-xs leading-relaxed">
                    <Streamdown>{brief}</Streamdown>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-[#9a9490] bg-[#f5f0ea] rounded-xl p-3.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    This document is for informational purposes only and does not constitute a medical diagnosis. It should be reviewed by a qualified healthcare provider alongside clinical examination and appropriate laboratory investigations.
                  </p>
                </div>
              </div>
            )}

            {/* Clinical References tab */}
            {activeTab === "references" && (
              <div className="space-y-4">
                {/* Wiki primary source */}
                <div className="space-y-2">
                  <p className="ripple-label">Primary Knowledge Source</p>
                  <WikiResourceLink
                    href={WIKI_PAGES.home}
                    label="The Menopause Wiki"
                    description="Official knowledge base for r/menopause & r/perimenopause · 500,000+ members"
                    icon={BookOpen}
                    variant="treatment"
                  />
                </div>

                {/* Clinical guidelines */}
                <div className="space-y-2">
                  <p className="ripple-label">Clinical Guidelines & Position Statements</p>
                  {CLINICAL_GUIDELINE_LINKS.map((g) => (
                    <WikiResourceLink
                      key={g.name}
                      href={g.url}
                      label={g.name}
                      description={`${g.organisation} · ${g.year} · ${g.type}`}
                      icon={GraduationCap}
                      variant="guideline"
                    />
                  ))}
                </div>

                {/* Treatment references */}
                <div className="space-y-2">
                  <p className="ripple-label">Treatment Reference Guides</p>
                  {Object.values(WIKI_TREATMENT_LINKS).map((t) => (
                    <WikiResourceLink
                      key={t.label}
                      href={t.url}
                      label={t.label}
                      description={t.description}
                      icon={Stethoscope}
                      variant="default"
                    />
                  ))}
                </div>

                {/* Navigating your appointment */}
                <div className="space-y-2">
                  <p className="ripple-label">Preparing for Your Appointment</p>
                  <WikiResourceLink
                    href={WIKI_TREATMENT_LINKS.doctorVisit.url}
                    label="Navigating Your Medical Appointment"
                    description="How to ask for treatment, handle dismissal, and advocate for yourself"
                    icon={FileText}
                    variant="treatment"
                  />
                  <WikiResourceLink
                    href={WIKI_PAGES.isThisPerimenopause}
                    label="Is This Perimenopause?"
                    description="Self-assessment guide to help confirm your symptoms"
                    icon={AlertCircle}
                    variant="default"
                  />
                </div>
              </div>
            )}

            {/* Find a Provider tab */}
            {activeTab === "providers" && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    These directories are sourced from the Menopause Wiki. Ripple does not endorse or verify individual providers. Always research providers independently.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="ripple-label">Menopause Specialist Directories by Region</p>
                  {PROVIDER_DIRECTORY_LINKS.map((p) => (
                    <WikiResourceLink
                      key={p.name}
                      href={p.url}
                      label={p.name}
                      description={`${p.region}${p.note ? ` · ${p.note}` : ""}`}
                      icon={Globe}
                      variant="default"
                    />
                  ))}
                </div>

                <WikiResourceLink
                  href={WIKI_PAGES.providers}
                  label="Full Provider Directory on Menopause Wiki"
                  description="Telehealth providers, academic centres, and more by country"
                  icon={BookOpen}
                  variant="treatment"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Always-visible references section (before generating) */}
      {!brief && (
        <div className="space-y-3">
          <div className="ripple-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#4a8a72]" />
              <p className="ripple-label">Clinical References</p>
            </div>
            <p className="text-xs text-[#6b7a72] leading-relaxed">
              Ripple's Evidence Engine cites the following peer-reviewed guidelines. You can read them directly:
            </p>
            <div className="space-y-2">
              {CLINICAL_GUIDELINE_LINKS.slice(0, 3).map((g) => (
                <WikiResourceLink
                  key={g.name}
                  href={g.url}
                  label={g.name}
                  description={`${g.organisation} · ${g.year}`}
                  icon={GraduationCap}
                  variant="guideline"
                />
              ))}
            </div>
            <WikiResourceLink
              href={WIKI_PAGES.home}
              label="Menopause Wiki — Full Clinical Reference"
              description="Evidence-based information on symptoms, treatments, and navigating care"
              icon={BookOpen}
              variant="treatment"
            />
          </div>
        </div>
      )}
    </div>
  );
}
