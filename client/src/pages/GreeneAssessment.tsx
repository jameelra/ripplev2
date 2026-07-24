import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { ClipboardCheck, AlertCircle, History, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVaultStore } from "../stores/vaultStore";
import { useAuth } from "@/contexts/AuthContext";
import { GreeneScoreEntry } from "../../../shared/types";
import {
  GREENE_ITEMS,
  GREENE_RESPONSE_OPTIONS,
  GREENE_SUBSCALE_MAX,
  GreeneSubscale,
  GreeneResponses,
  GreeneResponseValue,
  findMissingItems,
  scoreGreeneClimactericScale,
} from "../../../shared/greeneClimactericScale";
import {
  GREENE_METRIC_CONFIG,
  GreeneMetricKey,
  computeGreeneTrendSummary,
  describeGreeneChange,
} from "../../../shared/greeneTrend";

const GREENE_METRIC_KEYS = Object.keys(GREENE_METRIC_CONFIG) as GreeneMetricKey[];

const SUBSCALE_GROUPS: Array<{ subscales: GreeneSubscale[]; label: string; description: string }> = [
  { subscales: ["anxiety", "depression"], label: "Psychological", description: "Anxiety and mood-related symptoms." },
  { subscales: ["somatic"], label: "Somatic", description: "Physical body symptoms." },
  { subscales: ["vasomotor"], label: "Vasomotor", description: "Hot flushes and night sweats." },
  { subscales: ["sexual"], label: "Sexual Function", description: "Reported on its own, not added to the total score." },
];

