import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill, Plus, Edit3, Trash2, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus,
  Calendar, BarChart2, History, Activity, Info, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVaultStore } from "../stores/vaultStore";
import HRTMedicationForm from "../components/HRTMedicationForm";
import {
  HRTMedication,
  HRTDoseLog,
  HRT_DELIVERY_LABELS,
  HRT_SCHEDULE_LABELS,
  ApplicationSite,
} from "../../../shared/types";
import {
  computeNextDueDate,
  computeAdherence,
  computeTreatmentResponse,
} from "../lib/hrtEngine";

const TODAY = new Date().toISOString().split("T")[0];
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const APPLICATION_SITES: { value: ApplicationSite; label: string }[] = [
  { value: "left_arm", label: "Left Arm" },
  { value: "right_arm", label: "Right Arm" },
  { value: "left_abdomen", label: "Left Abdomen" },
  { value: "right_abdomen", label: "Right Abdomen" },
  { value: "left_thigh", label: "Left Thigh" },
  { value: "right_thigh", label: "Right Thigh" },
  { value: "buttock_left", label: "Left Buttock" },
  { value: "buttock_right", label: "Right Buttock" },
  { value: "other", label: "Other" },
];

// ─── Delivery icon helper ─────────────────────────────────────────────────────
function deliveryEmoji(method: HRTMedication["deliveryMethod"]): string {
  switch (method) {
    case "gel": case "spray": return "💧";
    case "patch": return "🩹";
    case "capsule": case "tablet": return "💊";
    case "vaginal_cream": case "vaginal_pessary": return "🌸";
    case "injection": return "💉";
    case "supplement": return "✨";
    default: return "💊";
  }
}

