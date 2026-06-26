import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Printer, Copy, CheckCircle2, RefreshCw, Lock, AlertCircle, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useVaultStore } from "../stores/vaultStore";
import { Streamdown } from "streamdown";

export default function EvidenceEngine() {
  const { logs, licenseTier, setActiveTab } = useVaultStore();
  const [brief, setBrief] = useState<string | null>(null);
  const [scores, setScores] = useState<{
    greeneScore: number;
    vasomotorScore: number;
    somaticScore: number;
    psychologicalScore: number;
    trackingDays: number;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateMutation = trpc.ai.generateEvidence.useMutation({
    onSuccess: (data) => {
      setBrief(data.brief);
      setScores({
        greeneScore: data.greeneScore,
        vasomotorScore: data.vasomotorScore,
        somaticScore: data.somaticScore,
        psychologicalScore: data.psychologicalScore,
        trackingDays: data.trackingDays,
      });
      setIsGenerating(false);
    },
    onError: () => setIsGenerating(false),
  });

  const handleGenerate = () => {
    if (logs.length < 3) return;
    setIsGenerating(true);
    setBrief(null);
    generateMutation.mutate({
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
    });
  };

  const handleCopy = async () => {
    if (!brief) return;
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isProOrPremier = licenseTier === "Pro" || licenseTier === "Premier";
  const hasEnoughData = logs.length >= 3;

  // Greene score interpretation
  const getGreeneLabel = (score: number) => {
    if (score < 10) return { label: "Mild", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
    if (score < 25) return { label: "Moderate", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
    if (score < 40) return { label: "Significant", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
    return { label: "Severe", color: "text-red-700", bg: "bg-red-50 border-red-200" };
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="ripple-section-title">Evidence Engine</h1>
        <p className="text-sm text-[#6b7a72] mt-1">
          Generate a clinical-grade GP appointment brief with Greene Climacteric Scale scores
        </p>
      </div>

      {/* What is this? */}
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

      {/* Data Status */}
      <div className={`ripple-card p-4 flex items-center justify-between ${hasEnoughData ? "border-[#c8d8d0] bg-[#eef4f1]" : "border-[#e0d5c8]"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${hasEnoughData ? "bg-[#4a8a72]/10" : "bg-[#e0d5c8]/50"}`}>
            <BarChart2 className={`w-4.5 h-4.5 ${hasEnoughData ? "text-[#4a8a72]" : "text-[#9a9490]"}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1a2b22]">{logs.length} days tracked</p>
            <p className="text-xs text-[#6b7a72]">
              {hasEnoughData
                ? "Enough data to generate your report"
                : `Log ${3 - logs.length} more days to unlock`}
            </p>
          </div>
        </div>
        {!hasEnoughData && (
          <button
            onClick={() => setActiveTab("log_signals")}
            className="text-xs font-mono font-bold text-[#4a8a72] hover:underline"
          >
            Log now →
          </button>
        )}
      </div>

      {/* Pro Gate */}
      {!isProOrPremier && (
        <div className="ripple-card p-5 border-[#e8d8d0] bg-[#faf5f3] space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#c07060]" />
            <p className="text-sm font-bold text-[#1a2b22]">Pro Feature</p>
          </div>
          <p className="text-xs text-[#6b7a72] leading-relaxed">
            The full Evidence Engine with Greene Climacteric Scale scoring, peer-reviewed citations, and printable GP briefs is available on the Pro plan.
          </p>
          <div className="bg-[#f5f0ea] rounded-xl p-3 space-y-1.5 text-xs text-[#4a4a42]">
            <p className="font-bold text-[#1a2b22]">Free tier includes:</p>
            <p>✓ Basic symptom summary (no Greene scoring)</p>
            <p>✓ Top 3 symptoms overview</p>
            <p className="font-bold text-[#1a2b22] mt-2">Pro ($9.99/mo) unlocks:</p>
            <p>✓ Full Greene Climacteric Scale scores</p>
            <p>✓ Peer-reviewed NAMS/BMS citations</p>
            <p>✓ Printable clinical GP brief</p>
            <p>✓ Dismissal record integration</p>
          </div>
          <Button
            onClick={() => setActiveTab("upgrade_hub")}
            className="w-full bg-[#c07060] hover:bg-[#a05848] text-white font-mono text-xs font-bold py-3 rounded-xl"
          >
            Upgrade to Pro — $9.99/mo
          </Button>
        </div>
      )}

      {/* Generate Button (Pro/Premier or basic) */}
      {hasEnoughData && (
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold py-4 rounded-xl"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating Clinical Brief…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Generate GP Appointment Brief
            </span>
          )}
        </Button>
      )}

      {/* Results */}
      <AnimatePresence>
        {scores && brief && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Greene Score Summary */}
            <div className="ripple-card p-5 space-y-4">
              <p className="ripple-label">Greene Climacteric Scale Scores</p>

              <div className={`flex items-center justify-between p-4 rounded-xl border ${getGreeneLabel(scores.greeneScore).bg}`}>
                <div>
                  <p className="text-xs text-[#6b7a72]">Composite GCS Score</p>
                  <p className={`font-serif text-3xl font-bold ${getGreeneLabel(scores.greeneScore).color}`}>
                    {scores.greeneScore}<span className="text-sm font-sans font-normal text-[#6b7a72] ml-1">/63</span>
                  </p>
                </div>
                <span className={`text-sm font-bold px-3 py-1.5 rounded-full border ${getGreeneLabel(scores.greeneScore).bg} ${getGreeneLabel(scores.greeneScore).color}`}>
                  {getGreeneLabel(scores.greeneScore).label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Vasomotor", score: scores.vasomotorScore, max: 6 },
                  { label: "Somatic", score: scores.somaticScore, max: 15 },
                  { label: "Psychological", score: scores.psychologicalScore, max: 15 },
                ].map(({ label, score, max }) => (
                  <div key={label} className="bg-[#f5f0ea] rounded-xl p-3 text-center">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#9a9490] font-bold">{label}</p>
                    <p className="font-serif text-xl font-bold text-[#1a2b22] mt-1">
                      {score.toFixed(1)}<span className="text-xs font-sans text-[#6b7a72]">/{max}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 no-print">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 text-xs font-mono border-[#e0d5c8] text-[#6b7a72]"
              >
                {copied ? (
                  <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy Brief</>
                )}
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex-1 text-xs font-mono border-[#e0d5c8] text-[#6b7a72]"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />Print Brief
              </Button>
            </div>

            {/* Full Brief */}
            <div className="ripple-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#4a8a72]" />
                <p className="ripple-label">Clinical GP Brief</p>
              </div>
              <div className="prose prose-sm max-w-none text-[#3a3a32] text-xs leading-relaxed">
                <Streamdown>{brief}</Streamdown>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 text-xs text-[#9a9490] bg-[#f5f0ea] rounded-xl p-3.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                This document is for informational purposes only and does not constitute a medical diagnosis. It should be reviewed by a qualified healthcare provider alongside clinical examination and appropriate laboratory investigations.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
