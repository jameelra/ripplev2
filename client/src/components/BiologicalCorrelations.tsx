import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import { Activity, TrendingUp } from "lucide-react";
import { useVaultStore } from "../stores/vaultStore";
import { DayLog } from "../../../shared/types";
import { format, subDays } from "date-fns";

// ─── Metric configurations ────────────────────────────────────────────────────
type MetricSet = "sleep_hrv" | "aches_flashes" | "mood_sleep";

interface MetricConfig {
  label: string;
  primary: { key: string; label: string; color: string; unit: string; dotted?: boolean };
  secondary: { key: string; label: string; color: string; unit: string; dotted?: boolean };
}

const METRIC_SETS: Record<MetricSet, MetricConfig> = {
  sleep_hrv: {
    label: "Sleep & HRV",
    primary:   { key: "sleepDuration",    label: "Sleep Duration (hrs)", color: "#2D6A4F", unit: "hrs" },
    secondary: { key: "hrv",              label: "Heart Rate Variability (ms)", color: "#D4A017", unit: "ms", dotted: true },
  },
  aches_flashes: {
    label: "Aches & Flashes",
    primary:   { key: "jointPain",        label: "Joint Pain (0–3)", color: "#c07060", unit: "/3" },
    secondary: { key: "hotFlashes",       label: "Hot Flashes (0–3)", color: "#F97316", unit: "/3", dotted: true },
  },
  mood_sleep: {
    label: "Mood & Sleep",
    primary:   { key: "anxiety",          label: "Anxiety (0–3)", color: "#7C3AED", unit: "/3" },
    secondary: { key: "sleepLatency",     label: "Sleep Difficulty (0–3)", color: "#0891B2", unit: "/3", dotted: true },
  },
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, config }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e0d5c8] rounded-xl p-3 shadow-lg text-xs min-w-[140px]">
      <p className="font-bold text-[#1a2b22] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[#6b7a72] truncate max-w-[100px]">{p.name?.split(" (")[0]}</span>
          </div>
          <span className="font-bold text-[#1a2b22]">
            {p.value != null ? p.value : "—"}
            {p.value != null && (
              <span className="font-normal text-[#9a9490] ml-0.5">
                {p.dataKey === "sleepDuration" || p.dataKey === "hrv" ? "" : ""}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface BiologicalCorrelationsProps {
  compact?: boolean; // for embedding in Dashboard
}

export default function BiologicalCorrelations({ compact = false }: BiologicalCorrelationsProps) {
  const { logs } = useVaultStore();
  const [activeMetricSet, setActiveMetricSet] = useState<MetricSet>("sleep_hrv");

  const config = METRIC_SETS[activeMetricSet];

  // Build chart data from last 30 days of logs
  const chartData = useMemo(() => {
    const days = compact ? 14 : 30;
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const dateStr = date.toISOString().split("T")[0];
      const log = logs.find((l: DayLog) => l.id === dateStr);

      if (!log) return null;

      const primaryVal = config.primary.key in log.signals
        ? (log.signals as any)[config.primary.key]
        : config.primary.key in log.symptoms
          ? (log.symptoms as any)[config.primary.key]
          : null;

      const secondaryVal = config.secondary.key in log.signals
        ? (log.signals as any)[config.secondary.key]
        : config.secondary.key in log.symptoms
          ? (log.symptoms as any)[config.secondary.key]
          : null;

      if (primaryVal == null && secondaryVal == null) return null;

      return {
        date: format(date, "MMM d"),
        dateStr,
        [config.primary.key]: primaryVal != null ? Math.round(primaryVal * 10) / 10 : null,
        [config.secondary.key]: secondaryVal != null ? Math.round(secondaryVal * 10) / 10 : null,
      };
    }).filter(Boolean);
  }, [logs, activeMetricSet, compact]);

  const latestEntry = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  if (logs.length === 0) {
    return (
      <div className="ripple-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#4a8a72]" />
          <p className="ripple-label">Biological Correlations</p>
          <span className="text-[9px] font-mono bg-[#f5f0ea] text-[#9a9490] border border-[#e0d5c8] px-1.5 py-0.5 rounded uppercase tracking-wider">Time-Series</span>
        </div>
        <div className="text-center py-8 space-y-2">
          <TrendingUp className="w-8 h-8 text-[#c8c0b8] mx-auto" />
          <p className="text-xs text-[#9a9490] leading-relaxed">
            Log symptoms and biometrics to see how your biological signals correlate over time.
          </p>
        </div>
      </div>
    );
  }

  if (chartData.length < 2) {
    return (
      <div className="ripple-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#4a8a72]" />
          <p className="ripple-label">Biological Correlations</p>
        </div>
        <div className="text-center py-6">
          <p className="text-xs text-[#9a9490]">Log at least 2 days to see correlations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ripple-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#4a8a72]" />
          <p className="ripple-label">Biological Correlations</p>
          <span className="text-[9px] font-mono bg-[#f5f0ea] text-[#9a9490] border border-[#e0d5c8] px-1.5 py-0.5 rounded uppercase tracking-wider">Time-Series</span>
        </div>
        {/* Metric switcher */}
        <div className="flex items-center gap-1 text-[10px] font-mono">
          <span className="text-[#9a9490] mr-1 hidden sm:block">Select metrics:</span>
          {(Object.entries(METRIC_SETS) as [MetricSet, MetricConfig][]).map(([key, mc]) => (
            <button
              key={key}
              onClick={() => setActiveMetricSet(key)}
              className={`px-2.5 py-1.5 rounded-lg border font-bold transition-all ${
                activeMetricSet === key
                  ? "bg-[#1a2b22] text-white border-[#1a2b22]"
                  : "bg-[#f5f0ea] text-[#6b7a72] border-[#e0d5c8] hover:border-[#c8d8d0]"
              }`}
            >
              {mc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 rounded" style={{ backgroundColor: config.primary.color }} />
          <span className="text-[#4a4a42]">{config.primary.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 border-t-2 border-dashed" style={{ borderColor: config.secondary.color }} />
          <span className="text-[#4a4a42]">{config.secondary.label}</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={compact ? 180 : 240}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe4" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#9a9490" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          {/* Left Y-axis for primary metric */}
          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fontSize: 10, fill: config.primary.color }}
            tickLine={false}
            axisLine={false}
            width={32}
            label={{ value: config.primary.unit, angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 9, fill: config.primary.color } }}
          />
          {/* Right Y-axis for secondary metric */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: config.secondary.color }}
            tickLine={false}
            axisLine={false}
            width={32}
            label={{ value: config.secondary.unit, angle: 90, position: "insideRight", offset: 10, style: { fontSize: 9, fill: config.secondary.color } }}
          />
          <Tooltip content={<CustomTooltip config={config} />} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey={config.primary.key}
            name={config.primary.label}
            stroke={config.primary.color}
            strokeWidth={2}
            dot={{ r: 3, fill: config.primary.color, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: config.primary.color }}
            connectNulls
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={config.secondary.key}
            name={config.secondary.label}
            stroke={config.secondary.color}
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3, fill: config.secondary.color, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: config.secondary.color }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-[#9a9490]">
        <span>● Hover/Touch chart lanes for details</span>
        {latestEntry && <span>Latest entry: {(latestEntry as any).dateStr}</span>}
      </div>
    </div>
  );
}