// ─── Patch countdown ──────────────────────────────────────────────────────────
function PatchCountdown({ med, doseLogs }: { med: HRTMedication; doseLogs: HRTDoseLog[] }) {
  if (med.deliveryMethod !== "patch" && med.deliveryMethod !== "gel") return null;
  const lastDose = doseLogs
    .filter((d) => d.medicationId === med.id && !d.skipped)
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))[0];
  const nextDue = computeNextDueDate(med, lastDose?.scheduledDate ?? null, TODAY);
  if (!nextDue) return null;
  const daysUntil = Math.ceil((new Date(nextDue + "T12:00:00").getTime() - new Date(TODAY + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntil < 0;
  const isDueToday = daysUntil === 0;
  return (
    <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
      isOverdue ? "bg-red-50 text-red-700 border-red-200" :
      isDueToday ? "bg-amber-50 text-amber-700 border-amber-200" :
      "bg-[#eef4f1] text-[#4a8a72] border-[#c8d8d0]"
    }`}>
      {isOverdue ? `${Math.abs(daysUntil)}d overdue` :
       isDueToday ? "Change today" :
       `Change in ${daysUntil}d`}
    </div>
  );
}

// ─── Medication Card ──────────────────────────────────────────────────────────
function MedicationCard({
  med,
  doseLogs,
  onEdit,
  onDelete,
  onMarkTaken,
}: {
  med: HRTMedication;
  doseLogs: HRTDoseLog[];
  onEdit: () => void;
  onDelete: () => void;
  onMarkTaken: (med: HRTMedication, site?: ApplicationSite) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showSiteSelector, setShowSiteSelector] = useState(false);
  const [selectedSite, setSelectedSite] = useState<ApplicationSite | undefined>();

  const adherence = computeAdherence(med, doseLogs, 30);
  const takenToday = doseLogs.some((d) => d.medicationId === med.id && d.scheduledDate === TODAY && !d.skipped);
  const needsSiteRotation = med.deliveryMethod === "patch" || med.deliveryMethod === "gel";

  const scheduleText = () => {
    switch (med.scheduleType) {
      case "daily": return `Daily at ${med.timesOfDay?.[0] ?? "morning"}`;
      case "every_n_days": return `Every ${med.intervalDays} days`;
      case "days_of_week": return (med.daysOfWeek ?? []).map((d) => DAYS_OF_WEEK[d]).join(", ");
      case "cycle_days": return `Days ${med.cycleDayStart}–${med.cycleDayEnd} of cycle`;
      case "as_needed": return "As needed";
      default: return HRT_SCHEDULE_LABELS[med.scheduleType];
    }
  };

  return (
    <div className={`ripple-card overflow-hidden ${takenToday ? "border-[#c8d8d0]" : ""}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 hover:bg-[#faf8f5] transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
              takenToday ? "bg-[#4a8a72]/10" : "bg-[#f5f0ea]"
            }`}>
              {deliveryEmoji(med.deliveryMethod)}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-serif text-sm font-bold text-[#1a2b22]">{med.name}</p>
                {takenToday && <CheckCircle2 className="w-3.5 h-3.5 text-[#4a8a72] shrink-0" />}
              </div>
              <p className="text-[10px] text-[#9a9490]">{med.dose} · {scheduleText()}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <PatchCountdown med={med} doseLogs={doseLogs} />
                {adherence.expectedCount > 0 && (
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    adherence.percentage >= 90 ? "bg-emerald-50 text-emerald-700" :
                    adherence.percentage >= 70 ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {adherence.percentage}% adherence
                  </span>
                )}
              </div>
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-[#9a9490] shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-[#9a9490] shrink-0 mt-1" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-[#f0ebe4]">
            <div className="p-4 space-y-3">
              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="ripple-label">Delivery</p><p className="text-[#3a3a32]">{HRT_DELIVERY_LABELS[med.deliveryMethod]}</p></div>
                <div><p className="ripple-label">Started</p><p className="text-[#3a3a32]">{med.startDate}</p></div>
                <div><p className="ripple-label">Active Ingredient</p><p className="text-[#3a3a32]">{med.activeIngredient}</p></div>
                <div><p className="ripple-label">30-day Adherence</p><p className="text-[#3a3a32]">{adherence.takenCount}/{adherence.expectedCount} doses</p></div>
              </div>
              {med.notes && (
                <div className="bg-[#f5f0ea] rounded-xl p-3">
                  <p className="ripple-label mb-1">Notes</p>
                  <p className="text-xs text-[#4a4a42] leading-relaxed">{med.notes}</p>
                </div>
              )}

              {/* Site selector for patches/gels */}
              {!takenToday && needsSiteRotation && showSiteSelector && (
                <div className="space-y-2">
                  <p className="ripple-label">Application Site (optional)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {APPLICATION_SITES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSelectedSite(s.value === selectedSite ? undefined : s.value)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-all ${
                          selectedSite === s.value
                            ? "bg-[#4a8a72] text-white border-[#4a8a72]"
                            : "bg-[#f5f0ea] text-[#6b7a72] border-[#e0d5c8] hover:border-[#c8d8d0]"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {!takenToday && (
                  <Button
                    onClick={() => {
                      if (needsSiteRotation && !showSiteSelector) {
                        setShowSiteSelector(true);
                      } else {
                        onMarkTaken(med, selectedSite);
                        setShowSiteSelector(false);
                        setSelectedSite(undefined);
                      }
                    }}
                    className="flex-1 bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold rounded-xl py-2.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    {needsSiteRotation && !showSiteSelector ? "Mark as Applied" : "Confirm"}
                  </Button>
                )}
                {takenToday && (
                  <div className="flex-1 flex items-center gap-2 bg-[#eef4f1] rounded-xl px-3 py-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4a8a72]" />
                    <span className="text-xs font-bold text-[#4a8a72] font-mono">Taken today</span>
                  </div>
                )}
                <button onClick={onEdit} className="p-2.5 text-[#6b7a72] hover:text-[#4a8a72] hover:bg-[#eef4f1] rounded-xl transition">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={onDelete} className="p-2.5 text-[#6b7a72] hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Treatment Response View ──────────────────────────────────────────────────
function TreatmentResponseView({ med, onClose }: { med: HRTMedication; onClose: () => void }) {
  const { logs } = useVaultStore();
  const response = useMemo(() => computeTreatmentResponse(med, logs), [med, logs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-serif text-base font-bold text-[#1a2b22]">Treatment Response</p>
        <button onClick={onClose} className="p-1.5 text-[#9a9490] hover:text-[#1a2b22] hover:bg-[#f5f0ea] rounded-lg transition">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-[#6b7a72]">Comparing your symptoms before and after starting <strong>{med.name}</strong> on {med.startDate}.</p>

      {response.insufficientData ? (
        <div className="ripple-card p-5 text-center space-y-2">
          <BarChart2 className="w-8 h-8 text-[#c8c0b8] mx-auto" />
          <p className="text-sm font-bold text-[#1a2b22]">Not enough data yet</p>
          <p className="text-xs text-[#6b7a72] leading-relaxed">
            You need at least 7 days of symptom logs before <strong>{med.startDate}</strong> and 7 days after to generate a treatment response analysis.
            <br /><br />
            Before: {response.beforeDays} days · After: {response.afterDays} days
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* PSS comparison */}
          <div className="ripple-card p-4 space-y-3">
            <p className="ripple-label">Perimenopause Severity Score (PSS)</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#faf5f3] rounded-xl p-3">
                <p className="text-[10px] text-[#9a9490] font-mono uppercase tracking-wider">Before</p>
                <p className="font-serif text-2xl font-bold text-[#c07060]">{response.beforePSS}</p>
              </div>
              <div className="flex items-center justify-center">
                {response.pssChangePercent < -5 ? (
                  <div className="flex flex-col items-center gap-1">
                    <TrendingDown className="w-5 h-5 text-emerald-600" />
                    <p className="text-[10px] font-bold text-emerald-600">{Math.abs(response.pssChangePercent)}% better</p>
                  </div>
                ) : response.pssChangePercent > 5 ? (
                  <div className="flex flex-col items-center gap-1">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    <p className="text-[10px] font-bold text-red-500">{response.pssChangePercent}% worse</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Minus className="w-5 h-5 text-[#9a9490]" />
                    <p className="text-[10px] text-[#9a9490]">No change</p>
                  </div>
                )}
              </div>
              <div className="bg-[#eef4f1] rounded-xl p-3">
                <p className="text-[10px] text-[#9a9490] font-mono uppercase tracking-wider">After</p>
                <p className={`font-serif text-2xl font-bold ${response.afterPSS < response.beforePSS ? "text-[#4a8a72]" : "text-[#c07060]"}`}>{response.afterPSS}</p>
              </div>
            </div>
            <p className="text-[10px] text-[#9a9490] text-center">
              Based on {response.beforeDays} days before and {response.afterDays} days after {med.startDate}
            </p>
          </div>

          {/* Top improved symptoms */}
          {response.topImprovedSymptoms.length > 0 && (
            <div className="ripple-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                <p className="ripple-label text-emerald-700">Most Improved</p>
              </div>
              {response.topImprovedSymptoms.map((s) => (
                <div key={s.key} className="flex items-center justify-between">
                  <p className="text-xs text-[#3a3a32]">{s.label}</p>
                  <span className="text-xs font-bold text-emerald-600">{s.change.toFixed(1)} pts</span>
                </div>
              ))}
            </div>
          )}

          {/* Top worsened symptoms */}
          {response.topWorsenedSymptoms.length > 0 && (
            <div className="ripple-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <p className="ripple-label text-red-600">Worsened</p>
              </div>
              {response.topWorsenedSymptoms.map((s) => (
                <div key={s.key} className="flex items-center justify-between">
                  <p className="text-xs text-[#3a3a32]">{s.label}</p>
                  <span className="text-xs font-bold text-red-500">+{s.change.toFixed(1)} pts</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 text-[10px] text-[#9a9490] bg-[#f5f0ea] rounded-xl p-3">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p>Treatment response data is included in your Evidence Engine GP brief. Share it with your doctor at your next appointment.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dose History View ────────────────────────────────────────────────────────
function DoseHistoryView({ hrtMedications, hrtDoseLogs }: { hrtMedications: HRTMedication[]; hrtDoseLogs: HRTDoseLog[] }) {
  const activeMeds = hrtMedications.filter((m) => m.isActive);

  return (
    <div className="space-y-4">
      {/* Adherence summary per medication */}
      {activeMeds.length > 0 && (
        <div className="ripple-card p-4 space-y-3">
          <p className="ripple-label">30-Day Adherence</p>
          {activeMeds.map((med) => {
            const adh = computeAdherence(med, hrtDoseLogs, 30);
            return (
              <div key={med.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#1a2b22]">{med.name}</p>
                  <span className={`text-xs font-bold font-mono ${
                    adh.percentage >= 90 ? "text-emerald-600" :
                    adh.percentage >= 70 ? "text-amber-600" : "text-red-500"
                  }`}>{adh.percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#f0ebe4] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      adh.percentage >= 90 ? "bg-emerald-500" :
                      adh.percentage >= 70 ? "bg-amber-400" : "bg-red-400"
                    }`}
                    style={{ width: `${adh.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#9a9490]">{adh.takenCount} of {adh.expectedCount} expected doses taken</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      <DoseHistoryTimeline hrtMedications={hrtMedications} hrtDoseLogs={hrtDoseLogs} />
    </div>
  );
}

function DoseHistoryTimeline({ hrtMedications, hrtDoseLogs }: { hrtMedications: HRTMedication[]; hrtDoseLogs: HRTDoseLog[] }) {
  const recentLogs = [...hrtDoseLogs]
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
    .slice(0, 30);

  if (recentLogs.length === 0) {
    return (
      <div className="ripple-card p-8 text-center space-y-2">
        <History className="w-8 h-8 text-[#c8c0b8] mx-auto" />
        <p className="font-serif text-sm font-bold text-[#1a2b22]">No dose history yet</p>
        <p className="text-xs text-[#6b7a72]">Mark doses as taken to build your history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentLogs.map((log) => {
        const med = hrtMedications.find((m) => m.id === log.medicationId);
        if (!med) return null;
        return (
          <div key={log.id} className="ripple-card p-3.5 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${
              log.skipped ? "bg-red-50" : "bg-[#eef4f1]"
            }`}>
              {log.skipped ? "⏭" : deliveryEmoji(med.deliveryMethod)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#1a2b22] truncate">{med.name}</p>
              <p className="text-[10px] text-[#9a9490]">
                {log.scheduledDate}
                {log.applicationSite && ` · ${APPLICATION_SITES.find((s) => s.value === log.applicationSite)?.label ?? log.applicationSite}`}
              </p>
            </div>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              log.skipped ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              {log.skipped ? "Skipped" : "Taken"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main HRT Tracker Page ────────────────────────────────────────────────────
export default function HRTTracker() {
  const { hrtMedications, hrtDoseLogs, addHRTMedication, updateHRTMedication, removeHRTMedication, logHRTDose, setToastNotification } = useVaultStore();
  const [activeView, setActiveView] = useState<"regimen" | "today" | "history">("regimen");
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState<HRTMedication | null>(null);
  const [responseViewMed, setResponseViewMed] = useState<HRTMedication | null>(null);

  const activeMeds = hrtMedications.filter((m) => m.isActive);
  const inactiveMeds = hrtMedications.filter((m) => !m.isActive);

  // Today's doses: medications due today
  const todaysDoses = useMemo(() => {
    return activeMeds.filter((med) => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      switch (med.scheduleType) {
        case "daily": return true;
        case "days_of_week": return med.daysOfWeek?.includes(dayOfWeek) ?? false;
        case "every_n_days": {
          if (!med.intervalDays) return false;
          const start = new Date(med.startDate + "T12:00:00");
          const diff = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          return diff % Math.round(med.intervalDays) === 0;
        }
        case "as_needed": return false;
        default: return false;
      }
    });
  }, [activeMeds]);

  const handleSaveMed = async (med: HRTMedication) => {
    if (editingMed) {
      await updateHRTMedication(med);
      setToastNotification({ type: "success", title: "Medication Updated", description: `${med.name} has been updated in your vault.` });
      setEditingMed(null);
    } else {
      await addHRTMedication(med);
      setToastNotification({ type: "success", title: "Medication Added", description: `${med.name} has been added to your HRT regimen.` });
      setShowForm(false);
    }
  };

  const handleMarkTaken = async (med: HRTMedication, site?: ApplicationSite) => {
    const doseLog: HRTDoseLog = {
      id: `dose_${med.id}_${TODAY}_${Date.now()}`,
      medicationId: med.id,
      scheduledDate: TODAY,
      takenAt: new Date().toISOString(),
      skipped: false,
      applicationSite: site,
    };
    await logHRTDose(doseLog);
    setToastNotification({
      type: "success",
      title: "Dose Logged",
      description: `${med.name} marked as ${med.deliveryMethod === "patch" || med.deliveryMethod === "gel" ? "applied" : "taken"} today.`,
    });
  };

  const handleDelete = async (id: string) => {
    const med = hrtMedications.find((m) => m.id === id);
    if (!confirm(`Remove ${med?.name ?? "this medication"} from your regimen?`)) return;
    await removeHRTMedication(id);
    setToastNotification({ type: "info", title: "Medication Removed", description: "Medication has been removed from your vault." });
  };

  // Show form or treatment response if active
  if (showForm || editingMed) {
    return (
      <div className="space-y-5">
        <HRTMedicationForm
          initial={editingMed ?? undefined}
          onSave={handleSaveMed}
          onCancel={() => { setShowForm(false); setEditingMed(null); }}
        />
      </div>
    );
  }

  if (responseViewMed) {
    return (
      <div className="space-y-5">
        <TreatmentResponseView med={responseViewMed} onClose={() => setResponseViewMed(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="ripple-section-title">HRT Tracker</h1>
          <p className="text-sm text-[#6b7a72] mt-1">
            {activeMeds.length > 0
              ? `${activeMeds.length} active medication${activeMeds.length !== 1 ? "s" : ""} · ${todaysDoses.length} due today`
              : "Log your hormone therapy and supplements"}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold px-4 py-2.5 rounded-xl shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>For tracking purposes only.</strong> Always follow your prescriber's instructions. This tracker does not provide medical advice.
        </p>
      </div>

      {/* View tabs */}
      {activeMeds.length > 0 && (
        <div className="flex gap-1 bg-[#f5f0ea] p-1 rounded-xl">
          {([
            { id: "regimen" as const, label: "My Regimen", icon: Pill },
            { id: "today" as const, label: `Today (${todaysDoses.length})`, icon: Calendar },
            { id: "history" as const, label: "History", icon: History },
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
      )}

      {/* My Regimen view */}
      {(activeView === "regimen" || activeMeds.length === 0) && (
        <div className="space-y-3">
          {activeMeds.length === 0 ? (
            <div className="ripple-card p-8 text-center space-y-3">
              <div className="w-14 h-14 bg-[#f5f0ea] rounded-2xl flex items-center justify-center mx-auto text-2xl">💊</div>
              <div>
                <p className="font-serif text-base font-bold text-[#1a2b22]">No medications logged yet</p>
                <p className="text-xs text-[#6b7a72] max-w-sm mx-auto leading-relaxed mt-1">
                  Add your HRT medications, supplements, and non-hormonal treatments. Your regimen will appear in your GP brief.
                </p>
              </div>
              <Button onClick={() => setShowForm(true)} className="bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold px-6 py-3 rounded-xl">
                <Plus className="w-4 h-4 mr-1.5" /> Add Your First Medication
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-[#9a9490] font-mono">{activeMeds.length} active medication{activeMeds.length !== 1 ? "s" : ""}</p>
              {activeMeds.map((med) => (
                <MedicationCard
                  key={med.id}
                  med={med}
                  doseLogs={hrtDoseLogs}
                  onEdit={() => setEditingMed(med)}
                  onDelete={() => handleDelete(med.id)}
                  onMarkTaken={handleMarkTaken}
                />
              ))}
              {/* Treatment response buttons */}
              {activeMeds.length > 0 && (
                <div className="space-y-2">
                  <p className="ripple-label">Treatment Response Analysis</p>
                  {activeMeds.map((med) => (
                    <button
                      key={med.id}
                      onClick={() => setResponseViewMed(med)}
                      className="w-full flex items-center justify-between ripple-card p-3.5 hover:bg-[#f5f0ea] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Activity className="w-4 h-4 text-[#4a8a72]" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-[#1a2b22]">{med.name}</p>
                          <p className="text-[10px] text-[#9a9490]">Before vs. after {med.startDate}</p>
                        </div>
                      </div>
                      <TrendingDown className="w-4 h-4 text-[#9a9490] group-hover:text-[#4a8a72] transition-colors" />
                    </button>
                  ))}
                </div>
              )}
              {/* Discontinued */}
              {inactiveMeds.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="ripple-label text-[#9a9490]">Discontinued ({inactiveMeds.length})</p>
                  {inactiveMeds.map((med) => (
                    <div key={med.id} className="ripple-card p-3.5 opacity-60 flex items-center gap-3">
                      <span className="text-base">{deliveryEmoji(med.deliveryMethod)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1a2b22] truncate">{med.name}</p>
                        <p className="text-[10px] text-[#9a9490]">{med.dose} · ended {med.endDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Today's Doses view */}
      {activeView === "today" && activeMeds.length > 0 && (
        <div className="space-y-3">
          {todaysDoses.length === 0 ? (
            <div className="ripple-card p-6 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#4a8a72] mx-auto" />
              <p className="font-serif text-sm font-bold text-[#1a2b22]">Nothing due today</p>
              <p className="text-xs text-[#6b7a72]">No medications are scheduled for today based on your regimen.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-[#9a9490] font-mono">{todaysDoses.length} medication{todaysDoses.length !== 1 ? "s" : ""} due today</p>
              {todaysDoses.map((med) => (
                <MedicationCard
                  key={med.id}
                  med={med}
                  doseLogs={hrtDoseLogs}
                  onEdit={() => setEditingMed(med)}
                  onDelete={() => handleDelete(med.id)}
                  onMarkTaken={handleMarkTaken}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Dose History view */}
      {activeView === "history" && activeMeds.length > 0 && (
        <DoseHistoryView hrtMedications={hrtMedications} hrtDoseLogs={hrtDoseLogs} />
      )}
    </div>
  );
}
