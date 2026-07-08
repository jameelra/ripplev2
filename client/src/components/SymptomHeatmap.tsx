import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useVaultStore } from "../stores/vaultStore";
import { DayLog } from "../../../shared/types";

// ─── PSS colour scale ─────────────────────────────────────────────────────────
// PSS is 0–100 (computed from 12 symptoms × 0–3 scale, normalised)
// We compute a per-day score: sum of all symptoms / 36 * 100

function computeDayPSS(log: DayLog): number {
  const total = Object.values(log.symptoms).reduce((a, b) => a + (b as number), 0);
  return Math.round((total / 36) * 100);
}

function getPSSColor(pss: number): string {
  if (pss === 0) return "#eef4f1";       // No symptoms — soft green
  if (pss <= 15) return "#c8e6d8";       // Very mild — light green
  if (pss <= 30) return "#a8d4b8";       // Mild — medium green
  if (pss <= 45) return "#f5d98a";       // Moderate — amber
  if (pss <= 60) return "#f0b060";       // Moderate-high — orange
  if (pss <= 75) return "#e07050";       // High — salmon
  return "#c04040";                       // Severe — red
}

function getPSSLabel(pss: number): string {
  if (pss === 0) return "No symptoms";
  if (pss <= 15) return "Very mild";
  if (pss <= 30) return "Mild";
  if (pss <= 45) return "Moderate";
  if (pss <= 60) return "Moderate–High";
  if (pss <= 75) return "High";
  return "Severe";
}

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

// ─── Main Component ───────────────────────────────────────────────────────────
interface SymptomHeatmapProps {
  compact?: boolean;
}

