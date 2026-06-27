import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVaultStore } from "../stores/vaultStore";
import {
  DayLog,
  SymptomLog,
  DEFAULT_SYMPTOMS,
  DEFAULT_SIGNALS,
  DEFAULT_CYCLE,
} from "../../../shared/types";

// ─── Top 6 symptoms for quick selection ──────────────────────────────────────
const QUICK_SYMPTOMS: Array<{ key: keyof SymptomLog; label: string; emoji: string }> = [
  { key: "hotFlashes",       label: "Hot Flashes",    emoji: "🔥" },
  { key: "fatigue",          label: "Fatigue",         emoji: "🔋" },
  { key: "brainFog",         label: "Brain Fog",       emoji: "🌫" },
  { key: "sleepLatency",     label: "Sleep Issues",    emoji: "🌙" },
  { key: "anxiety",          label: "Anxiety",         emoji: "💭" },
  { key: "jointPain",        label: "Joint Pain",      emoji: "🦴" },
];

const SLEEP_OPTIONS = [
  { value: "poor",  label: "Poor",  emoji: "😴", hours: 5 },
  { value: "ok",    label: "OK",    emoji: "😐", hours: 6.5 },
  { value: "good",  label: "Good",  emoji: "😊", hours: 7.5 },
] as const;

type SleepOption = typeof SLEEP_OPTIONS[number]["value"];

