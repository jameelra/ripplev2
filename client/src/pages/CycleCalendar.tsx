import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Sparkles, Droplet, Circle,
  Sun, AlertCircle, Activity, Plus, Trash2, Info
} from "lucide-react";
import { useVaultStore } from "../stores/vaultStore";
import {
  CycleEvent,
  CycleEventType,
  EVENT_STYLES,
  computeReproductiveIntelligence,
  generatePredictedEvents,
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDate,
  parseDate,
  isSameMonth,
} from "../lib/cycleIntelligence";

// ─── Reproductive Window Intelligence Banner ──────────────────────────────────
function IntelligenceBanner({ cycleEvents }: { cycleEvents: CycleEvent[] }) {
  const intel = useMemo(() => computeReproductiveIntelligence(cycleEvents), [cycleEvents]);

  if (intel.status === "insufficient_data") {
    return (
      <div className="flex items-start gap-3 bg-[#f5f0ea] border border-[#e0d5c8] rounded-xl p-4">
        <Sparkles className="w-4 h-4 text-[#9a9490] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-[#1a2b22]">Reproductive Window Intelligence</p>
          <p className="text-[11px] text-[#6b7a72] mt-0.5 leading-relaxed">
            Analyzing historic benchmarks. Gather at least {intel.minDataRequired} period entries to predict windows.
            <span className="ml-1 text-[#9a9490]">({intel.periodsLogged}/{intel.minDataRequired} logged)</span>
          </p>
        </div>
      </div>
    );
  }

  const variabilityColors = {
    regular: "bg-emerald-50 border-emerald-200 text-emerald-800",
    slightly_irregular: "bg-amber-50 border-amber-200 text-amber-800",
    irregular: "bg-orange-50 border-orange-200 text-orange-800",
    very_irregular: "bg-red-50 border-red-200 text-red-800",
  };

  const varColor = variabilityColors[intel.cycleVariability ?? "regular"];

  return (
    <div className={`border rounded-xl p-4 space-y-2 ${varColor}`}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 shrink-0" />
        <p className="text-xs font-bold">Reproductive Window Intelligence</p>
        <span className="ml-auto text-[9px] font-mono uppercase tracking-wider opacity-70">
          {intel.periodsLogged} cycles analysed
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
        {intel.averageCycleLength && (
          <div>
            <p className="opacity-60 uppercase tracking-wider font-mono">Avg Cycle</p>
            <p className="font-bold text-sm">{intel.averageCycleLength} days</p>
          </div>
        )}
        {intel.nextPeriodPrediction && (
          <div>
            <p className="opacity-60 uppercase tracking-wider font-mono">Next Period</p>
            <p className="font-bold text-sm">
              {parseDate(intel.nextPeriodPrediction).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
        )}
        {intel.predictedOvulation && (
          <div>
            <p className="opacity-60 uppercase tracking-wider font-mono">Predicted Ovulation</p>
            <p className="font-bold text-sm">
              {parseDate(intel.predictedOvulation).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
        )}
      </div>
      {intel.irregularityNote && (
        <p className="text-[10px] leading-relaxed opacity-80 border-t border-current/20 pt-2">
          ⚠ {intel.irregularityNote}
        </p>
      )}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  const items: Array<{ type: CycleEventType; dotStyle: string }> = [
    { type: "period_start",       dotStyle: "w-3 h-3 rounded-full bg-[#8B1A1A]" },
    { type: "period_active",      dotStyle: "w-3 h-3 rounded-full bg-[#F4A0A0]" },
    { type: "ovulation",          dotStyle: "w-3 h-3 rounded-full bg-[#2D6A4F]" },
    { type: "spotting",           dotStyle: "w-3 h-3 rounded-full bg-[#F9E4B7] border border-[#D4A017]" },
    { type: "predicted_period",   dotStyle: "w-3 h-3 rounded-full border-2 border-dashed border-[#8B1A1A]" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t border-[#f0ebe4]">
      {items.map(({ type, dotStyle }) => (
        <div key={type} className="flex items-center gap-1.5">
          <div className={dotStyle} />
          <span className="text-[10px] text-[#6b7a72]">{EVENT_STYLES[type].label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full border-2 border-dashed border-[#2D6A4F]" />
        <span className="text-[10px] text-[#6b7a72]">Prediction</span>
      </div>
    </div>
  );
}

// ─── Calendar Day Cell ────────────────────────────────────────────────────────
function DayCell({
  day,
  year,
  month,
  events,
  isToday,
  isSelected,
  onClick,
}: {
  day: number;
  year: number;
  month: number;
  events: CycleEvent[];
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const dayEvents = events.filter((e) => e.date === dateStr);

  const primaryEvent = dayEvents.find(
    (e) => e.type === "period_start" || e.type === "ovulation"
  ) ?? dayEvents[0];

  const bgStyle = primaryEvent ? EVENT_STYLES[primaryEvent.type].bg : "";
  const isPredicted = primaryEvent?.type === "predicted_period" || primaryEvent?.type === "predicted_ovulation";

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all
        ${isSelected ? "ring-2 ring-[#4a8a72] ring-offset-1" : ""}
        ${isToday && !primaryEvent ? "ring-2 ring-[#1a2b22] ring-offset-1" : ""}
        ${primaryEvent && !isPredicted ? `${bgStyle} ${EVENT_STYLES[primaryEvent.type].text}` : ""}
        ${isPredicted ? "border-2 border-dashed border-[#8B1A1A]/50 text-[#8B1A1A]/70" : ""}
        ${!primaryEvent ? "hover:bg-[#f5f0ea] text-[#3a3a32]" : ""}
      `}
    >
      <span className={`text-xs font-bold ${isToday && !primaryEvent ? "text-[#1a2b22]" : ""}`}>{day}</span>
      {dayEvents.length > 1 && (
        <div className="absolute bottom-1 flex gap-0.5">
          {dayEvents.slice(0, 3).map((e, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: EVENT_STYLES[e.type].dotColor }}
            />
          ))}
        </div>
      )}
    </button>
  );
}

// ─── Quick Log Button ─────────────────────────────────────────────────────────
function QuickLogButton({
  label,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-[1.02] ${color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CycleCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { cycleEvents, addCycleEvent, removeCycleEvent, setToastNotification } = useVaultStore();

  const intelligence = useMemo(() => computeReproductiveIntelligence(cycleEvents), [cycleEvents]);
  const predictedEvents = useMemo(() => generatePredictedEvents(intelligence), [intelligence]);
  const allEvents = useMemo(() => [...cycleEvents, ...predictedEvents], [cycleEvents, predictedEvents]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const todayStr = formatDate(today);

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleQuickLog = async (type: CycleEventType, date?: string) => {
    const targetDate = date ?? selectedDate ?? todayStr;
    const event: CycleEvent = {
      id: `${type}_${targetDate}_${Date.now()}`,
      date: targetDate,
      type,
      createdAt: new Date().toISOString(),
    };
    await addCycleEvent(event);
    setToastNotification({
      type: "success",
      title: "Cycle Event Logged",
      description: `${EVENT_STYLES[type].label} recorded for ${parseDate(targetDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.`,
    });
  };

  const handleRemoveEvent = async (id: string) => {
    await removeCycleEvent(id);
    setToastNotification({ type: "info", title: "Event Removed", description: "Cycle event deleted from your vault." });
  };

  // Events for selected date
  const selectedDateEvents = selectedDate
    ? cycleEvents.filter((e) => e.date === selectedDate)
    : [];

  // Recent cycle log history (last 10 real events)
  const recentEvents = [...cycleEvents]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="ripple-section-title">Cycle Calendar</h1>
        <p className="text-sm text-[#6b7a72] mt-1">Track your cycle, log events, and let Ripple predict your windows</p>
      </div>

      {/* Intelligence Banner */}
      <IntelligenceBanner cycleEvents={cycleEvents} />

      {/* Main layout: Calendar + Log History */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Calendar */}
        <div className="lg:col-span-3 ripple-card p-4 space-y-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 hover:bg-[#f5f0ea] rounded-lg transition">
              <ChevronLeft className="w-4 h-4 text-[#6b7a72]" />
            </button>
            <h2 className="font-serif text-base font-bold text-[#1a2b22] tracking-wide uppercase">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-[#f5f0ea] rounded-lg transition">
              <ChevronRight className="w-4 h-4 text-[#6b7a72]" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-[#9a9490] uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              return (
                <DayCell
                  key={day}
                  day={day}
                  year={viewYear}
                  month={viewMonth}
                  events={allEvents}
                  isToday={dateStr === todayStr}
                  isSelected={dateStr === selectedDate}
                  onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                />
              );
            })}
          </div>

          {/* Legend */}
          <Legend />
        </div>

        {/* Log History Trace */}
        <div className="lg:col-span-2 ripple-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#4a8a72]" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">Log History Trace</p>
            </div>
            <span className="text-[10px] font-mono text-[#9a9490]">{cycleEvents.length} logs synced</span>
          </div>

          {/* Selected date quick-log */}
          {selectedDate && (
            <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#4a8a72] font-bold">
                Logging for {parseDate(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <QuickLogButton label="Period Began" icon={Droplet} color="bg-[#8B1A1A]/10 border-[#8B1A1A]/30 text-[#8B1A1A] hover:bg-[#8B1A1A]/20" onClick={() => handleQuickLog("period_start", selectedDate)} />
                <QuickLogButton label="Active Day" icon={Droplet} color="bg-[#F4A0A0]/30 border-[#F4A0A0] text-[#8B1A1A] hover:bg-[#F4A0A0]/50" onClick={() => handleQuickLog("period_active", selectedDate)} />
                <QuickLogButton label="Ovulation" icon={Sun} color="bg-[#2D6A4F]/10 border-[#2D6A4F]/30 text-[#2D6A4F] hover:bg-[#2D6A4F]/20" onClick={() => handleQuickLog("ovulation", selectedDate)} />
                <QuickLogButton label="Spotting" icon={Circle} color="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" onClick={() => handleQuickLog("spotting", selectedDate)} />
              </div>
              {selectedDateEvents.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-[#c8d8d0]">
                  {selectedDateEvents.map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_STYLES[e.type].dotColor }} />
                        <span className="text-[#4a4a42]">{EVENT_STYLES[e.type].label}</span>
                      </div>
                      <button onClick={() => handleRemoveEvent(e.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick log for today */}
          {!selectedDate && (
            <div className="space-y-2">
              <p className="text-[10px] font-mono text-[#9a9490]">Quick log for today</p>
              <div className="flex flex-wrap gap-1.5">
                <QuickLogButton label="Period Began" icon={Droplet} color="bg-[#8B1A1A]/10 border-[#8B1A1A]/30 text-[#8B1A1A] hover:bg-[#8B1A1A]/20" onClick={() => handleQuickLog("period_start")} />
                <QuickLogButton label="Active Day" icon={Droplet} color="bg-[#F4A0A0]/30 border-[#F4A0A0] text-[#8B1A1A] hover:bg-[#F4A0A0]/50" onClick={() => handleQuickLog("period_active")} />
                <QuickLogButton label="Ovulation" icon={Sun} color="bg-[#2D6A4F]/10 border-[#2D6A4F]/30 text-[#2D6A4F] hover:bg-[#2D6A4F]/20" onClick={() => handleQuickLog("ovulation")} />
                <QuickLogButton label="Spotting" icon={Circle} color="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" onClick={() => handleQuickLog("spotting")} />
              </div>
            </div>
          )}

          {/* History list */}
          {recentEvents.length > 0 ? (
            <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
              {recentEvents.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-[#f0ebe4] last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: EVENT_STYLES[e.type].dotColor }} />
                    <div>
                      <p className="text-xs font-semibold text-[#1a2b22]">{EVENT_STYLES[e.type].label}</p>
                      <p className="text-[10px] text-[#9a9490] font-mono">
                        {parseDate(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveEvent(e.id)} className="text-[#c8c0b8] hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <Activity className="w-8 h-8 text-[#c8c0b8] mx-auto" />
              <p className="text-xs text-[#9a9490] leading-relaxed">
                No cycle logs on database registry yet.<br />
                Tap a date or use Quick Log to sync logs.
              </p>
            </div>
          )}

          {/* Perimenopause note */}
          <div className="flex items-start gap-2 bg-[#f5f0ea] rounded-xl p-3">
            <Info className="w-3.5 h-3.5 text-[#9a9490] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#9a9490] leading-relaxed">
              In perimenopause, cycles become irregular. Tracking these changes builds the evidence base for your GP brief.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