export default function SymptomHeatmap({ compact = false }: SymptomHeatmapProps) {
  const { logs, setActiveTab } = useVaultStore();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build a date → log map
  const logByDate = useMemo(() => {
    const map = new Map<string, DayLog>();
    logs.forEach((l) => map.set(l.id, l));
    return map;
  }, [logs]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split("T")[0];

    const cells: Array<{
      date: string | null;
      day: number | null;
      pss: number | null;
      isToday: boolean;
      isFuture: boolean;
    }> = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push({ date: null, day: null, pss: null, isToday: false, isFuture: false });
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const log = logByDate.get(dateStr);
      const pss = log ? computeDayPSS(log) : null;
      const isFuture = dateStr > today;
      cells.push({
        date: dateStr,
        day: d,
        pss,
        isToday: dateStr === today,
        isFuture,
      });
    }

    return cells;
  }, [year, month, logByDate]);

  // Month stats
  const monthStats = useMemo(() => {
    const logsThisMonth = calendarDays
      .filter((c) => c.date && c.pss !== null)
      .map((c) => c.pss as number);

    if (logsThisMonth.length === 0) return null;

    const avg = Math.round(logsThisMonth.reduce((a, b) => a + b, 0) / logsThisMonth.length);
    const best = Math.min(...logsThisMonth);
    const worst = Math.max(...logsThisMonth);
    const logged = logsThisMonth.length;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const daysElapsed = year === today.getFullYear() && month === today.getMonth()
      ? today.getDate()
      : daysInMonth;

    return { avg, best, worst, logged, daysElapsed };
  }, [calendarDays, year, month]);

  const hoveredLog = hoveredDay ? logByDate.get(hoveredDay) : null;
  const hoveredPSS = hoveredLog ? computeDayPSS(hoveredLog) : null;

  const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();

  const monthName = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="ripple-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-serif text-sm font-bold text-[#1a2b22]">Symptom Heatmap</p>
          {compact && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className="text-[10px] text-[#4a8a72] font-mono hover:underline"
            >
              Full view
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 text-[#9a9490] hover:text-[#1a2b22] hover:bg-[#f5f0ea] rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-[#1a2b22] font-bold min-w-[120px] text-center">{monthName}</span>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 text-[#9a9490] hover:text-[#1a2b22] hover:bg-[#f5f0ea] rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_OF_WEEK.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-mono font-bold text-[#9a9490] py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, i) => {
          if (!cell.date || cell.day === null) {
            return <div key={i} />;
          }

          const bg = cell.isFuture
            ? "#f5f0ea"
            : cell.pss !== null
            ? getPSSColor(cell.pss)
            : "#f0ebe4";

          const isHovered = hoveredDay === cell.date;

          return (
            <motion.button
              key={cell.date}
              onMouseEnter={() => setHoveredDay(cell.date)}
              onMouseLeave={() => setHoveredDay(null)}
              onFocus={() => setHoveredDay(cell.date)}
              onBlur={() => setHoveredDay(null)}
              whileHover={{ scale: 1.15 }}
              transition={{ duration: 0.1 }}
              className={`relative aspect-square rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                cell.isToday
                  ? "ring-2 ring-[#1a2b22] ring-offset-1"
                  : ""
              } ${cell.isFuture ? "opacity-30 cursor-default" : "cursor-pointer"}`}
              style={{ backgroundColor: bg }}
              disabled={cell.isFuture}
              aria-label={`${cell.date}: PSS ${cell.pss ?? "not logged"}`}
            >
              <span className={`${
                cell.pss !== null && cell.pss > 45 ? "text-white" : "text-[#1a2b22]/70"
              }`}>
                {cell.day}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredDay && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a2b22] rounded-xl p-3 space-y-1"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono text-white/60">
              {new Date(hoveredDay + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
            {hoveredPSS !== null && (
              <span
                className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: getPSSColor(hoveredPSS), color: hoveredPSS > 45 ? "white" : "#1a2b22" }}
              >
                {getPSSLabel(hoveredPSS)}
              </span>
            )}
          </div>
          {hoveredLog ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <p className="text-xs font-bold text-white">PSS Score</p>
              <p className="text-xs text-white/80 text-right">{hoveredPSS}/100</p>
              {Object.entries(hoveredLog.symptoms)
                .filter(([, v]) => (v as number) > 0)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .slice(0, 3)
                .map(([key, val]) => (
                  <React.Fragment key={key}>
                    <p className="text-[10px] text-white/60 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                    <p className="text-[10px] text-white/80 text-right">{"●".repeat(val as number)}{"○".repeat(3 - (val as number))}</p>
                  </React.Fragment>
                ))}
            </div>
          ) : (
            <p className="text-xs text-white/50">No log for this day</p>
          )}
        </motion.div>
      )}

      {/* Month stats */}
      {monthStats && (
        <div className="grid grid-cols-4 gap-2 border-t border-[#f0ebe4] pt-3">
          {[
            { label: "Logged", value: `${monthStats.logged}/${monthStats.daysElapsed}`, sub: "days" },
            { label: "Avg PSS", value: String(monthStats.avg), sub: getPSSLabel(monthStats.avg) },
            { label: "Best Day", value: String(monthStats.best), sub: "PSS" },
            { label: "Worst Day", value: String(monthStats.worst), sub: "PSS" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="text-center">
              <p className="text-[9px] font-mono uppercase tracking-wider text-[#9a9490] font-bold">{label}</p>
              <p className="font-serif text-base font-bold text-[#1a2b22]">{value}</p>
              <p className="text-[9px] text-[#9a9490]">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[9px] font-mono text-[#9a9490] font-bold uppercase tracking-wider">PSS:</p>
        {[
          { label: "None", color: "#eef4f1" },
          { label: "Mild", color: "#a8d4b8" },
          { label: "Moderate", color: "#f5d98a" },
          { label: "High", color: "#e07050" },
          { label: "Severe", color: "#c04040" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-[#9a9490] font-mono">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-1">
          <div className="w-3 h-3 rounded-sm bg-[#f0ebe4]" />
          <span className="text-[9px] text-[#9a9490] font-mono">Not logged</span>
        </div>
      </div>

      {/* Empty state */}
      {logs.length === 0 && (
        <div className="text-center py-4 space-y-1">
          <p className="text-xs text-[#9a9490]">Start logging to see your heatmap</p>
          <button
            onClick={() => setActiveTab("log_signals")}
            className="text-xs text-[#4a8a72] font-semibold hover:underline"
          >
            Log today's symptoms →
          </button>
        </div>
      )}
    </div>
  );
}
