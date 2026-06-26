import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Thermometer, Moon, Brain, Bone, CloudFog, Frown, AlertCircle,
  Battery, Heart, Circle, Droplets, Zap, Save, CheckCircle2,
  Droplet, Activity, Clock, Percent
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useVaultStore } from "../stores/vaultStore";
import {
  SymptomLog as SymptomLogType,
  BiologicalSignals,
  CycleLog,
  DayLog,
  DEFAULT_SYMPTOMS,
  DEFAULT_SIGNALS,
  DEFAULT_CYCLE,
  SeverityScore,
  SEVERITY_LABELS,
} from "../../../shared/types";

// ─── Symptom Config ───────────────────────────────────────────────────────────
const SYMPTOMS: Array<{
  key: keyof SymptomLogType;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  { key: "hotFlashes", label: "Hot Flashes", icon: Thermometer, description: "Sudden warmth, flushing, sweating" },
  { key: "nightSweats", label: "Night Sweats", icon: Moon, description: "Waking drenched, disrupted sleep" },
  { key: "sleepLatency", label: "Sleep Difficulty", icon: Clock, description: "Trouble falling or staying asleep" },
  { key: "jointPain", label: "Joint Pain", icon: Bone, description: "Stiffness, aching, morning rigidity" },
  { key: "brainFog", label: "Brain Fog", icon: CloudFog, description: "Memory lapses, word recall issues" },
  { key: "irritability", label: "Irritability", icon: Frown, description: "Mood swings, low frustration threshold" },
  { key: "anxiety", label: "Anxiety", icon: AlertCircle, description: "Worry, racing thoughts, panic" },
  { key: "fatigue", label: "Fatigue", icon: Battery, description: "Persistent tiredness, low energy" },
  { key: "heartPalpitations", label: "Heart Palpitations", icon: Heart, description: "Racing, fluttering, irregular heartbeat" },
  { key: "breastTenderness", label: "Breast Tenderness", icon: Circle, description: "Soreness, sensitivity, fullness" },
  { key: "bloating", label: "Bloating", icon: Droplets, description: "Abdominal distension, gas, discomfort" },
  { key: "postCarbCrash", label: "Post-Carb Crash", icon: Zap, description: "Energy crash after carbohydrates" },
];

const SEVERITY_COLORS = ["bg-gray-200", "bg-amber-400", "bg-orange-500", "bg-red-500"];
const SEVERITY_TEXT = ["text-gray-500", "text-amber-700", "text-orange-700", "text-red-700"];

