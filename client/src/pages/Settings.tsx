import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Lock, Trash2, Download, Bell, BellOff, Heart, ShieldCheck,
  AlertCircle, CheckCircle2, ChevronRight, Info, RefreshCw,
  Eye, EyeOff, Moon, Sun, Smartphone, UserCircle, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useVaultStore } from "../stores/vaultStore";
import { useAuth } from "@/contexts/AuthContext";

// ─── Section wrapper ──────────────────────────────────────────────────────────
function SettingsSection({
  title,
  icon: Icon,
  children,
  color = "text-[#4a8a72]",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="ripple-label">{title}</p>
      </div>
      <div className="ripple-card divide-y divide-[#f0ebe4] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ─── Settings row ─────────────────────────────────────────────────────────────
function SettingsRow({
  label,
  description,
  right,
  onClick,
  danger = false,
}: {
  label: string;
  description?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const content = (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? "text-red-600" : "text-[#1a2b22]"}`}>{label}</p>
        {description && <p className="text-[10px] text-[#9a9490] leading-relaxed mt-0.5">{description}</p>}
      </div>
      {right ?? (onClick && <ChevronRight className="w-4 h-4 text-[#9a9490] shrink-0" />)}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={`w-full text-left hover:bg-[#faf8f5] transition-colors ${danger ? "hover:bg-red-50" : ""}`}>
        {content}
      </button>
    );
  }
  return <div>{content}</div>;
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const {
    vaultType,
    licenseTier,
    menopauseMode,
    surgeryDate,
    logs,
    dismissals,
    hrtMedications,
    hrtDoseLogs,
    cycleEvents,
    triggerExperiments,
    lockVault,
    resetVault,
    setMenopauseMode,
    setActiveTab,
    setToastNotification,
  } = useVaultStore();
  const { user, signOut, openAuthModal } = useAuth();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetInput, setResetInput] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem("ripple_notifications") !== "false"
  );
  const [dailyReminderTime, setDailyReminderTime] = useState(
    localStorage.getItem("ripple_reminder_time") ?? "20:00"
  );
  const [showPin, setShowPin] = useState(false);

  const totalDataPoints =
    logs.length +
    dismissals.length +
    hrtMedications.length +
    hrtDoseLogs.length +
    cycleEvents.length +
    triggerExperiments.length;

  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem("ripple_notifications", String(enabled));
    if (enabled && "Notification" in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === "denied") {
          setToastNotification({
            type: "error",
            title: "Notifications Blocked",
            description: "Please enable notifications in your browser settings.",
          });
          setNotificationsEnabled(false);
        }
      });
    }
    setToastNotification({
      type: "success",
      title: enabled ? "Notifications Enabled" : "Notifications Disabled",
      description: enabled ? "You will receive daily logging reminders." : "Daily reminders have been turned off.",
    });
  };

  const handleSaveReminderTime = () => {
    localStorage.setItem("ripple_reminder_time", dailyReminderTime);
    setToastNotification({
      type: "success",
      title: "Reminder Time Saved",
      description: `Daily reminder set for ${dailyReminderTime}.`,
    });
  };

  const handleExportData = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "ripple-v2",
      disclaimer: "This export contains your Ripple health data. Keep it secure.",
      settings: {
        menopauseMode,
        surgeryDate,
        licenseTier,
        vaultType,
      },
      summary: {
        symptomLogs: logs.length,
        dismissalRecords: dismissals.length,
        hrtMedications: hrtMedications.length,
        hrtDoseLogs: hrtDoseLogs.length,
        cycleEvents: cycleEvents.length,
        triggerExperiments: triggerExperiments.length,
      },
      data: {
        logs,
        dismissals,
        hrtMedications,
        hrtDoseLogs,
        cycleEvents,
        triggerExperiments,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ripple-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setToastNotification({
      type: "success",
      title: "Data Exported",
      description: `${totalDataPoints} records exported to ripple-export-${new Date().toISOString().split("T")[0]}.json`,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    setToastNotification({
      type: "info",
      title: "Signed Out",
      description: "You've been logged out. Your encrypted vault stays on this device.",
    });
  };

  const handleResetVault = () => {
    if (resetInput !== "DELETE MY DATA") return;
    resetVault();
    setShowResetConfirm(false);
    setResetInput("");
    setToastNotification({
      type: "info",
      title: "Vault Reset",
      description: "All data has been permanently deleted. Ripple has been reset.",
    });
  };

  const MODE_LABELS: Record<string, string> = {
    natural: "Natural Perimenopause",
    surgical: "Surgical Menopause",
    early: "Early / Premature Menopause",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="ripple-section-title">Settings</h1>
        <p className="text-sm text-[#6b7a72] mt-1">Manage your vault, preferences, and data</p>
      </div>

      {/* Account overview */}
      <div className="ripple-card p-4 space-y-3 bg-[#f5f0ea] border-[#e0d5c8]">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Plan", value: licenseTier },
            { label: "Vault", value: vaultType === "pin" ? "PIN Mode" : "Ambient" },
            { label: "Logs", value: String(logs.length) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[9px] font-mono uppercase tracking-wider text-[#9a9490] font-bold">{label}</p>
              <p className="text-sm font-bold text-[#1a2b22]">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 justify-center text-[10px] text-[#4a8a72] font-mono font-bold">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4a8a72]" />
          <span>Vault Encrypted · Zero-Knowledge</span>
        </div>
      </div>

      {/* Account */}
      <SettingsSection title="Account" icon={UserCircle} color="text-[#4a8a72]">
        {user ? (
          <>
            <SettingsRow
              label={user.email ?? "Signed in"}
              description="Used to sign in and for AI features & billing. Your health data never leaves this device unencrypted."
            />
            <SettingsRow
              label="Log Out"
              description="You'll need to log in again to use AI features or manage billing."
              onClick={handleSignOut}
              danger
            />
          </>
        ) : (
          <SettingsRow
            label="Sign In / Create Account"
            description="Required for AI Diary, Symptom Lookup, Evidence Engine, and billing. Your local vault works without it."
            onClick={openAuthModal}
          />
        )}
      </SettingsSection>

      {/* Vault & Security */}
      <SettingsSection title="Vault & Security" icon={Lock}>
        <SettingsRow
          label="Lock Vault Now"
          description="Lock your encrypted vault and require re-authentication to access your data."
          onClick={() => {
            lockVault();
            setToastNotification({ type: "info", title: "Vault Locked", description: "Your health data has been secured." });
          }}
          right={<Lock className="w-4 h-4 text-[#9a9490]" />}
        />
        <SettingsRow
          label="Vault Mode"
          description={vaultType === "pin" ? "Private PIN Mode — maximum security" : "Frictionless Mode — device-secured"}
          right={
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              vaultType === "pin"
                ? "bg-[#faf5f3] text-[#c07060] border-[#e8d8d0]"
                : "bg-[#eef4f1] text-[#4a8a72] border-[#c8d8d0]"
            }`}>
              {vaultType === "pin" ? "PIN" : "Ambient"}
            </span>
          }
        />
        <SettingsRow
          label="Encryption"
          description="AES-GCM 256-bit · PBKDF2 key derivation · 600,000 iterations"
          right={<ShieldCheck className="w-4 h-4 text-[#4a8a72]" />}
        />
      </SettingsSection>

      {/* Menopause Mode */}
      <SettingsSection title="Menopause Journey Mode" icon={Heart} color="text-[#c07060]">
        <SettingsRow
          label="Current Mode"
          description={MODE_LABELS[menopauseMode] ?? menopauseMode}
          onClick={() => setActiveTab("menopause_mode")}
          right={<ChevronRight className="w-4 h-4 text-[#9a9490]" />}
        />
        {menopauseMode === "surgical" && surgeryDate && (
          <SettingsRow
            label="Surgery Date"
            description={`${new Date(surgeryDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
            onClick={() => setActiveTab("menopause_mode")}
          />
        )}
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection title="Notifications" icon={Bell} color="text-[#6b7a72]">
        <SettingsRow
          label="Daily Logging Reminder"
          description="Get a reminder to log your symptoms each day"
          right={
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
              className="data-[state=checked]:bg-[#4a8a72]"
            />
          }
        />
        {notificationsEnabled && (
          <div className="px-4 py-3.5 space-y-2">
            <p className="text-sm font-semibold text-[#1a2b22]">Reminder Time</p>
            <div className="flex gap-2">
              <Input
                type="time"
                value={dailyReminderTime}
                onChange={(e) => setDailyReminderTime(e.target.value)}
                className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22] flex-1"
              />
              <Button
                onClick={handleSaveReminderTime}
                className="bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold px-4 rounded-xl"
              >
                Save
              </Button>
            </div>
            <p className="text-[10px] text-[#9a9490] leading-relaxed">
              Note: Browser notifications require the app to be open or running as a PWA. For reliable reminders, consider adding Ripple to your home screen.
            </p>
          </div>
        )}
      </SettingsSection>

      {/* Data & Privacy */}
      <SettingsSection title="Data & Privacy" icon={Download}>
        <SettingsRow
          label="Export My Data"
          description={`Download all ${totalDataPoints} records as a JSON file`}
          onClick={handleExportData}
          right={<Download className="w-4 h-4 text-[#9a9490]" />}
        />
        <SettingsRow
          label="Data Summary"
          description={`${logs.length} symptom logs · ${hrtMedications.length} medications · ${dismissals.length} dismissal records · ${cycleEvents.length} cycle events`}
          right={<Info className="w-4 h-4 text-[#9a9490]" />}
        />
        <div className="px-4 py-3.5 space-y-1.5">
          <p className="text-sm font-semibold text-[#1a2b22]">Privacy Commitment</p>
          <div className="space-y-1 text-[10px] text-[#6b7a72] leading-relaxed">
            <p>✓ All health data is encrypted client-side before storage</p>
            <p>✓ We cannot read your health data — zero-knowledge architecture</p>
            <p>✓ No data is sold or shared with third parties</p>
            <p>✓ You can delete all data at any time using the reset option below</p>
          </div>
        </div>
      </SettingsSection>

      {/* About */}
      <SettingsSection title="About Ripple" icon={Info} color="text-[#9a9490]">
        <SettingsRow
          label="Version"
          description="Ripple v2 — Perimenopause Health Companion"
          right={<span className="text-[9px] font-mono text-[#9a9490]">v2.0.0</span>}
        />
        <SettingsRow
          label="Legal & Compliance"
          description="Medical disclaimer, Privacy Policy, Terms of Service"
          right={<ChevronRight className="w-4 h-4 text-[#9a9490]" />}
        />
        <SettingsRow
          label="Plans & Pricing"
          onClick={() => setActiveTab("upgrade_hub")}
          description={`Current plan: ${licenseTier}`}
          right={<ChevronRight className="w-4 h-4 text-[#9a9490]" />}
        />
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection title="Danger Zone" icon={AlertCircle} color="text-red-500">
        {!showResetConfirm ? (
          <SettingsRow
            label="Reset Vault & Delete All Data"
            description="Permanently delete all your health data and reset Ripple. This cannot be undone."
            onClick={() => setShowResetConfirm(true)}
            danger
            right={<Trash2 className="w-4 h-4 text-red-400" />}
          />
        ) : (
          <div className="px-4 py-4 space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-800">This cannot be undone.</p>
                <p className="text-[10px] text-red-700 leading-relaxed mt-0.5">
                  All symptom logs, HRT records, dismissal records, cycle data, and trigger experiments will be permanently deleted. Your vault encryption keys will be destroyed.
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-[#6b7a72]">Type <strong>DELETE MY DATA</strong> to confirm:</p>
              <Input
                value={resetInput}
                onChange={(e) => setResetInput(e.target.value)}
                placeholder="DELETE MY DATA"
                className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22] font-mono text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setShowResetConfirm(false); setResetInput(""); }}
                className="flex-1 text-xs border-[#e0d5c8] text-[#6b7a72]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetVault}
                disabled={resetInput !== "DELETE MY DATA"}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold rounded-xl disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete Everything
              </Button>
            </div>
          </div>
        )}
      </SettingsSection>

      {/* Footer */}
      <div className="text-center space-y-1 pb-4">
        <p className="text-[10px] text-[#9a9490]">Ripple v2 — Privacy-First Perimenopause Companion</p>
        <p className="text-[10px] text-[#9a9490]">For educational purposes only · Not a medical device</p>
      </div>
    </div>
  );
}
