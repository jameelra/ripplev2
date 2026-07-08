import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Plus, Trash2, CheckCircle2, AlertCircle, BarChart2,
  FlaskConical, TrendingDown, TrendingUp, Minus, Clock, X,
  ChevronRight, Info, Sparkles, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVaultStore } from "../stores/vaultStore";
import {
  TriggerEntry,
  TriggerExperiment,
  TriggerCorrelation,
  PRESET_TRIGGERS,
  TRIGGER_CATEGORY_LABELS,
  TriggerCategory,
  SYMPTOM_LABELS,
  SymptomLog,
} from "../../../shared/types";

const TODAY = new Date().toISOString().split("T")[0];

// ─── Category colour map ──────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<TriggerCategory, { bg: string; text: string; border: string }> = {
  dietary:       { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  lifestyle:     { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  environmental: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  hormonal:      { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  social:        { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200" },
  custom:        { bg: "bg-[#f5f0ea]",  text: "text-[#6b7a72]",  border: "border-[#e0d5c8]" },
};

// ─── Confidence badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ level }: { level: TriggerCorrelation["confidence"] }) {
  const styles = {
    strong:             "bg-red-50 text-red-700 border-red-200",
    moderate:           "bg-amber-50 text-amber-700 border-amber-200",
    possible:           "bg-blue-50 text-blue-700 border-blue-200",
    insufficient_data:  "bg-[#f5f0ea] text-[#9a9490] border-[#e0d5c8]",
  };
  const labels = {
    strong: "Strong", moderate: "Moderate", possible: "Possible", insufficient_data: "Insufficient data",
  };
  return (
    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

// ─── Effect bar ───────────────────────────────────────────────────────────────
function EffectBar({ value, max = 3 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.abs(value) / max * 100);
  const isPositive = value > 0; // positive = worsens symptom
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#f0ebe4] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isPositive ? "bg-red-400" : "bg-emerald-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold font-mono w-10 text-right ${isPositive ? "text-red-600" : "text-emerald-600"}`}>
        {isPositive ? "+" : ""}{value.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Correlation Card ─────────────────────────────────────────────────────────
function CorrelationCard({ corr, onStartExperiment }: { corr: TriggerCorrelation; onStartExperiment: (corr: TriggerCorrelation) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isHarmful = corr.combinedEffect > 0;

  return (
    <div className="ripple-card overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 hover:bg-[#faf8f5] transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#1a2b22]">{corr.triggerName}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#9a9490]" />
              <span className="text-sm text-[#4a4a42]">{corr.symptomLabel}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ConfidenceBadge level={corr.confidence} />
              <span className={`text-[10px] font-mono font-bold ${isHarmful ? "text-red-600" : "text-emerald-600"}`}>
                {isHarmful ? "↑" : "↓"} {Math.abs(corr.combinedEffect).toFixed(1)} pts combined effect
              </span>
              <span className="text-[10px] text-[#9a9490]">{corr.occurrenceCount} observations</span>
            </div>
          </div>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isHarmful ? "bg-red-50" : "bg-emerald-50"}`}>
            {isHarmful ? <TrendingUp className="w-4 h-4 text-red-500" /> : <TrendingDown className="w-4 h-4 text-emerald-500" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-[#f0ebe4]">
            <div className="p-4 space-y-4">
              {/* Effect breakdown */}
              <div className="space-y-2">
                <p className="ripple-label">Effect on {corr.symptomLabel}</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] text-[#6b7a72]">Same-day effect</p>
                      <p className="text-[10px] text-[#9a9490]">avg {corr.avgSeverityWithTrigger.toFixed(1)} vs {corr.avgSeverityWithoutTrigger.toFixed(1)} without</p>
                    </div>
                    <EffectBar value={corr.sameDayDifference} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] text-[#6b7a72]">Next-day effect (24hr lag)</p>
                      <p className="text-[10px] text-[#9a9490]">avg {corr.nextDayAvgWithTrigger.toFixed(1)} vs {corr.nextDayAvgWithoutTrigger.toFixed(1)} without</p>
                    </div>
                    <EffectBar value={corr.nextDayDifference} />
                  </div>
                </div>
              </div>

              {/* Insight text */}
              <div className="bg-[#f5f0ea] rounded-xl p-3">
                <p className="text-xs text-[#3a3a32] leading-relaxed">
                  {isHarmful
                    ? `On days you logged <strong>${corr.triggerName}</strong>, your <strong>${corr.symptomLabel}</strong> severity was <strong>${corr.sameDayDifference > 0 ? corr.sameDayDifference.toFixed(1) : "0"} points higher</strong> that day and <strong>${corr.nextDayDifference > 0 ? corr.nextDayDifference.toFixed(1) : "0"} points higher</strong> the following day.`
                    : `On days you logged <strong>${corr.triggerName}</strong>, your <strong>${corr.symptomLabel}</strong> was actually lower — this may be a protective factor.`
                  }
                </p>
              </div>

              {/* Start experiment CTA */}
              {isHarmful && (
                <Button
                  onClick={() => onStartExperiment(corr)}
                  variant="outline"
                  className="w-full text-xs font-mono border-[#c8d8d0] text-[#4a8a72] hover:bg-[#eef4f1]"
                >
                  <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
                  Start 14-Day Elimination Experiment
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Experiment Card ──────────────────────────────────────────────────────────
function ExperimentCard({
  exp,
  logs,
  onComplete,
  onAbandon,
  onDelete,
}: {
  exp: TriggerExperiment;
  logs: import("../../../shared/types").DayLog[];
  onComplete: (exp: TriggerExperiment) => void;
  onAbandon: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const today = TODAY;
  const daysElapsed = Math.max(0, Math.ceil((new Date(today + "T12:00:00").getTime() - new Date(exp.startDate + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, exp.durationDays - daysElapsed);
  const progressPct = Math.min(100, (daysElapsed / exp.durationDays) * 100);
  const isComplete = exp.status === "completed";
  const isAbandoned = exp.status === "abandoned";

  return (
    <div className={`ripple-card p-4 space-y-3 ${isAbandoned ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold ${
              isComplete ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              isAbandoned ? "bg-[#f5f0ea] text-[#9a9490] border-[#e0d5c8]" :
              "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {isComplete ? "Completed" : isAbandoned ? "Abandoned" : `Day ${daysElapsed} of ${exp.durationDays}`}
            </span>
          </div>
          <p className="font-serif text-sm font-bold text-[#1a2b22]">{exp.hypothesis}</p>
          <p className="text-[10px] text-[#9a9490]">
            Tracking: {exp.targetSymptomLabel} · Started {exp.startDate}
          </p>
        </div>
        <button onClick={() => onDelete(exp.id)} className="p-1.5 text-[#c8c0b8] hover:text-red-400 transition-colors shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      {!isComplete && !isAbandoned && (
        <div className="space-y-1.5">
          <div className="w-full h-2 bg-[#f0ebe4] rounded-full overflow-hidden">
            <div className="h-full bg-[#4a8a72] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#9a9490]">
            <span>{daysElapsed} days elapsed</span>
            <span>{daysRemaining} days remaining</span>
          </div>
        </div>
      )}

      {/* Results */}
      {isComplete && exp.changePercent !== undefined && (
        <div className={`rounded-xl p-3 ${exp.changePercent < -10 ? "bg-emerald-50 border border-emerald-200" : exp.changePercent > 10 ? "bg-red-50 border border-red-200" : "bg-[#f5f0ea] border border-[#e0d5c8]"}`}>
          <p className="text-xs font-bold text-[#1a2b22] mb-1">Experiment Result</p>
          <p className="text-xs text-[#3a3a32] leading-relaxed">{exp.conclusion}</p>
          {exp.changePercent !== undefined && (
            <p className={`text-sm font-bold mt-2 ${exp.changePercent < 0 ? "text-emerald-700" : "text-red-600"}`}>
              {exp.changePercent < 0 ? "↓" : "↑"} {Math.abs(exp.changePercent).toFixed(0)}% change in {exp.targetSymptomLabel}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {!isComplete && !isAbandoned && daysElapsed >= exp.durationDays && (
        <Button onClick={() => onComplete(exp)} className="w-full bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold rounded-xl py-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Complete Experiment
        </Button>
      )}
      {!isComplete && !isAbandoned && daysElapsed < exp.durationDays && (
        <button onClick={() => onAbandon(exp.id)} className="text-xs text-[#9a9490] hover:text-[#6b7a72] font-mono">
          Abandon experiment →
        </button>
      )}
    </div>
  );
}

// ─── Start Experiment Form ────────────────────────────────────────────────────
function StartExperimentForm({
  prefill,
  onSave,
  onCancel,
}: {
  prefill?: TriggerCorrelation;
  onSave: (exp: TriggerExperiment) => void;
  onCancel: () => void;
}) {
  const symptomKeys = Object.keys(SYMPTOM_LABELS) as (keyof SymptomLog)[];
  const [triggerId, setTriggerId] = useState(prefill?.triggerId ?? "");
  const [triggerName, setTriggerName] = useState(prefill?.triggerName ?? "");
  const [hypothesis, setHypothesis] = useState(
    prefill ? `Eliminating ${prefill.triggerName} will reduce my ${prefill.symptomLabel}` : ""
  );
  const [targetSymptomKey, setTargetSymptomKey] = useState<keyof SymptomLog>(prefill?.symptomKey ?? "hotFlashes");
  const [durationDays, setDurationDays] = useState(14);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!triggerName.trim()) { setError("Please enter a trigger name."); return; }
    if (!hypothesis.trim()) { setError("Please enter a hypothesis."); return; }
    const now = new Date().toISOString();
    const endDate = new Date(TODAY + "T12:00:00");
    endDate.setDate(endDate.getDate() + durationDays);
    const exp: TriggerExperiment = {
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      triggerId: triggerId || triggerName.toLowerCase().replace(/\s+/g, "_"),
      triggerName: triggerName.trim(),
      hypothesis: hypothesis.trim(),
      targetSymptomKey,
      targetSymptomLabel: SYMPTOM_LABELS[targetSymptomKey],
      startDate: TODAY,
      durationDays,
      endDate: endDate.toISOString().split("T")[0],
      status: "active",
      createdAt: now,
    };
    onSave(exp);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-serif text-base font-bold text-[#1a2b22]">Start an Experiment</p>
        <button onClick={onCancel} className="p-1.5 text-[#9a9490] hover:text-[#1a2b22] hover:bg-[#f5f0ea] rounded-lg transition">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-[#6b7a72] leading-relaxed">
        Formally test whether eliminating a trigger reduces your symptoms. Log for {durationDays} days, then Ripple will compare your results.
      </p>

      <div className="space-y-1">
        <label className="ripple-label">Trigger to eliminate</label>
        <Input value={triggerName} onChange={(e) => setTriggerName(e.target.value)} placeholder="e.g. Alcohol, Caffeine, Sugar" className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]" />
      </div>

      <div className="space-y-1">
        <label className="ripple-label">Your hypothesis</label>
        <textarea
          value={hypothesis}
          onChange={(e) => setHypothesis(e.target.value)}
          rows={2}
          className="w-full bg-[#f5f0ea] border border-[#e0d5c8] rounded-xl p-3.5 text-sm text-[#1a2b22] placeholder-[#9a9490] resize-none focus:outline-none focus:border-[#4a8a72]/50 leading-relaxed"
          placeholder="e.g. Eliminating alcohol will reduce my hot flashes"
        />
      </div>

      <div className="space-y-1">
        <label className="ripple-label">Symptom to track</label>
        <select
          value={targetSymptomKey}
          onChange={(e) => setTargetSymptomKey(e.target.value as keyof SymptomLog)}
          className="w-full bg-[#f5f0ea] border border-[#e0d5c8] rounded-xl p-3 text-sm text-[#1a2b22] focus:outline-none focus:border-[#4a8a72]/50"
        >
          {symptomKeys.map((k) => (
            <option key={k} value={k}>{SYMPTOM_LABELS[k]}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="ripple-label">Duration</label>
        <div className="flex gap-2">
          {[7, 14, 21, 28].map((d) => (
            <button
              key={d}
              onClick={() => setDurationDays(d)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                durationDays === d ? "bg-[#4a8a72] text-white border-[#4a8a72]" : "bg-[#f5f0ea] text-[#6b7a72] border-[#e0d5c8] hover:border-[#c8d8d0]"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1 text-xs font-mono border-[#e0d5c8] text-[#6b7a72]">Cancel</Button>
        <Button onClick={handleSave} className="flex-1 bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold rounded-xl">
          <FlaskConical className="w-3.5 h-3.5 mr-1.5" /> Start Experiment
        </Button>
      </div>
    </div>
  );
}

// ─── Main TriggerTracker Page ─────────────────────────────────────────────────
export default function TriggerTracker() {
  const {
    logs, triggerAnalysis, triggerExperiments,
    saveLog, addTriggerExperiment, updateTriggerExperiment, removeTriggerExperiment,
    setToastNotification, setActiveTab,
  } = useVaultStore();

  const [activeView, setActiveView] = useState<"today" | "insights" | "experiments">("today");
  const [showExperimentForm, setShowExperimentForm] = useState(false);
  const [experimentPrefill, setExperimentPrefill] = useState<TriggerCorrelation | undefined>();
  const [customTriggerInput, setCustomTriggerInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Today's log trigger state
  const todayLog = logs.find((l) => l.id === TODAY);
  const todayTriggers: TriggerEntry[] = todayLog?.triggers?.triggers ?? [];
  const prevDayTriggers: TriggerEntry[] = todayLog?.triggers?.previousDayTriggers ?? [];

  const isTriggerLogged = (id: string) => todayTriggers.some((t) => t.id === id);
  const isPrevDayLogged = (id: string) => prevDayTriggers.some((t) => t.id === id);

  const handleToggleTrigger = async (trigger: TriggerEntry, isPrevDay = false) => {
    const base = todayLog ?? {
      id: TODAY,
      date: TODAY,
      symptoms: { hotFlashes: 0, nightSweats: 0, sleepLatency: 0, jointPain: 0, brainFog: 0, irritability: 0, anxiety: 0, fatigue: 0, heartPalpitations: 0, breastTenderness: 0, bloating: 0, postCarbCrash: 0 },
      signals: { sleepDuration: 7, sleepEfficiency: 85, hrv: 55, restingHeartRate: 68 },
      cycle: { cycleActive: false, spotting: false },
      diaryText: "",
      timestamp: new Date().toISOString(),
    };

    const currentTriggers = base.triggers?.triggers ?? [];
    const currentPrevDay = base.triggers?.previousDayTriggers ?? [];

    let newTriggers: TriggerEntry[];
    let newPrevDay: TriggerEntry[];

    if (isPrevDay) {
      newTriggers = currentTriggers;
      newPrevDay = isPrevDayLogged(trigger.id)
        ? currentPrevDay.filter((t) => t.id !== trigger.id)
        : [...currentPrevDay, trigger];
    } else {
      newTriggers = isTriggerLogged(trigger.id)
        ? currentTriggers.filter((t) => t.id !== trigger.id)
        : [...currentTriggers, trigger];
      newPrevDay = currentPrevDay;
    }

    await saveLog({
      ...base,
      triggers: {
        date: TODAY,
        triggers: newTriggers,
        previousDayTriggers: newPrevDay,
      },
    });
  };

  const handleAddCustomTrigger = async () => {
    if (!customTriggerInput.trim()) return;
    const trigger: TriggerEntry = {
      id: `custom_${customTriggerInput.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
      name: customTriggerInput.trim(),
      category: "custom",
      isCustom: true,
    };
    await handleToggleTrigger(trigger);
    setCustomTriggerInput("");
    setShowCustomInput(false);
    setToastNotification({ type: "success", title: "Custom Trigger Added", description: `"${trigger.name}" logged for today.` });
  };

  const handleStartExperiment = async (exp: TriggerExperiment) => {
    await addTriggerExperiment(exp);
    setShowExperimentForm(false);
    setExperimentPrefill(undefined);
    setToastNotification({
      type: "success",
      title: "Experiment Started!",
      description: `Your ${exp.durationDays}-day experiment begins today. Log your symptoms daily for the best results.`,
    });
    setActiveView("experiments");
  };

  const handleCompleteExperiment = async (exp: TriggerExperiment) => {
    // Compute results from logs during experiment period
    const expLogs = logs.filter((l) => l.date >= exp.startDate && l.date <= exp.endDate);
    const beforeLogs = logs.filter((l) => l.date < exp.startDate).slice(-exp.durationDays);

    const mean = (vals: number[]) => vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const beforeAvg = mean(beforeLogs.map((l) => l.symptoms[exp.targetSymptomKey] as number));
    const expAvg = mean(expLogs.map((l) => l.symptoms[exp.targetSymptomKey] as number));
    const changePercent = beforeAvg > 0 ? Math.round(((expAvg - beforeAvg) / beforeAvg) * 100) : 0;

    const conclusion = changePercent < -20
      ? `Eliminating ${exp.triggerName} produced a significant ${Math.abs(changePercent)}% reduction in your ${exp.targetSymptomLabel}. Strong evidence that ${exp.triggerName} is a trigger for you.`
      : changePercent < -5
      ? `Eliminating ${exp.triggerName} produced a modest ${Math.abs(changePercent)}% reduction in your ${exp.targetSymptomLabel}. Consider continuing the elimination.`
      : changePercent > 10
      ? `Your ${exp.targetSymptomLabel} was slightly higher during the experiment. ${exp.triggerName} may not be the main driver.`
      : `No significant change detected. ${exp.triggerName} may not be a major trigger for your ${exp.targetSymptomLabel}.`;

    const completed: TriggerExperiment = {
      ...exp,
      status: "completed",
      baselineAvgSeverity: Math.round(beforeAvg * 100) / 100,
      experimentAvgSeverity: Math.round(expAvg * 100) / 100,
      changePercent,
      conclusion,
      completedAt: new Date().toISOString(),
    };
    await updateTriggerExperiment(completed);
    setToastNotification({ type: "success", title: "Experiment Complete!", description: conclusion });
  };

  const handleAbandonExperiment = async (id: string) => {
    const exp = triggerExperiments.find((e) => e.id === id);
    if (!exp) return;
    await updateTriggerExperiment({ ...exp, status: "abandoned" });
    setToastNotification({ type: "info", title: "Experiment Abandoned", description: "You can start a new experiment anytime." });
  };

  const handleDeleteExperiment = async (id: string) => {
    if (!confirm("Delete this experiment record?")) return;
    await removeTriggerExperiment(id);
  };

  const activeExperiments = triggerExperiments.filter((e) => e.status === "active");
  const completedExperiments = triggerExperiments.filter((e) => e.status === "completed");
  const abandonedExperiments = triggerExperiments.filter((e) => e.status === "abandoned");

  // Group preset triggers by category
  const triggersByCategory = PRESET_TRIGGERS.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<TriggerCategory, TriggerEntry[]>);

  if (showExperimentForm) {
    return (
      <div className="space-y-5">
        <StartExperimentForm
          prefill={experimentPrefill}
          onSave={handleStartExperiment}
          onCancel={() => { setShowExperimentForm(false); setExperimentPrefill(undefined); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="ripple-section-title">Trigger Tracker</h1>
        <p className="text-sm text-[#6b7a72] mt-1">
          Discover what makes your symptoms better or worse
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Correlations are observational.</strong> Log at least 14 days of triggers alongside symptoms to unlock insights. Correlations do not prove causation — always discuss patterns with your doctor.
        </p>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-[#f5f0ea] p-1 rounded-xl">
        {([
          { id: "today" as const, label: "Today", icon: Zap },
          { id: "insights" as const, label: `Insights${triggerAnalysis?.minimumDataMet ? ` (${triggerAnalysis.topTriggers.length})` : ""}`, icon: BarChart2 },
          { id: "experiments" as const, label: `Experiments${activeExperiments.length > 0 ? ` (${activeExperiments.length})` : ""}`, icon: FlaskConical },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              activeView === id ? "bg-white text-[#1a2b22] shadow-sm" : "text-[#6b7a72] hover:text-[#1a2b22]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* TODAY VIEW */}
      {activeView === "today" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6b7a72]">
              Tap to log triggers for today · {todayTriggers.length} logged
            </p>
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="text-xs text-[#4a8a72] font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Custom
            </button>
          </div>

          {/* Custom trigger input */}
          <AnimatePresence>
            {showCustomInput && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex gap-2">
                <Input
                  value={customTriggerInput}
                  onChange={(e) => setCustomTriggerInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomTrigger()}
                  placeholder="Enter custom trigger…"
                  className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22] text-sm"
                  autoFocus
                />
                <Button onClick={handleAddCustomTrigger} className="bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs shrink-0">Add</Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trigger chips by category */}
          {(Object.entries(triggersByCategory) as [TriggerCategory, TriggerEntry[]][]).map(([category, triggers]) => (
            <div key={category} className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">{TRIGGER_CATEGORY_LABELS[category]}</p>
              <div className="flex flex-wrap gap-2">
                {triggers.map((trigger) => {
                  const logged = isTriggerLogged(trigger.id);
                  const styles = CATEGORY_STYLES[trigger.category];
                  return (
                    <button
                      key={trigger.id}
                      onClick={() => handleToggleTrigger(trigger)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        logged
                          ? `${styles.bg} ${styles.text} ${styles.border} ring-2 ring-offset-1 ring-current/30`
                          : "bg-[#f5f0ea] text-[#6b7a72] border-[#e0d5c8] hover:border-[#c8d8d0]"
                      }`}
                    >
                      {logged && <CheckCircle2 className="w-3 h-3" />}
                      {trigger.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Previous day triggers */}
          <div className="space-y-2 border-t border-[#f0ebe4] pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#9a9490]" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">Yesterday's triggers (for next-day analysis)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_TRIGGERS.filter((t) => ["alcohol", "caffeine", "poor_sleep", "high_stress", "sugar"].includes(t.id)).map((trigger) => {
                const logged = isPrevDayLogged(trigger.id);
                return (
                  <button
                    key={trigger.id}
                    onClick={() => handleToggleTrigger(trigger, true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      logged ? "bg-[#f5f0ea] text-[#1a2b22] border-[#c8d8d0]" : "bg-white text-[#9a9490] border-[#e0d5c8] hover:border-[#c8d8d0]"
                    }`}
                  >
                    {logged && <CheckCircle2 className="w-3 h-3 text-[#4a8a72]" />}
                    {trigger.name}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-[#9a9490] leading-relaxed">
              Many triggers (alcohol, poor sleep) affect symptoms the following day. Log yesterday's triggers for more accurate correlation analysis.
            </p>
          </div>

          {/* Progress to insights */}
          {!triggerAnalysis?.minimumDataMet && (
            <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4a8a72]" />
                <p className="text-xs font-bold text-[#1a2b22]">Building your trigger profile…</p>
              </div>
              <div className="w-full h-1.5 bg-[#c8d8d0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4a8a72] rounded-full"
                  style={{ width: `${Math.min(100, ((triggerAnalysis?.dataPointsAnalysed ?? 0) / 14) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-[#6b7a72]">
                {triggerAnalysis?.dataPointsAnalysed ?? 0}/14 days with triggers logged. Insights unlock at 14 days.
              </p>
            </div>
          )}
        </div>
      )}

      {/* INSIGHTS VIEW */}
      {activeView === "insights" && (
        <div className="space-y-4">
          {!triggerAnalysis?.minimumDataMet ? (
            <div className="ripple-card p-6 text-center space-y-3">
              <BarChart2 className="w-8 h-8 text-[#c8c0b8] mx-auto" />
              <p className="font-serif text-sm font-bold text-[#1a2b22]">Insights not yet available</p>
              <p className="text-xs text-[#6b7a72] leading-relaxed max-w-xs mx-auto">
                Log triggers alongside your symptoms for at least 14 days. You have {triggerAnalysis?.dataPointsAnalysed ?? 0} days so far.
              </p>
              <Button onClick={() => setActiveView("today")} variant="outline" className="text-xs font-mono border-[#c8d8d0] text-[#4a8a72]">
                Log Today's Triggers →
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#9a9490] font-mono">
                  {triggerAnalysis.correlations.length} correlation{triggerAnalysis.correlations.length !== 1 ? "s" : ""} found · {triggerAnalysis.dataPointsAnalysed} days analysed
                </p>
              </div>
              {triggerAnalysis.correlations.length === 0 ? (
                <div className="ripple-card p-6 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#4a8a72] mx-auto" />
                  <p className="text-sm font-bold text-[#1a2b22]">No significant correlations found</p>
                  <p className="text-xs text-[#6b7a72]">Your logged triggers don't appear to significantly affect your symptoms. Keep logging to build a more complete picture.</p>
                </div>
              ) : (
                triggerAnalysis.correlations.map((corr, i) => (
                  <CorrelationCard
                    key={`${corr.triggerId}_${corr.symptomKey}`}
                    corr={corr}
                    onStartExperiment={(c) => {
                      setExperimentPrefill(c);
                      setShowExperimentForm(true);
                    }}
                  />
                ))
              )}
            </>
          )}
        </div>
      )}

      {/* EXPERIMENTS VIEW */}
      {activeView === "experiments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6b7a72]">Formally test whether eliminating a trigger reduces your symptoms.</p>
            <Button
              onClick={() => setShowExperimentForm(true)}
              className="bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold px-3 py-2 rounded-xl shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New
            </Button>
          </div>

          {triggerExperiments.length === 0 ? (
            <div className="ripple-card p-8 text-center space-y-3">
              <div className="w-14 h-14 bg-[#f5f0ea] rounded-2xl flex items-center justify-center mx-auto text-2xl">🧪</div>
              <div>
                <p className="font-serif text-base font-bold text-[#1a2b22]">No experiments yet</p>
                <p className="text-xs text-[#6b7a72] max-w-sm mx-auto leading-relaxed mt-1">
                  Start a 14-day experiment to formally test whether eliminating a trigger (like alcohol or caffeine) reduces your symptoms.
                </p>
              </div>
              <Button onClick={() => setShowExperimentForm(true)} className="bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold px-6 py-3 rounded-xl">
                <FlaskConical className="w-4 h-4 mr-1.5" /> Start Your First Experiment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeExperiments.length > 0 && (
                <div className="space-y-2">
                  <p className="ripple-label text-amber-700">Active ({activeExperiments.length})</p>
                  {activeExperiments.map((exp) => (
                    <ExperimentCard key={exp.id} exp={exp} logs={logs} onComplete={handleCompleteExperiment} onAbandon={handleAbandonExperiment} onDelete={handleDeleteExperiment} />
                  ))}
                </div>
              )}
              {completedExperiments.length > 0 && (
                <div className="space-y-2">
                  <p className="ripple-label text-emerald-700">Completed ({completedExperiments.length})</p>
                  {completedExperiments.map((exp) => (
                    <ExperimentCard key={exp.id} exp={exp} logs={logs} onComplete={handleCompleteExperiment} onAbandon={handleAbandonExperiment} onDelete={handleDeleteExperiment} />
                  ))}
                </div>
              )}
              {abandonedExperiments.length > 0 && (
                <div className="space-y-2">
                  <p className="ripple-label text-[#9a9490]">Abandoned ({abandonedExperiments.length})</p>
                  {abandonedExperiments.map((exp) => (
                    <ExperimentCard key={exp.id} exp={exp} logs={logs} onComplete={handleCompleteExperiment} onAbandon={handleAbandonExperiment} onDelete={handleDeleteExperiment} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