// ─── Severity Slider Row ──────────────────────────────────────────────────────
function SymptomSlider({
  symptom,
  value,
  onChange,
}: {
  symptom: (typeof SYMPTOMS)[0];
  value: SeverityScore;
  onChange: (v: SeverityScore) => void;
}) {
  const Icon = symptom.icon;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${SEVERITY_COLORS[value]}/20`}>
            <Icon className={`w-3.5 h-3.5 ${SEVERITY_TEXT[value]}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a2b22]">{symptom.label}</p>
            <p className="text-[10px] text-[#9a9490]">{symptom.description}</p>
          </div>
        </div>
        <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${SEVERITY_COLORS[value]}/20 ${SEVERITY_TEXT[value]}`}>
          {SEVERITY_LABELS[value]}
        </div>
      </div>
      <div className="px-1">
        <Slider
          min={0} max={3} step={1}
          value={[value]}
          onValueChange={([v]) => onChange(v as SeverityScore)}
          className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#4a8a72] [&_[role=slider]]:shadow-sm"
        />
        <div className="flex justify-between mt-1">
          {[0, 1, 2, 3].map((n) => (
            <span key={n} className="text-[9px] text-[#9a9490] font-mono">{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SymptomLog() {
  const { logs, saveLog, setToastNotification, getLogForToday } = useVaultStore();
  const today = new Date().toISOString().split("T")[0];
  const existingLog = getLogForToday();

  const [symptoms, setSymptoms] = useState<SymptomLogType>(
    existingLog?.symptoms ?? { ...DEFAULT_SYMPTOMS }
  );
  const [signals, setSignals] = useState<BiologicalSignals>(
    existingLog?.signals ?? { ...DEFAULT_SIGNALS }
  );
  const [cycle, setCycle] = useState<CycleLog>(
    existingLog?.cycle ?? { ...DEFAULT_CYCLE }
  );
  const [diaryText, setDiaryText] = useState(existingLog?.diaryText ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<"symptoms" | "signals" | "cycle">("symptoms");

  const updateSymptom = (key: keyof SymptomLogType, value: SeverityScore) => {
    setSymptoms((prev) => ({ ...prev, [key]: value }));
  };

  const updateSignal = (key: keyof BiologicalSignals, value: number) => {
    setSignals((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const log: DayLog = {
        id: today,
        date: today,
        symptoms,
        signals,
        cycle,
        diaryText,
        timestamp: new Date().toISOString(),
      };
      await saveLog(log);
      setSaved(true);
      setToastNotification({
        type: "success",
        title: "Log Saved",
        description: "Today's symptoms have been encrypted and saved to your vault.",
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setToastNotification({ type: "error", title: "Save Failed", description: String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const totalSeverity = Object.values(symptoms).reduce((a, b) => a + b, 0);
  const avgSeverity = (totalSeverity / 12).toFixed(1);

  const tabs = [
    { id: "symptoms" as const, label: "Symptoms", count: `${totalSeverity}/36` },
    { id: "signals" as const, label: "Biometrics", count: null },
    { id: "cycle" as const, label: "Cycle", count: cycle.cycleActive ? "Active" : null },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="ripple-section-title">Today's Log</h1>
          <p className="text-sm text-[#6b7a72] mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {existingLog && <span className="ml-2 text-[#4a8a72] font-semibold text-xs">✓ Previously logged</span>}
          </p>
        </div>
        <div className="text-right">
          <p className="ripple-label">Avg Severity</p>
          <p className="font-serif text-2xl font-bold text-[#1a2b22]">{avgSeverity}<span className="text-sm font-sans text-[#6b7a72]">/3</span></p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-[#f5f0ea] p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeSection === tab.id
                ? "bg-white text-[#1a2b22] shadow-sm"
                : "text-[#6b7a72] hover:text-[#1a2b22]"
            }`}
          >
            {tab.label}
            {tab.count && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                activeSection === tab.id ? "bg-[#eef4f1] text-[#4a8a72]" : "bg-[#e0d5c8] text-[#6b7a72]"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Symptoms Section */}
      {activeSection === "symptoms" && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="ripple-card p-5 space-y-5"
        >
          <div>
            <p className="ripple-label mb-0.5">12 Perimenopause Symptoms</p>
            <p className="text-xs text-[#6b7a72]">Rate each symptom from 0 (none) to 3 (severe)</p>
          </div>
          <div className="space-y-5 divide-y divide-[#f0ebe4]">
            {SYMPTOMS.map((symptom, i) => (
              <div key={symptom.key} className={i > 0 ? "pt-5" : ""}>
                <SymptomSlider
                  symptom={symptom}
                  value={symptoms[symptom.key]}
                  onChange={(v) => updateSymptom(symptom.key, v)}
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Biological Signals Section */}
      {activeSection === "signals" && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="ripple-card p-5 space-y-5"
        >
          <div>
            <p className="ripple-label mb-0.5">Biological Signals</p>
            <p className="text-xs text-[#6b7a72]">Log your biometric data for deeper insights</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { key: "sleepDuration" as const, label: "Sleep Duration", icon: Moon, unit: "hours", min: 0, max: 12, step: 0.5, color: "text-indigo-600" },
              { key: "sleepEfficiency" as const, label: "Sleep Efficiency", icon: Percent, unit: "%", min: 0, max: 100, step: 5, color: "text-blue-600" },
              { key: "hrv" as const, label: "Heart Rate Variability", icon: Activity, unit: "ms", min: 10, max: 150, step: 1, color: "text-emerald-600" },
              { key: "restingHeartRate" as const, label: "Resting Heart Rate", icon: Heart, unit: "bpm", min: 40, max: 120, step: 1, color: "text-rose-600" },
            ].map(({ key, label, icon: Icon, unit, min, max, step, color }) => (
              <div key={key} className="space-y-3 bg-[#f5f0ea] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <p className="text-sm font-semibold text-[#1a2b22]">{label}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={min} max={max} step={step}
                      value={signals[key]}
                      onChange={(e) => updateSignal(key, parseFloat(e.target.value) || 0)}
                      className="w-16 text-right text-sm font-bold text-[#1a2b22] bg-white border border-[#e0d5c8] rounded-lg px-2 py-1"
                    />
                    <span className="text-xs text-[#6b7a72]">{unit}</span>
                  </div>
                </div>
                <Slider
                  min={min} max={max} step={step}
                  value={[signals[key]]}
                  onValueChange={([v]) => updateSignal(key, v)}
                  className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#4a8a72]"
                />
                <div className="flex justify-between text-[9px] text-[#9a9490] font-mono">
                  <span>{min}{unit}</span>
                  <span>{max}{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cycle Tracker Section */}
      {activeSection === "cycle" && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="ripple-card p-5 space-y-5"
        >
          <div>
            <p className="ripple-label mb-0.5">Cycle Tracker</p>
            <p className="text-xs text-[#6b7a72]">Log your menstrual cycle patterns</p>
          </div>

          {/* Period Active Toggle */}
          <div className="flex items-center justify-between bg-[#f5f0ea] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Droplet className="w-5 h-5 text-rose-500" />
              <div>
                <p className="text-sm font-bold text-[#1a2b22]">Period Active</p>
                <p className="text-xs text-[#6b7a72]">Is your period currently active?</p>
              </div>
            </div>
            <Switch
              checked={cycle.cycleActive}
              onCheckedChange={(v) => setCycle((prev) => ({ ...prev, cycleActive: v }))}
              className="data-[state=checked]:bg-rose-500"
            />
          </div>

          {/* Flow Intensity */}
          {cycle.cycleActive && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#1a2b22]">Flow Intensity</p>
              <div className="grid grid-cols-4 gap-2">
                {(["spotting", "light", "medium", "heavy"] as const).map((intensity) => (
                  <button
                    key={intensity}
                    onClick={() => setCycle((prev) => ({ ...prev, flowIntensity: intensity }))}
                    className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                      cycle.flowIntensity === intensity
                        ? "bg-rose-500 text-white border-rose-500"
                        : "bg-[#f5f0ea] text-[#6b7a72] border-[#e0d5c8] hover:border-rose-300"
                    }`}
                  >
                    {intensity}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Spotting */}
          <div className="flex items-center justify-between bg-[#f5f0ea] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Circle className="w-5 h-5 text-pink-400" />
              <div>
                <p className="text-sm font-bold text-[#1a2b22]">Spotting</p>
                <p className="text-xs text-[#6b7a72]">Light, irregular bleeding between periods</p>
              </div>
            </div>
            <Switch
              checked={cycle.spotting}
              onCheckedChange={(v) => setCycle((prev) => ({ ...prev, spotting: v }))}
              className="data-[state=checked]:bg-pink-400"
            />
          </div>

          {/* Irregular Pattern Detection */}
          {logs.length >= 3 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-bold text-amber-800">Cycle Pattern Note</p>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Irregular cycles are a hallmark of perimenopause. Your logged patterns will be included in your Evidence Engine report to help your GP understand your transition timeline.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Diary Text */}
      <div className="ripple-card p-5 space-y-3">
        <div>
          <p className="ripple-label mb-0.5">Daily Journal</p>
          <p className="text-xs text-[#6b7a72]">Describe how you feel today — the AI will extract additional insights</p>
        </div>
        <textarea
          value={diaryText}
          onChange={(e) => setDiaryText(e.target.value)}
          placeholder="e.g. Woke up at 3am drenched in sweat, joint stiffness in my hands this morning, brain fog all afternoon..."
          rows={4}
          className="w-full bg-[#f5f0ea] border border-[#e0d5c8] rounded-xl p-3.5 text-sm text-[#1a2b22] placeholder-[#9a9490] resize-none focus:outline-none focus:border-[#4a8a72]/50 leading-relaxed"
        />
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full font-mono text-sm font-bold py-4 rounded-xl transition-all ${
          saved
            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
            : "bg-[#4a8a72] hover:bg-[#3a7060] text-white"
        }`}
      >
        {isSaving ? (
          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Encrypting & Saving…</span>
        ) : saved ? (
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Saved to Vault ✓</span>
        ) : (
          <span className="flex items-center gap-2"><Save className="w-4 h-4" />Save Today's Log</span>
        )}
      </Button>
    </div>
  );
}