// ─── Floating Action Button ───────────────────────────────────────────────────
export function QuickLogFAB({ onOpen }: { onOpen: () => void }) {
  const today = new Date().toISOString().split("T")[0];
  const { logs } = useVaultStore();
  const todayLog = logs.find((l) => l.id === today);
  const hasFullLog = todayLog && !todayLog.quickLogOnly;
  const hasQuickLog = todayLog && todayLog.quickLogOnly;

  // Don't show FAB if a full detailed log already exists
  if (hasFullLog) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}
      onClick={onOpen}
      className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg font-mono text-xs font-bold transition-all ${
        hasQuickLog
          ? "bg-[#4a8a72] text-white hover:bg-[#3a7060]"
          : "bg-[#1a2b22] text-white hover:bg-[#2a3b32]"
      }`}
      style={{ boxShadow: "0 4px 20px rgba(26,43,34,0.3)" }}
    >
      {hasQuickLog ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          <span>Quick Logged ✓</span>
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          <span>Quick Log</span>
        </>
      )}
    </motion.button>
  );
}

// ─── Quick Log Modal ──────────────────────────────────────────────────────────
interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickLogModal({ isOpen, onClose }: QuickLogModalProps) {
  const { logs, saveLog, setToastNotification } = useVaultStore();
  const today = new Date().toISOString().split("T")[0];
  const existingLog = logs.find((l) => l.id === today);

  const [step, setStep] = useState(0);
  const [overallSeverity, setOverallSeverity] = useState(5);
  const [topSymptom, setTopSymptom] = useState<keyof SymptomLog | null>(null);
  const [sleepQuality, setSleepQuality] = useState<SleepOption | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const TOTAL_STEPS = 3;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Build a minimal symptom log — set top symptom to severity based on overall
      const symptomSeverity = overallSeverity >= 8 ? 3 : overallSeverity >= 5 ? 2 : overallSeverity >= 3 ? 1 : 0;
      const symptoms: SymptomLog = {
        ...DEFAULT_SYMPTOMS,
        ...(topSymptom ? { [topSymptom]: symptomSeverity } : {}),
      };

      const sleepOpt = SLEEP_OPTIONS.find((s) => s.value === sleepQuality);
      const signals = {
        ...DEFAULT_SIGNALS,
        sleepDuration: sleepOpt?.hours ?? DEFAULT_SIGNALS.sleepDuration,
      };

      // Merge with existing log — never overwrite detailed data with quick log data
      const log: DayLog = existingLog
        ? {
            ...existingLog,
            // Only update if existing log was also a quick log (allow upgrading)
            symptoms: existingLog.quickLogOnly ? symptoms : existingLog.symptoms,
            signals: existingLog.quickLogOnly ? signals : existingLog.signals,
            timestamp: new Date().toISOString(),
            quickLogOnly: existingLog.quickLogOnly ? true : false,
          }
        : {
            id: today,
            date: today,
            symptoms,
            signals,
            cycle: { ...DEFAULT_CYCLE },
            diaryText: "",
            timestamp: new Date().toISOString(),
            quickLogOnly: true,
          };

      await saveLog(log);
      setToastNotification({
        type: "success",
        title: "Quick Log Saved! ⚡",
        description: "30-second log saved to your vault. Add more detail in Today's Log anytime.",
      });
      onClose();
      setStep(0);
      setTopSymptom(null);
      setSleepQuality(null);
      setOverallSeverity(5);
    } catch (err) {
      setToastNotification({ type: "error", title: "Save Failed", description: String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else handleSave();
  };

  const canProceed = () => {
    if (step === 0) return true; // slider always has a value
    if (step === 1) return topSymptom !== null;
    if (step === 2) return sleepQuality !== null;
    return false;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 pb-8 max-w-lg mx-auto shadow-2xl"
            style={{ maxHeight: "85vh", overflowY: "auto" }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-[#e0d5c8] rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#1a2b22] rounded-xl flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-serif text-base font-bold text-[#1a2b22]">Quick Log</p>
                  <p className="text-[10px] text-[#9a9490] font-mono">30 seconds · {step + 1} of {TOTAL_STEPS}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 text-[#9a9490] hover:text-[#1a2b22] hover:bg-[#f5f0ea] rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex gap-1.5 mb-6">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`h-1 rounded-full flex-1 transition-all ${i <= step ? "bg-[#4a8a72]" : "bg-[#e0d5c8]"}`} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Step 0: Overall severity */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="text-center space-y-1">
                    <p className="font-serif text-xl font-bold text-[#1a2b22]">How are you feeling today?</p>
                    <p className="text-xs text-[#9a9490]">Overall wellbeing on a scale of 1–10</p>
                  </div>

                  {/* Big number display */}
                  <div className="text-center">
                    <span className="font-serif text-7xl font-bold text-[#1a2b22]">{overallSeverity}</span>
                    <span className="text-xl text-[#9a9490] ml-1">/10</span>
                  </div>

                  {/* Slider */}
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={overallSeverity}
                      onChange={(e) => setOverallSeverity(parseInt(e.target.value))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #4a8a72 0%, #4a8a72 ${(overallSeverity - 1) / 9 * 100}%, #e0d5c8 ${(overallSeverity - 1) / 9 * 100}%, #e0d5c8 100%)`,
                      }}
                    />
                    <div className="flex justify-between text-[10px] text-[#9a9490] font-mono">
                      <span>1 — Great</span>
                      <span>5 — Okay</span>
                      <span>10 — Rough</span>
                    </div>
                  </div>

                  {/* Emoji feedback */}
                  <div className="text-center text-3xl">
                    {overallSeverity <= 3 ? "😊" : overallSeverity <= 6 ? "😐" : overallSeverity <= 8 ? "😔" : "😣"}
                  </div>
                </motion.div>
              )}

              {/* Step 1: Top symptom */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="text-center space-y-1">
                    <p className="font-serif text-xl font-bold text-[#1a2b22]">What's bothering you most?</p>
                    <p className="text-xs text-[#9a9490]">Tap your top symptom today</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {QUICK_SYMPTOMS.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setTopSymptom(s.key)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                          topSymptom === s.key
                            ? "bg-[#1a2b22] text-white border-[#1a2b22]"
                            : "bg-[#f5f0ea] text-[#3a3a32] border-[#e0d5c8] hover:border-[#c8d8d0]"
                        }`}
                      >
                        <span className="text-2xl">{s.emoji}</span>
                        <span className="text-sm font-semibold">{s.label}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => { setTopSymptom(null); setStep(2); }}
                    className="w-full text-center text-xs text-[#9a9490] hover:text-[#6b7a72] font-mono"
                  >
                    Nothing stands out today → Skip
                  </button>
                </motion.div>
              )}

              {/* Step 2: Sleep quality */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="text-center space-y-1">
                    <p className="font-serif text-xl font-bold text-[#1a2b22]">How did you sleep?</p>
                    <p className="text-xs text-[#9a9490]">Last night's sleep quality</p>
                  </div>

                  <div className="space-y-3">
                    {SLEEP_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSleepQuality(opt.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                          sleepQuality === opt.value
                            ? "bg-[#1a2b22] text-white border-[#1a2b22]"
                            : "bg-[#f5f0ea] text-[#3a3a32] border-[#e0d5c8] hover:border-[#c8d8d0]"
                        }`}
                      >
                        <span className="text-3xl">{opt.emoji}</span>
                        <div>
                          <p className="font-bold text-sm">{opt.label}</p>
                          <p className={`text-[10px] font-mono ${sleepQuality === opt.value ? "text-white/70" : "text-[#9a9490]"}`}>
                            ~{opt.hours}h logged
                          </p>
                        </div>
                        {sleepQuality === opt.value && (
                          <CheckCircle2 className="w-5 h-5 text-[#4a8a72] ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 py-3 rounded-2xl border border-[#e0d5c8] text-sm font-mono font-bold text-[#6b7a72] hover:bg-[#f5f0ea] transition"
                >
                  Back
                </button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSaving}
                className={`flex-1 py-3 rounded-2xl font-mono text-sm font-bold transition-all ${
                  step === TOTAL_STEPS - 1
                    ? "bg-[#4a8a72] hover:bg-[#3a7060] text-white"
                    : "bg-[#1a2b22] hover:bg-[#2a3b32] text-white"
                }`}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</span>
                ) : step === TOTAL_STEPS - 1 ? (
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Save Log</span>
                ) : (
                  <span className="flex items-center gap-2">Next <ChevronRight className="w-4 h-4" /></span>
                )}
              </Button>
            </div>

            {/* Upgrade nudge */}
            <p className="text-center text-[10px] text-[#9a9490] mt-3 leading-relaxed">
              Quick Log saves a minimal entry. For full symptom detail, use{" "}
              <button onClick={onClose} className="text-[#4a8a72] font-semibold hover:underline">Today's Log</button>.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
