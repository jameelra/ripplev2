import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Heart, Calendar, CheckCircle2, AlertCircle, Info,
  Activity, TrendingUp, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVaultStore } from "../stores/vaultStore";
import { computePSSFromLogs } from "../lib/hrtEngine";

type Mode = "natural" | "surgical" | "early";

const MODE_OPTIONS: Array<{
  value: Mode;
  title: string;
  description: string;
  emoji: string;
  detail: string;
}> = [
  {
    value: "natural",
    title: "Natural Perimenopause",
    emoji: "🌊",
    description: "Gradual hormonal transition with irregular cycles",
    detail: "You still have your ovaries and uterus. Your cycles are becoming irregular. This is the most common perimenopause pathway.",
  },
  {
    value: "surgical",
    title: "Surgical Menopause",
    emoji: "🏥",
    description: "Menopause following hysterectomy or oophorectomy",
    detail: "You have had a hysterectomy, oophorectomy, or both. Surgical menopause is often more abrupt and symptoms can be more intense. Period tracking is not relevant for you.",
  },
  {
    value: "early",
    title: "Early / Premature Menopause",
    emoji: "⏰",
    description: "Menopause before age 45 (POI or early natural)",
    detail: "Your menopause began before age 45, either naturally or due to medical treatment (chemotherapy, radiation). You may have Premature Ovarian Insufficiency (POI).",
  },
];

