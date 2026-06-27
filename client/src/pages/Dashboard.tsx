import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink } from "lucide-react";
import { WIKI_PAGES } from "../lib/wikiLinks";
import BiologicalCorrelations from "../components/BiologicalCorrelations";
import SymptomHeatmap from "../components/SymptomHeatmap";
import {
  Activity, Flame, Moon, Heart, Zap, TrendingUp, TrendingDown,
  Minus, Calendar, Award, AlertCircle, CheckCircle2, BarChart2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from "recharts";
import { useVaultStore } from "../stores/vaultStore";
import { DayLog, SYMPTOM_LABELS } from "../../../shared/types";
import { format, subDays, parseISO } from "date-fns";

// ─── PSS Calculation ──────────────────────────────────────────────────────────
function calculatePSS(logs: DayLog[]): number {
  if (logs.length === 0) return 0;
  const recent = logs.slice(-14);
  let total = 0;
  let count = 0;
  recent.forEach((log) => {
    const s = log.symptoms;
    const dayScore = Object.values(s).reduce((a, b) => a + b, 0);
    total += dayScore;
    count++;
  });
  // Max possible per day = 12 symptoms × 3 = 36
  return Math.min(100, Math.round((total / (count * 36)) * 100));
}

function getPSSLabel(score: number): { label: string; color: string; bg: string } {
  if (score < 20) return { label: "Minimal", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  if (score < 40) return { label: "Mild", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  if (score < 60) return { label: "Moderate", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
  if (score < 80) return { label: "Significant", color: "text-red-600", bg: "bg-red-50 border-red-200" };
  return { label: "Severe", color: "text-red-800", bg: "bg-red-100 border-red-300" };
}

function calculateStreak(logs: DayLog[]): number {
  if (logs.length === 0) return 0;
  const today = new Date().toISOString().split("T")[0];
  const logDates = new Set(logs.map((l) => l.id));
  let streak = 0;
  let current = today;
  while (logDates.has(current)) {
    streak++;
    const d = new Date(current);
    d.setDate(d.getDate() - 1);
    current = d.toISOString().split("T")[0];
  }
  return streak;
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  color = "text-[#4a8a72]",
  bg = "bg-[#eef4f1]",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  color?: string;
  bg?: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <div className="ripple-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
        {trend && (
          <TrendIcon
            className={`w-4 h-4 ${
              trend === "up" ? "text-red-400" : trend === "down" ? "text-emerald-500" : "text-gray-400"
            }`}
          />
        )}
      </div>
      <div>
        <p className="ripple-label">{label}</p>
        <p className="font-serif text-2xl font-bold text-[#1a2b22] mt-0.5">
          {value}
          {unit && <span className="text-sm font-sans font-normal text-[#6b7a72] ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#e0d5c8] rounded-xl p-3 shadow-lg text-xs">
        <p className="font-bold text-[#1a2b22] mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { logs, hrtMedications, hrtDoseLogs, triggerAnalysis, menopauseMode, surgeryDate, setActiveTab } = useVaultStore();
  const todayStr = new Date().toISOString().split("T")[0];
  const todayDayOfWeek = new Date().getDay();

  const hrtDueToday = hrtMedications.filter((med) => {
    if (!med.isActive) return false;
    const takenToday = hrtDoseLogs.some((d) => d.medicationId === med.id && d.scheduledDate === todayStr && !d.skipped);
    if (takenToday) return false;
    switch (med.scheduleType) {
      case "daily": return true;
      case "days_of_week": return med.daysOfWeek?.includes(todayDayOfWeek) ?? false;
      case "every_n_days": {
        if (!med.intervalDays) return false;
        const start = new Date(med.startDate + "T12:00:00");
        const diff = Math.round((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diff % Math.round(med.intervalDays) === 0;
      }
      default: return false;
    }
  });

  const pssScore = useMemo(() => calculatePSS(logs), [logs]);
  const pssInfo = getPSSLabel(pssScore);
  const streak = useMemo(() => calculateStreak(logs), [logs]);

  // Last 14 days chart data
  const chartData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i);
      const dateStr = date.toISOString().split("T")[0];
      const log = logs.find((l) => l.id === dateStr);
      const severity = log
        ? Math.round(Object.values(log.symptoms).reduce((a, b) => a + b, 0) / 12)
        : null;
      return {
        date: format(date, "MMM d"),
        severity,
        sleep: log?.signals?.sleepDuration ?? null,
        hrv: log?.signals?.hrv ?? null,
      };
    });
    return days;
  }, [logs]);

  // Latest log stats
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const avgSleep = latestLog?.signals?.sleepDuration ?? null;
  const avgHRV = latestLog?.signals?.hrv ?? null;
  const avgHR = latestLog?.signals?.restingHeartRate ?? null;

  // Top symptoms from recent logs
  const topSymptoms = useMemo(() => {
    if (logs.length === 0) return [];
    const recent = logs.slice(-7);
    const totals: Record<string, number> = {};
    recent.forEach((log) => {
      Object.entries(log.symptoms).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + v;
      });
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({
        key: k,
        label: SYMPTOM_LABELS[k as keyof typeof SYMPTOM_LABELS] || k,
        avg: Math.round((v / recent.length) * 10) / 10,
      }));
  }, [logs]);

  const isEvidenceReady = logs.length >= 7;

  if (logs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="ripple-section-title">My Dashboard</h1>
          <p className="text-sm text-[#6b7a72] mt-1">Your perimenopause health overview</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="ripple-card p-8 text-center space-y-4"
        >
          <div className="w-16 h-16 bg-[#eef4f1] rounded-2xl flex items-center justify-center mx-auto">
            <BarChart2 className="w-8 h-8 text-[#4a8a72]" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-xl font-bold text-[#1a2b22]">Start Tracking Today</h2>
            <p className="text-sm text-[#6b7a72] max-w-sm mx-auto leading-relaxed">
              Log your first day of symptoms to see your Perimenopause Severity Score, trend charts, and biometric insights.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("log_signals")}
            className="inline-flex items-center gap-2 bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Activity className="w-4 h-4" />
            Log Today's Symptoms
          </button>
          <a
            href={WIKI_PAGES.isThisPerimenopause}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-[#4a8a72] font-semibold hover:underline"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Is this perimenopause? Read the guide →
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="ripple-section-title">My Dashboard</h1>
          <p className="text-sm text-[#6b7a72] mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <button
          onClick={() => setActiveTab("log_signals")}
          className="flex items-center gap-1.5 bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Activity className="w-3.5 h-3.5" />
          Log Today
        </button>
      </div>

      {/* PSS Score + Streak */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* PSS Card */}
        <div className={`ripple-card p-5 sm:col-span-2 border ${pssInfo.bg}`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="ripple-label">Perimenopause Severity Score</p>
              <div className="flex items-end gap-2">
                <span className={`font-serif text-5xl font-bold ${pssInfo.color}`}>{pssScore}</span>
                <span className="text-sm text-[#6b7a72] mb-1.5">/100</span>
              </div>
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${pssInfo.bg} ${pssInfo.color}`}>
                {pssInfo.label}
              </span>
            </div>
            <div className="w-16 h-16 relative">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e0d5c8" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={pssScore < 40 ? "#4a8a72" : pssScore < 70 ? "#f97316" : "#ef4444"}
                  strokeWidth="3"
                  strokeDasharray={`${pssScore} ${100 - pssScore}`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-[#6b7a72] mt-3 leading-relaxed">
            Based on your last {Math.min(logs.length, 14)} logged days.{" "}
            {isEvidenceReady ? (
              <button onClick={() => setActiveTab("evidence_engine")} className="text-[#4a8a72] font-semibold underline underline-offset-2">
                Your Evidence Report is ready →
              </button>
            ) : (
              `Log ${7 - logs.length} more days to unlock your Evidence Report.`
            )}
          </p>
        </div>

        {/* Streak Card */}
        <div className="ripple-card p-5 flex flex-col justify-between">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="ripple-label">Logging Streak</p>
            <p className="font-serif text-4xl font-bold text-[#1a2b22] mt-1">
              {streak}
              <span className="text-sm font-sans font-normal text-[#6b7a72] ml-1">days</span>
            </p>
            <p className="text-xs text-[#6b7a72] mt-1">
              {streak === 0 ? "Start your streak today!" : streak < 7 ? "Keep going!" : "Excellent consistency! 🌿"}
            </p>
          </div>
        </div>
      </div>

      {/* Biometric Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={Moon}
          label="Sleep"
          value={avgSleep ?? "—"}
          unit={avgSleep ? "hrs" : undefined}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <MetricCard
          icon={Activity}
          label="Sleep Efficiency"
          value={latestLog?.signals?.sleepEfficiency ?? "—"}
          unit={latestLog ? "%" : undefined}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <MetricCard
          icon={Zap}
          label="HRV"
          value={avgHRV ?? "—"}
          unit={avgHRV ? "ms" : undefined}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <MetricCard
          icon={Heart}
          label="Resting HR"
          value={avgHR ?? "—"}
          unit={avgHR ? "bpm" : undefined}
          color="text-rose-600"
          bg="bg-rose-50"
        />
      </div>

      {/* Symptom Trend Chart */}
      <div className="ripple-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="ripple-label">Symptom Trend</p>
            <p className="font-serif text-base font-bold text-[#1a2b22]">14-Day Overview</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#6b7a72]">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#c07060] inline-block" /> Severity</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#4a8a72] inline-block" /> Sleep</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="severityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c07060" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#c07060" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4a8a72" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4a8a72" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe4" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9a9490" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9a9490" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="severity" name="Avg Severity"
              stroke="#c07060" strokeWidth={2} fill="url(#severityGrad)"
              connectNulls dot={false} activeDot={{ r: 4, fill: "#c07060" }}
            />
            <Area
              type="monotone" dataKey="sleep" name="Sleep (hrs)"
              stroke="#4a8a72" strokeWidth={2} fill="url(#sleepGrad)"
              connectNulls dot={false} activeDot={{ r: 4, fill: "#4a8a72" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Symptoms */}
      {topSymptoms.length > 0 && (
        <div className="ripple-card p-5">
          <p className="ripple-label mb-1">Top Symptoms This Week</p>
          <p className="font-serif text-base font-bold text-[#1a2b22] mb-4">Most Frequent Signals</p>
          <div className="grid grid-cols-2 gap-3">
            {topSymptoms.map(({ key, label, avg }) => (
              <div key={key} className="flex items-center gap-3 bg-[#f5f0ea] rounded-xl p-3">
                <div
                  className={`w-2 h-8 rounded-full ${
                    avg >= 2.5 ? "bg-red-400" : avg >= 1.5 ? "bg-orange-400" : avg >= 0.5 ? "bg-amber-400" : "bg-gray-300"
                  }`}
                />
                <div>
                  <p className="text-xs font-bold text-[#1a2b22]">{label}</p>
                  <p className="text-xs text-[#6b7a72]">Avg {avg}/3</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Surgical Menopause Banner */}
      {menopauseMode === "surgical" && surgeryDate && (() => {
        const days = Math.max(0, Math.floor((new Date().getTime() - new Date(surgeryDate + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24)));
        return (
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setActiveTab("menopause_mode")}
            className="w-full flex items-center justify-between ripple-card p-4 bg-[#faf5f3] border-[#e8d8d0] hover:bg-[#f5ede9] transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#c07060]/10 rounded-xl flex items-center justify-center text-lg shrink-0">🏥</div>
              <div>
                <p className="text-sm font-bold text-[#1a2b22]">Day {days} since surgery</p>
                <p className="text-[10px] text-[#9a9490]">Surgical menopause mode active</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#c07060] group-hover:underline shrink-0">View →</span>
          </motion.button>
        );
      })()}

      {/* Trigger Insight Card */}
      {triggerAnalysis?.minimumDataMet && triggerAnalysis.topTriggers.length > 0 && (() => {
        const top = triggerAnalysis.topTriggers[0];
        const isHarmful = top.combinedEffect > 0;
        return (
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setActiveTab("trigger_tracker")}
            className="w-full flex items-center justify-between ripple-card p-4 bg-[#eef4f1] border-[#c8d8d0] hover:bg-[#ddeee7] transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#4a8a72]/10 rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-4.5 h-4.5 text-[#4a8a72]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1a2b22]">
                  Top trigger: {top.triggerName}
                </p>
                <p className="text-[10px] text-[#6b7a72]">
                  {isHarmful
                    ? `${top.symptomLabel} ${top.sameDayDifference > 0 ? (top.sameDayDifference * 100 / 3).toFixed(0) + "% higher" : "affected"} on ${top.triggerName.toLowerCase()} days`
                    : `${top.symptomLabel} lower on ${top.triggerName.toLowerCase()} days`
                  }
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#4a8a72] group-hover:underline shrink-0">See insights →</span>
          </motion.button>
        );
      })()}

      {/* HRT Reminder Card */}
      {hrtDueToday.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setActiveTab("hrt_tracker")}
          className="w-full flex items-center justify-between ripple-card p-4 bg-[#faf5f3] border-[#e8d8d0] hover:bg-[#f5ede9] transition-colors group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c07060]/10 rounded-xl flex items-center justify-center text-lg shrink-0">💊</div>
            <div>
              <p className="text-sm font-bold text-[#1a2b22]">
                {hrtDueToday.length === 1
                  ? `${hrtDueToday[0].name} due today`
                  : `${hrtDueToday.length} medications due today`}
              </p>
              <p className="text-[10px] text-[#9a9490]">
                {hrtDueToday.map((m) => m.name).join(" · ")}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#c07060] group-hover:underline shrink-0">Mark taken →</span>
        </motion.button>
      )}

      {/* Symptom Heatmap Calendar */}
      {logs.length >= 1 && <SymptomHeatmap />}

      {/* Biological Correlations Chart */}
      {logs.length >= 2 && <BiologicalCorrelations compact />}

      {/* Menopause Wiki nudge */}
      <a
        href={WIKI_PAGES.home}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between ripple-card p-4 hover:bg-[#f5f0ea] transition-colors group no-underline"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#eef4f1] rounded-lg flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-[#4a8a72]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1a2b22]">Menopause Wiki</p>
            <p className="text-[10px] text-[#6b7a72]">Clinical references, treatment options, and community knowledge</p>
          </div>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-[#9a9490] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </a>

      {/* Evidence Ready Banner */}
      {isEvidenceReady && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="ripple-card p-4 bg-[#eef4f1] border-[#c8d8d0] flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#4a8a72] shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#1a2b22]">Evidence Report Ready</p>
              <p className="text-xs text-[#6b7a72]">You have enough data to generate a clinical-grade GP brief.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("evidence_engine")}
            className="shrink-0 bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Generate →
          </button>
        </motion.div>
      )}
    </div>
  );
}