function makeEntryId(): string {
  return `greene_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Questionnaire ────────────────────────────────────────────────────────────
function Questionnaire({
  onComplete,
  disabled = false,
}: {
  onComplete: (entry: GreeneScoreEntry) => void;
  disabled?: boolean;
}) {
  const [responses, setResponses] = useState<GreeneResponses>({});
  const [missingWarning, setMissingWarning] = useState<string | null>(null);

  const answered = GREENE_ITEMS.length - findMissingItems(responses).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = findMissingItems(responses);
    if (missing.length > 0) {
      setMissingWarning(`Please answer all 21 questions — ${missing.length} remaining.`);
      document.querySelector(`[data-item-id="${missing[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setMissingWarning(null);
    const score = scoreGreeneClimactericScale(responses);
    onComplete({
      id: makeEntryId(),
      takenAt: new Date().toISOString(),
      total: score.total,
      psychological: score.psychological,
      somatic: score.somatic,
      vasomotor: score.vasomotor,
      sexual: score.sexual,
      // findMissingItems above confirmed all 21 items are answered.
      responses: responses as Record<number, GreeneResponseValue>,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${disabled ? "opacity-60 pointer-events-none" : ""}`} aria-busy={disabled}>
      <div className="sticky top-0 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 py-2.5 bg-white/95 backdrop-blur-sm border-b border-[#f0ebe4] text-xs font-mono text-[#6b7a72]">
        {answered} of {GREENE_ITEMS.length} answered
        <div className="mt-1.5 h-1.5 rounded-full bg-[#e6e0d8] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#4a8a72] transition-[width] duration-200"
            style={{ width: `${Math.round((answered / GREENE_ITEMS.length) * 100)}%` }}
          />
        </div>
      </div>

      {missingWarning && (
        <div className="rounded-xl border border-[#e8d8d0] bg-[#faf5f3] p-3 text-sm text-[#8a4a35]" role="alert">
          {missingWarning}
        </div>
      )}

      {SUBSCALE_GROUPS.map((group) => (
        <div key={group.label} className="space-y-3">
          <div>
            <p className="ripple-label">{group.label}</p>
            <p className="mt-0.5 text-xs text-[#6b7a72]">{group.description}</p>
          </div>
          {GREENE_ITEMS.filter((item) => group.subscales.includes(item.subscale)).map((item) => (
            <div key={item.id} data-item-id={item.id} className="rounded-xl border border-[#e0d5c8] bg-white p-4">
              <p className="flex items-baseline gap-2 text-sm font-semibold text-[#1a2b22]">
                <span className="font-mono text-xs text-[#9a9490]">{item.id}.</span>
                <span>{item.text}</span>
              </p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label={item.text}>
                {GREENE_RESPONSE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 rounded-lg border border-[#e0d5c8] px-3 py-2.5 text-xs text-[#3f4a44] cursor-pointer has-[:checked]:border-[#4a8a72] has-[:checked]:bg-[#eef4f1] has-[:checked]:text-[#1a2b22] transition-colors"
                  >
                    <input
                      type="radio"
                      name={`greene-item-${item.id}`}
                      value={opt.value}
                      checked={responses[item.id] === opt.value}
                      onChange={() => setResponses((prev) => ({ ...prev, [item.id]: opt.value as GreeneResponseValue }))}
                      disabled={disabled}
                      className="accent-[#4a8a72]"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      <Button type="submit" disabled={disabled} className="w-full bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold py-4 rounded-xl">
        See my score
      </Button>
    </form>
  );
}

// ─── Trend chart tooltip ──────────────────────────────────────────────────────
function TrendTooltip({ active, payload, label, max }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#e0d5c8] rounded-xl p-3 shadow-lg text-xs">
        <p className="font-bold text-[#1a2b22] mb-1">{label}</p>
        <p style={{ color: payload[0].color }}>
          <span className="font-bold">{payload[0].value}</span> / {max}
        </p>
      </div>
    );
  }
  return null;
}

// ─── Trend section ────────────────────────────────────────────────────────────
// Minimum-data states per Phase 2: 0 scores renders nothing (the empty-state
// card above already prompts a first assessment); 1 score explains a trend
// needs a second data point; 2+ shows the chart with subscale toggle and
// neutral, factual change-since-previous/first copy — never "improving" or
// "worsening", since this scale measures bother, not disease state.
function GreeneTrendSection({ entries }: { entries: GreeneScoreEntry[] }) {
  const [metric, setMetric] = useState<GreeneMetricKey>("total");

  if (entries.length === 0) return null;

  if (entries.length === 1) {
    const [entry] = entries;
    return (
      <div className="ripple-card p-5 space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#4a8a72]" />
          <p className="ripple-label">Trend</p>
        </div>
        <p className="text-sm text-[#3f4a44]">
          Your first score is <span className="font-bold">{entry.total}/{GREENE_SUBSCALE_MAX.total}</span>, taken{" "}
          {format(parseISO(entry.takenAt), "MMMM d, yyyy")}.
        </p>
        <p className="text-xs text-[#6b7a72] leading-relaxed">
          A trend appears once you complete a second assessment — there's nothing to compare yet. A retake every 30
          days is a reasonable cadence for spotting a trend, though there's no strict rule.
        </p>
      </div>
    );
  }

  const summary = computeGreeneTrendSummary(entries, metric);
  const config = GREENE_METRIC_CONFIG[metric];
  const chartData = summary.points.map((p) => ({
    date: format(parseISO(p.takenAt), "MMM d"),
    value: p.value,
  }));

  return (
    <div className="ripple-card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#4a8a72]" />
          <div>
            <p className="ripple-label">Trend</p>
            <p className="font-serif text-base font-bold text-[#1a2b22]">{config.label} score over time</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 bg-[#f5f0ea] p-1 rounded-xl">
          {GREENE_METRIC_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all ${
                metric === key ? "bg-white text-[#1a2b22] shadow-sm" : "text-[#6b7a72] hover:text-[#1a2b22]"
              }`}
            >
              {GREENE_METRIC_CONFIG[key].label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe4" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9a9490" }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, config.max]} tick={{ fontSize: 10, fill: "#9a9490" }} tickLine={false} axisLine={false} />
          <Tooltip content={<TrendTooltip max={config.max} />} />
          <Line
            type="monotone"
            dataKey="value"
            name={config.label}
            stroke="#4a8a72"
            strokeWidth={2}
            dot={{ r: 3, fill: "#4a8a72" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="space-y-1.5 text-xs text-[#3f4a44] border-t border-[#f0ebe4] pt-3">
        {summary.sincePrevious && (
          <p>
            {describeGreeneChange(
              summary.sincePrevious.delta,
              `your previous assessment (${format(parseISO(summary.sincePrevious.referenceTakenAt), "MMMM d, yyyy")})`
            )}
          </p>
        )}
        {summary.sinceFirst && (
          <p>
            {describeGreeneChange(
              summary.sinceFirst.delta,
              `your first assessment (${format(parseISO(summary.sinceFirst.referenceTakenAt), "MMMM d, yyyy")})`
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── History list ─────────────────────────────────────────────────────────────
function HistoryList({ entries }: { entries: GreeneScoreEntry[] }) {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.takenAt.localeCompare(a.takenAt)),
    [entries]
  );

  if (sorted.length === 0) {
    return (
      <div className="ripple-card p-6 text-center space-y-2">
        <History className="w-8 h-8 text-[#c8c0b8] mx-auto" />
        <p className="text-sm text-[#6b7a72]">No assessments recorded yet. Complete the questionnaire above to start your history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((entry) => (
        <div key={entry.id} className="ripple-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6b7a72]">
              {new Date(entry.takenAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="font-serif text-xl font-bold text-[#1a2b22]">
              {entry.total}
              <span className="text-xs font-sans font-normal text-[#6b7a72] ml-1">/{GREENE_SUBSCALE_MAX.total}</span>
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Psych.", value: entry.psychological, max: GREENE_SUBSCALE_MAX.psychological },
              { label: "Somatic", value: entry.somatic, max: GREENE_SUBSCALE_MAX.somatic },
              { label: "Vasomotor", value: entry.vasomotor, max: GREENE_SUBSCALE_MAX.vasomotor },
              { label: "Sexual", value: entry.sexual, max: GREENE_SUBSCALE_MAX.sexual },
            ].map((s) => (
              <div key={s.label} className="bg-[#f5f0ea] rounded-xl p-2">
                <p className="text-[9px] font-mono uppercase tracking-wider text-[#9a9490] font-bold">{s.label}</p>
                <p className="text-sm font-bold text-[#1a2b22]">
                  {s.value}
                  <span className="text-[10px] font-sans text-[#9a9490]">/{s.max}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GreeneAssessment() {
  const { greeneScores, addGreeneScore, setToastNotification } = useVaultStore();
  const { user, openAuthModal } = useAuth();
  const [isAssessing, setIsAssessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleComplete = async (entry: GreeneScoreEntry) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await addGreeneScore(entry);
      setIsAssessing(false);
      setToastNotification({
        type: "success",
        title: "Assessment saved",
        description: `Total score ${entry.total}/${GREENE_SUBSCALE_MAX.total} — added to your history.`,
      });
    } catch (error) {
      console.error("[GreeneAssessment] Failed to save score:", error);
      setSaveError("Couldn't save your assessment — check your connection and try again. Your answers are still on this screen.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="ripple-section-title">Greene Climacteric Scale</h1>
        <p className="text-sm text-[#6b7a72] mt-1">
          The validated 21-item questionnaire, tracked over time — each completion is saved as a new entry in your history.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          This measures symptom severity, not a diagnosis. There's no pass/fail score — it's designed to show how your
          symptoms change over time.
        </p>
      </div>

      {!isAssessing ? (
        <div className="ripple-card p-6 text-center space-y-3">
          <ClipboardCheck className="w-9 h-9 text-[#4a8a72] mx-auto" />
          <div>
            <p className="font-serif text-base font-bold text-[#1a2b22]">
              {greeneScores.length === 0 ? "Take your first assessment" : "Ready for your next assessment?"}
            </p>
            <p className="text-xs text-[#6b7a72] max-w-sm mx-auto leading-relaxed mt-1">
              21 questions, about five minutes. {greeneScores.length > 0 && "A retake every 30 days is a reasonable cadence for spotting a trend, though there's no strict rule."}
            </p>
          </div>
          <Button
            onClick={() => (user ? setIsAssessing(true) : openAuthModal())}
            className="bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold px-6 py-3 rounded-xl"
          >
            Start Assessment →
          </Button>
          {!user && <p className="text-[10px] text-[#9a9490]">Sign in to save your history across sessions.</p>}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key="questionnaire" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            {saveError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {saveError}
              </div>
            )}
            <Questionnaire onComplete={handleComplete} disabled={isSaving} />
          </motion.div>
        </AnimatePresence>
      )}

      <GreeneTrendSection entries={greeneScores} />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#4a8a72]" />
          <p className="ripple-label">History ({greeneScores.length})</p>
        </div>
        <HistoryList entries={greeneScores} />
      </div>
    </div>
  );
}