// ─── Days Since Surgery Counter ───────────────────────────────────────────────
function DaysSinceSurgery({ surgeryDate }: { surgeryDate: string }) {
  const days = useMemo(() => {
    const start = new Date(surgeryDate + "T12:00:00").getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  }, [surgeryDate]);

  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const displayText = years >= 1
    ? `${years} year${years !== 1 ? "s" : ""} ${months % 12} month${months % 12 !== 1 ? "s" : ""}`
    : months >= 1
    ? `${months} month${months !== 1 ? "s" : ""} ${weeks % 4} week${weeks % 4 !== 1 ? "s" : ""}`
    : `${weeks} week${weeks !== 1 ? "s" : ""} ${days % 7} day${days % 7 !== 1 ? "s" : ""}`;

  return (
    <div className="ripple-card p-5 space-y-3 bg-[#faf5f3] border-[#e8d8d0]">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#c07060]" />
        <p className="ripple-label text-[#c07060]">Days Since Surgery</p>
      </div>
      <div className="text-center py-2">
        <p className="font-serif text-5xl font-bold text-[#1a2b22]">{days}</p>
        <p className="text-sm text-[#6b7a72] mt-1">{displayText}</p>
        <p className="text-[10px] text-[#9a9490] mt-0.5 font-mono">since {new Date(surgeryDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {[
          { label: "Weeks", value: weeks },
          { label: "Months", value: months },
          { label: "Days", value: days },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-2 border border-[#e8d8d0]">
            <p className="font-bold text-[#1a2b22] text-base">{value}</p>
            <p className="text-[9px] text-[#9a9490] font-mono uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MenopauseMode() {
  const { menopauseMode, surgeryDate, setMenopauseMode, logs, setToastNotification } = useVaultStore();
  const [selectedMode, setSelectedMode] = useState<Mode>(menopauseMode);
  const [surgeryDateInput, setSurgeryDateInput] = useState(surgeryDate ?? "");
  const [hasChanges, setHasChanges] = useState(false);

  const pssScore = useMemo(() => computePSSFromLogs(logs), [logs]);

  const handleModeChange = (mode: Mode) => {
    setSelectedMode(mode);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (selectedMode === "surgical" && !surgeryDateInput) {
      setToastNotification({ type: "error", title: "Surgery Date Required", description: "Please enter your surgery date to use Surgical Menopause mode." });
      return;
    }
    setMenopauseMode(selectedMode, selectedMode === "surgical" ? surgeryDateInput : undefined);
    setHasChanges(false);
    setToastNotification({ type: "success", title: "Mode Updated", description: `Ripple is now configured for ${MODE_OPTIONS.find((m) => m.value === selectedMode)?.title}.` });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="ripple-section-title">Menopause Mode</h1>
        <p className="text-sm text-[#6b7a72] mt-1">
          Configure Ripple for your specific menopause journey
        </p>
      </div>

      {/* Current mode badge */}
      <div className="flex items-center gap-3 bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-4">
        <span className="text-2xl">{MODE_OPTIONS.find((m) => m.value === menopauseMode)?.emoji}</span>
        <div>
          <p className="text-xs font-bold text-[#1a2b22]">Current Mode</p>
          <p className="text-sm font-bold text-[#4a8a72]">{MODE_OPTIONS.find((m) => m.value === menopauseMode)?.title}</p>
        </div>
        {menopauseMode === "surgical" && surgeryDate && (
          <div className="ml-auto text-right">
            <p className="text-[10px] text-[#9a9490] font-mono">Surgery date</p>
            <p className="text-xs font-bold text-[#1a2b22]">{surgeryDate}</p>
          </div>
        )}
      </div>

      {/* Days since surgery (surgical mode only) */}
      {menopauseMode === "surgical" && surgeryDate && (
        <DaysSinceSurgery surgeryDate={surgeryDate} />
      )}

      {/* Symptom summary for surgical users */}
      {menopauseMode === "surgical" && logs.length > 0 && (
        <div className="ripple-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#4a8a72]" />
            <p className="ripple-label">Symptom Overview</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f5f0ea] rounded-xl p-3 text-center">
              <p className="text-[9px] font-mono uppercase tracking-wider text-[#9a9490] font-bold">PSS Score</p>
              <p className="font-serif text-2xl font-bold text-[#1a2b22]">{pssScore}</p>
              <p className="text-[10px] text-[#9a9490]">out of 100</p>
            </div>
            <div className="bg-[#f5f0ea] rounded-xl p-3 text-center">
              <p className="text-[9px] font-mono uppercase tracking-wider text-[#9a9490] font-bold">Days Tracked</p>
              <p className="font-serif text-2xl font-bold text-[#1a2b22]">{logs.length}</p>
              <p className="text-[10px] text-[#9a9490]">total logs</p>
            </div>
          </div>
          <p className="text-[10px] text-[#9a9490] leading-relaxed">
            Surgical menopause symptoms are often more intense than natural perimenopause. Your symptom tracking data is especially important for your GP to understand your experience.
          </p>
        </div>
      )}

      {/* Mode selector */}
      <div className="space-y-3">
        <p className="ripple-label">Change Mode</p>
        {MODE_OPTIONS.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => handleModeChange(option.value)}
            className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all ${
              selectedMode === option.value
                ? "bg-[#eef4f1] border-[#4a8a72] ring-2 ring-[#4a8a72]/20"
                : "bg-[#f5f0ea] border-[#e0d5c8] hover:border-[#c8d8d0]"
            }`}
          >
            <span className="text-2xl shrink-0 mt-0.5">{option.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-[#1a2b22]">{option.title}</p>
                {selectedMode === option.value && <CheckCircle2 className="w-4 h-4 text-[#4a8a72] shrink-0" />}
              </div>
              <p className="text-xs text-[#6b7a72] mt-0.5">{option.description}</p>
              {selectedMode === option.value && (
                <p className="text-[10px] text-[#4a8a72] mt-1.5 leading-relaxed">{option.detail}</p>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Surgery date input (surgical mode only) */}
      {selectedMode === "surgical" && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
          <label className="ripple-label">Surgery Date</label>
          <Input
            type="date"
            value={surgeryDateInput}
            onChange={(e) => { setSurgeryDateInput(e.target.value); setHasChanges(true); }}
            max={new Date().toISOString().split("T")[0]}
            className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]"
          />
          <p className="text-[10px] text-[#9a9490] leading-relaxed">
            Your surgery date is used to calculate "Days Since Surgery" and is stored encrypted in your vault.
          </p>
        </motion.div>
      )}

      {/* What changes in each mode */}
      <div className="ripple-card p-4 space-y-3">
        <p className="ripple-label">What changes in Surgical Mode</p>
        <div className="space-y-2 text-xs text-[#4a4a42]">
          {[
            { icon: "✅", text: "Period and cycle tracking UI is hidden throughout the app" },
            { icon: "✅", text: "Cycle Calendar is replaced with a Days Since Surgery counter" },
            { icon: "✅", text: "GP brief notes surgical menopause context" },
            { icon: "✅", text: "Symptom tracking, HRT tracker, and all other features remain fully active" },
            { icon: "✅", text: "Evidence Engine generates a surgical-menopause-aware GP brief" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="shrink-0">{item.icon}</span>
              <p className="leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical note for surgical users */}
      {selectedMode === "surgical" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Clinical note:</strong> Surgical menopause often causes more abrupt and intense symptoms than natural perimenopause. NAMS guidelines recommend discussing hormone therapy with your doctor promptly after oophorectomy, as the cardiovascular and bone density benefits of HRT are particularly important for surgical menopause.
          </p>
        </div>
      )}

      {/* Save button */}
      {hasChanges && (
        <Button
          onClick={handleSave}
          className="w-full bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold py-4 rounded-xl"
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          Save Mode Settings
        </Button>
      )}

      {/* Footer */}
      <div className="flex items-start gap-2 text-[10px] text-[#9a9490] bg-[#f5f0ea] rounded-xl p-3.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Your menopause mode is stored locally on your device. You can change it at any time. Changing mode does not delete any of your existing tracking data.
        </p>
      </div>
    </div>
  );
}
