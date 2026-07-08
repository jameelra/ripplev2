import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Check, Search, Pill, Droplet,
  Sticker, Syringe, Sparkles, X, Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  HRTMedication,
  HRTDeliveryMethod,
  HRTScheduleType,
  HRT_DELIVERY_LABELS,
  HRT_SCHEDULE_LABELS,
} from "../../../shared/types";
import {
  HRT_MEDICATION_TEMPLATES,
  MedicationTemplate,
  MEDICATION_CATEGORY_LABELS,
  createMedicationFromTemplate,
  searchMedicationTemplates,
} from "../lib/hrtMedications";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Delivery Method Icon ─────────────────────────────────────────────────────
function DeliveryIcon({ method, size = 20 }: { method: HRTDeliveryMethod; size?: number }) {
  const s = size;
  switch (method) {
    case "gel": case "spray": return <Droplet size={s} />;
    case "patch": return <Sticker size={s} />;
    case "injection": return <Syringe size={s} />;
    case "supplement": return <Sparkles size={s} />;
    default: return <Pill size={s} />;
  }
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < current ? "bg-[#4a8a72] w-6" : i === current ? "bg-[#4a8a72] w-8" : "bg-[#e0d5c8] w-4"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
interface HRTMedicationFormProps {
  initial?: HRTMedication;
  onSave: (med: HRTMedication) => void;
  onCancel: () => void;
}

export default function HRTMedicationForm({ initial, onSave, onCancel }: HRTMedicationFormProps) {
  const [step, setStep] = useState(0);
  const TOTAL_STEPS = 5;

  // Form state
  const [searchQuery, setSearchQuery] = useState(initial?.name ?? "");
  const [selectedTemplate, setSelectedTemplate] = useState<MedicationTemplate | null>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [activeIngredient, setActiveIngredient] = useState(initial?.activeIngredient ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState<HRTDeliveryMethod>(initial?.deliveryMethod ?? "gel");
  const [dose, setDose] = useState(initial?.dose ?? "");
  const [scheduleType, setScheduleType] = useState<HRTScheduleType>(initial?.scheduleType ?? "daily");
  const [intervalDays, setIntervalDays] = useState(initial?.intervalDays?.toString() ?? "3.5");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initial?.daysOfWeek ?? [0, 3]);
  const [cycleDayStart, setCycleDayStart] = useState(initial?.cycleDayStart?.toString() ?? "15");
  const [cycleDayEnd, setCycleDayEnd] = useState(initial?.cycleDayEnd?.toString() ?? "28");
  const [timeOfDay, setTimeOfDay] = useState(initial?.timesOfDay?.[0] ?? "08:00");
  const [startDate, setStartDate] = useState(initial?.startDate ?? new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return HRT_MEDICATION_TEMPLATES.slice(0, 12);
    return searchMedicationTemplates(searchQuery).slice(0, 12);
  }, [searchQuery]);

  const handleSelectTemplate = (template: MedicationTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setActiveIngredient(template.activeIngredient);
    setDeliveryMethod(template.deliveryMethod);
    setDose(template.defaultDose);
    setScheduleType(template.defaultScheduleType);
    if (template.defaultIntervalDays) setIntervalDays(template.defaultIntervalDays.toString());
    if (template.defaultDaysOfWeek) setDaysOfWeek(template.defaultDaysOfWeek);
    if (template.defaultCycleDayStart) setCycleDayStart(template.defaultCycleDayStart.toString());
    if (template.defaultCycleDayEnd) setCycleDayEnd(template.defaultCycleDayEnd.toString());
    if (template.defaultTimesOfDay?.[0]) setTimeOfDay(template.defaultTimesOfDay[0]);
    if (template.notes) setNotes(template.notes);
    setStep(1);
  };

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const validate = (): boolean => {
    setError(null);
    if (step === 0 && !name.trim()) { setError("Please enter or select a medication name."); return false; }
    if (step === 2 && !dose.trim()) { setError("Please enter the dose."); return false; }
    if (step === 2 && scheduleType === "days_of_week" && daysOfWeek.length === 0) {
      setError("Please select at least one day of the week."); return false;
    }
    if (step === 3 && !startDate) { setError("Please enter the start date."); return false; }
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSave = () => {
    if (!validate()) return;
    const now = new Date().toISOString();
    const med: HRTMedication = {
      id: initial?.id ?? `med_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      activeIngredient: activeIngredient.trim(),
      deliveryMethod,
      dose: dose.trim(),
      scheduleType,
      intervalDays: scheduleType === "every_n_days" ? parseFloat(intervalDays) : undefined,
      daysOfWeek: scheduleType === "days_of_week" ? daysOfWeek : undefined,
      cycleDayStart: scheduleType === "cycle_days" ? parseInt(cycleDayStart) : undefined,
      cycleDayEnd: scheduleType === "cycle_days" ? parseInt(cycleDayEnd) : undefined,
      timesOfDay: [timeOfDay],
      startDate,
      isActive: true,
      notes: notes.trim() || undefined,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    onSave(med);
  };

  const scheduleDescription = () => {
    switch (scheduleType) {
      case "daily": return `Daily at ${timeOfDay}`;
      case "every_n_days": return `Every ${intervalDays} days`;
      case "days_of_week": return daysOfWeek.map((d) => DAYS_OF_WEEK[d]).join(", ");
      case "cycle_days": return `Days ${cycleDayStart}–${cycleDayEnd} of cycle`;
      case "as_needed": return "As needed";
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="font-serif text-base font-bold text-[#1a2b22]">
            {initial ? "Edit Medication" : "Add Medication"}
          </p>
          <StepIndicator current={step} total={TOTAL_STEPS} />
        </div>
        <button onClick={onCancel} className="p-1.5 text-[#9a9490] hover:text-[#1a2b22] hover:bg-[#f5f0ea] rounded-lg transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: Search & Select */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <p className="text-xs text-[#6b7a72]">Search for your medication or enter a custom name below.</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9490]" />
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setName(e.target.value); }}
                placeholder="e.g. Oestrogel, Utrogestan, Vivelle-Dot…"
                className="pl-9 bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]"
                autoFocus
              />
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {searchResults.map((t) => (
                <button
                  key={t.name}
                  onClick={() => handleSelectTemplate(t)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-[#eef4f1] border border-transparent hover:border-[#c8d8d0] transition-all group"
                >
                  <div className="w-8 h-8 bg-[#f5f0ea] rounded-lg flex items-center justify-center shrink-0 text-[#4a8a72] group-hover:bg-[#4a8a72]/10">
                    <DeliveryIcon method={t.deliveryMethod} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1a2b22] truncate">{t.name}</p>
                    <p className="text-[10px] text-[#9a9490] truncate">{t.activeIngredient} · {HRT_DELIVERY_LABELS[t.deliveryMethod]}</p>
                  </div>
                  <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold shrink-0 ${
                    t.category === "oestrogen" ? "bg-orange-50 text-orange-700 border-orange-200" :
                    t.category === "progesterone" ? "bg-purple-50 text-purple-700 border-purple-200" :
                    t.category === "testosterone" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    t.category === "supplement" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    "bg-[#f5f0ea] text-[#6b7a72] border-[#e0d5c8]"
                  }`}>
                    {MEDICATION_CATEGORY_LABELS[t.category]}
                  </span>
                </button>
              ))}
              {searchResults.length === 0 && (
                <p className="text-xs text-[#9a9490] text-center py-4">No matches — you can still add a custom medication below.</p>
              )}
            </div>
            {/* Custom entry */}
            {name.trim() && !selectedTemplate && (
              <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-[#1a2b22]">Adding custom: "{name}"</p>
                <Input
                  value={activeIngredient}
                  onChange={(e) => setActiveIngredient(e.target.value)}
                  placeholder="Active ingredient (e.g. Oestradiol)"
                  className="bg-white border-[#c8d8d0] text-[#1a2b22] text-xs"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Step 1: Delivery Method */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <p className="text-xs text-[#6b7a72]">How do you take <strong>{name}</strong>?</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(HRT_DELIVERY_LABELS) as [HRTDeliveryMethod, string][]).map(([method, label]) => (
                <button
                  key={method}
                  onClick={() => setDeliveryMethod(method)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    deliveryMethod === method
                      ? "bg-[#eef4f1] border-[#4a8a72] text-[#1a2b22]"
                      : "bg-[#f5f0ea] border-[#e0d5c8] text-[#6b7a72] hover:border-[#c8d8d0]"
                  }`}
                >
                  <DeliveryIcon method={method} size={16} />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Dose & Schedule */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <p className="text-xs text-[#6b7a72]">Dose and schedule for <strong>{name}</strong>.</p>
            <div className="space-y-1">
              <label className="ripple-label">Dose</label>
              <Input
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g. 1.5mg, 2 pumps, 200mg"
                className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]"
              />
            </div>
            <div className="space-y-1">
              <label className="ripple-label">Schedule</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(HRT_SCHEDULE_LABELS) as [HRTScheduleType, string][]).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setScheduleType(type)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      scheduleType === type
                        ? "bg-[#eef4f1] border-[#4a8a72] text-[#1a2b22]"
                        : "bg-[#f5f0ea] border-[#e0d5c8] text-[#6b7a72] hover:border-[#c8d8d0]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule-specific options */}
            {scheduleType === "every_n_days" && (
              <div className="space-y-1">
                <label className="ripple-label">Every how many days?</label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="30"
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(e.target.value)}
                  className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]"
                />
                <p className="text-[10px] text-[#9a9490]">Use 3.5 for a patch changed every 3–4 days</p>
              </div>
            )}

            {scheduleType === "days_of_week" && (
              <div className="space-y-2">
                <label className="ripple-label">Which days?</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS_OF_WEEK.map((day, i) => (
                    <button
                      key={day}
                      onClick={() => toggleDayOfWeek(i)}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all ${
                        daysOfWeek.includes(i)
                          ? "bg-[#4a8a72] text-white border-[#4a8a72]"
                          : "bg-[#f5f0ea] text-[#6b7a72] border-[#e0d5c8] hover:border-[#c8d8d0]"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {scheduleType === "cycle_days" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="ripple-label">From day</label>
                  <Input type="number" min="1" max="35" value={cycleDayStart} onChange={(e) => setCycleDayStart(e.target.value)} className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]" />
                </div>
                <div className="space-y-1">
                  <label className="ripple-label">To day</label>
                  <Input type="number" min="1" max="35" value={cycleDayEnd} onChange={(e) => setCycleDayEnd(e.target.value)} className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]" />
                </div>
              </div>
            )}

            {(scheduleType === "daily" || scheduleType === "cycle_days") && (
              <div className="space-y-1">
                <label className="ripple-label">Time of day</label>
                <Input type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]" />
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Start Date & Notes */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <p className="text-xs text-[#6b7a72]">When did you start <strong>{name}</strong>?</p>
            <div className="space-y-1">
              <label className="ripple-label">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]" />
              <div className="flex items-start gap-2 bg-[#eef4f1] rounded-xl p-3">
                <Info className="w-3.5 h-3.5 text-[#4a8a72] shrink-0 mt-0.5" />
                <p className="text-[10px] text-[#6b7a72] leading-relaxed">
                  The start date is used to calculate your <strong>Treatment Response</strong> — comparing your symptoms before and after starting this medication.
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <label className="ripple-label">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Apply to inner arm. Take at bedtime."
                rows={3}
                className="w-full bg-[#f5f0ea] border border-[#e0d5c8] rounded-xl p-3.5 text-sm text-[#1a2b22] placeholder-[#9a9490] resize-none focus:outline-none focus:border-[#4a8a72]/50 leading-relaxed"
              />
            </div>
          </motion.div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <p className="text-xs text-[#6b7a72]">Review and confirm your medication details.</p>
            <div className="bg-[#f5f0ea] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#4a8a72]/10 rounded-xl flex items-center justify-center text-[#4a8a72]">
                  <DeliveryIcon method={deliveryMethod} size={20} />
                </div>
                <div>
                  <p className="font-serif text-base font-bold text-[#1a2b22]">{name}</p>
                  <p className="text-xs text-[#6b7a72]">{activeIngredient}</p>
                </div>
              </div>
              {([
                ["Delivery", HRT_DELIVERY_LABELS[deliveryMethod]],
                ["Dose", dose],
                ["Schedule", scheduleDescription()],
                ["Started", startDate],
                ...(notes ? [["Notes", notes]] : []),
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 border-t border-[#e0d5c8] pt-2.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#9a9490] font-bold shrink-0">{label}</p>
                  <p className="text-xs text-[#3a3a32] text-right">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex gap-2 pt-1">
        {step > 0 && (
          <Button variant="outline" onClick={handleBack} className="flex-1 text-xs font-mono border-[#e0d5c8] text-[#6b7a72]">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <Button onClick={handleNext} className="flex-1 bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold rounded-xl">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSave} className="flex-1 bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold rounded-xl">
            <Check className="w-4 h-4 mr-1.5" /> {initial ? "Save Changes" : "Add Medication"}
          </Button>
        )}
      </div>
    </div>
  );
}
