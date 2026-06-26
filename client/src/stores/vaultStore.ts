import { create } from "zustand";
import {
  DayLog,
  DismissalRecord,
  LicenseTier,
  HRTMedication,
  HRTDoseLog,
  TriggerAnalysis,
  DEFAULT_SYMPTOMS,
  DEFAULT_SIGNALS,
  DEFAULT_CYCLE,
} from "../../../shared/types";
import { CycleEvent } from "../lib/cycleIntelligence";
import { computeTriggerCorrelations } from "../lib/hrtEngine";
import {
  deriveKey,
  encryptData,
  decryptData,
  encryptAndSave,
  loadAndDecrypt,
  getOrCreateSalt,
  AMBIENT_PASSPHRASE,
  VAULT_VERIFICATION_TOKEN,
  VAULT_VERIFICATION_KEY,
  VAULT_TYPE_KEY,
  VAULT_CONFIGURED_KEY,
  ONBOARDING_KEY,
  LEGAL_ACCEPTED_KEY,
} from "../lib/crypto";

export type TabId =
  | "dashboard"
  | "log_signals"
  | "evidence_engine"
  | "reverse_lookup"
  | "ai_diary"
  | "cycle_tracker"
  | "upgrade_hub"
  | "resources"
  | "clinical_kb"
  | "dismissal_tracker"
  | "cycle_calendar"
  | "correlations"
  | "hrt_tracker"
  | "trigger_tracker"
  | "quick_log"
  | "settings";

export interface ToastNotification {
  type: "success" | "error" | "info";
  title: string;
  description: string;
}

interface VaultState {
  // Auth & vault
  sessionKey: CryptoKey | null;
  isVaultConfigured: boolean;
  vaultType: "ambient" | "pin" | null;
  isOnboardingCompleted: boolean;
  isLegalAccepted: boolean;

  // App state
  logs: DayLog[];
  dismissals: DismissalRecord[];
  cycleEvents: CycleEvent[];
  hrtMedications: HRTMedication[];
  hrtDoseLogs: HRTDoseLog[];
  triggerAnalysis: TriggerAnalysis | null;
  licenseTier: LicenseTier;
  activeTab: TabId;
  toastNotification: ToastNotification | null;
  isMobileMenuOpen: boolean;

  // Actions
  setSessionKey: (key: CryptoKey | null) => void;
  setIsVaultConfigured: (v: boolean) => void;
  setVaultType: (t: "ambient" | "pin") => void;
  setIsOnboardingCompleted: (v: boolean) => void;
  setIsLegalAccepted: (v: boolean) => void;
  setLogs: (logs: DayLog[]) => void;
  setDismissals: (d: DismissalRecord[]) => void;
  setCycleEvents: (events: CycleEvent[]) => void;
  addCycleEvent: (event: CycleEvent) => Promise<void>;
  removeCycleEvent: (id: string) => Promise<void>;
  // HRT actions
  addHRTMedication: (med: HRTMedication) => Promise<void>;
  updateHRTMedication: (med: HRTMedication) => Promise<void>;
  removeHRTMedication: (id: string) => Promise<void>;
  logHRTDose: (doseLog: HRTDoseLog) => Promise<void>;
  updateTriggerAnalysis: () => void;
  setLicenseTier: (t: LicenseTier) => void;
  setActiveTab: (tab: TabId) => void;
  setToastNotification: (n: ToastNotification | null) => void;
  setIsMobileMenuOpen: (v: boolean) => void;

  // Vault operations
  setupAmbientVault: () => Promise<void>;
  setupPinVault: (pin: string) => Promise<void>;
  unlockAmbientVault: () => Promise<void>;
  unlockPinVault: (pin: string) => Promise<boolean>;
  lockVault: () => void;
  saveLog: (log: DayLog) => Promise<void>;
  loadVaultData: (key: CryptoKey) => Promise<void>;
  resetVault: () => void;
  getLogForToday: () => DayLog | undefined;
  addDismissal: (record: DismissalRecord) => Promise<void>;
  updateDismissal: (record: DismissalRecord) => Promise<void>;
  removeDismissal: (id: string) => Promise<void>;
}

const TODAY = () => new Date().toISOString().split("T")[0];

export const useVaultStore = create<VaultState>((set, get) => ({
  // Initial state
  sessionKey: null,
  isVaultConfigured: localStorage.getItem(VAULT_CONFIGURED_KEY) === "true",
  vaultType: (localStorage.getItem(VAULT_TYPE_KEY) as "ambient" | "pin" | null),
  isOnboardingCompleted: localStorage.getItem(ONBOARDING_KEY) === "true",
  isLegalAccepted: localStorage.getItem(LEGAL_ACCEPTED_KEY) === "true",
  logs: [],
  dismissals: [],
  cycleEvents: [],
  hrtMedications: [],
  hrtDoseLogs: [],
  triggerAnalysis: null,
  licenseTier: (localStorage.getItem("ripple_license_tier") as LicenseTier) || "Free",
  activeTab: "dashboard",
  toastNotification: null,
  isMobileMenuOpen: false,

  // Simple setters
  setSessionKey: (key) => set({ sessionKey: key }),
  setIsVaultConfigured: (v) => {
    localStorage.setItem(VAULT_CONFIGURED_KEY, String(v));
    set({ isVaultConfigured: v });
  },
  setVaultType: (t) => {
    localStorage.setItem(VAULT_TYPE_KEY, t);
    set({ vaultType: t });
  },
  setIsOnboardingCompleted: (v) => {
    localStorage.setItem(ONBOARDING_KEY, String(v));
    set({ isOnboardingCompleted: v });
  },
  setIsLegalAccepted: (v: boolean) => {
    localStorage.setItem(LEGAL_ACCEPTED_KEY, String(v));
    set({ isLegalAccepted: v });
  },
  setLogs: (logs) => set({ logs }),
  setDismissals: (d) => set({ dismissals: d }),
  setCycleEvents: (events) => set({ cycleEvents: events }),
  setLicenseTier: (t) => {
    localStorage.setItem("ripple_license_tier", t);
    set({ licenseTier: t });
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setToastNotification: (n) => {
    set({ toastNotification: n });
    if (n) setTimeout(() => set({ toastNotification: null }), 4000);
  },
  setIsMobileMenuOpen: (v) => set({ isMobileMenuOpen: v }),

  // ── Vault Setup ──────────────────────────────────────────────────────────
  setupAmbientVault: async () => {
    const salt = getOrCreateSalt();
    const key = await deriveKey(AMBIENT_PASSPHRASE, salt);
    const verification = await encryptData(VAULT_VERIFICATION_TOKEN, key);
    localStorage.setItem(VAULT_VERIFICATION_KEY, JSON.stringify(verification));
    localStorage.setItem(VAULT_TYPE_KEY, "ambient");
    localStorage.setItem(VAULT_CONFIGURED_KEY, "true");

    // Initialise empty vault
    await encryptAndSave("ripple_day_logs", JSON.stringify([]), key);
    await encryptAndSave("ripple_dismissals", JSON.stringify([]), key);

    set({
      sessionKey: key,
      isVaultConfigured: true,
      vaultType: "ambient",
      logs: [],
      dismissals: [],
    });
  },

  setupPinVault: async (pin: string) => {
    const salt = getOrCreateSalt();
    const key = await deriveKey(pin, salt);
    const verification = await encryptData(VAULT_VERIFICATION_TOKEN, key);
    localStorage.setItem(VAULT_VERIFICATION_KEY, JSON.stringify(verification));
    localStorage.setItem(VAULT_TYPE_KEY, "pin");
    localStorage.setItem(VAULT_CONFIGURED_KEY, "true");

    await encryptAndSave("ripple_day_logs", JSON.stringify([]), key);
    await encryptAndSave("ripple_dismissals", JSON.stringify([]), key);

    set({
      sessionKey: key,
      isVaultConfigured: true,
      vaultType: "pin",
      logs: [],
      dismissals: [],
    });
  },

  unlockAmbientVault: async () => {
    const salt = getOrCreateSalt();
    const key = await deriveKey(AMBIENT_PASSPHRASE, salt);
    const verificationPayload = localStorage.getItem(VAULT_VERIFICATION_KEY);
    if (verificationPayload) {
      const parsed = JSON.parse(verificationPayload);
      const result = await decryptData(parsed.iv, parsed.data, key);
      if (result === VAULT_VERIFICATION_TOKEN) {
        set({ sessionKey: key });
        await get().loadVaultData(key);
        return;
      }
    }
    throw new Error("Ambient vault verification failed");
  },

  unlockPinVault: async (pin: string): Promise<boolean> => {
    const salt = getOrCreateSalt();
    const key = await deriveKey(pin, salt);
    const verificationPayload = localStorage.getItem(VAULT_VERIFICATION_KEY);
    if (!verificationPayload) return false;
    try {
      const parsed = JSON.parse(verificationPayload);
      const result = await decryptData(parsed.iv, parsed.data, key);
      if (result === VAULT_VERIFICATION_TOKEN) {
        set({ sessionKey: key });
        await get().loadVaultData(key);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  lockVault: () => {
    set({
      sessionKey: null,
      logs: [],
      dismissals: [],
      cycleEvents: [],
      hrtMedications: [],
      hrtDoseLogs: [],
      triggerAnalysis: null,
    });
  },

  // ── Data Operations ───────────────────────────────────────────────────────
  loadVaultData: async (key: CryptoKey) => {
    const logsRaw = await loadAndDecrypt("ripple_day_logs", key);
    const dismissalsRaw = await loadAndDecrypt("ripple_dismissals", key);
    const cycleEventsRaw = await loadAndDecrypt("ripple_cycle_events", key);
    const hrtMedsRaw = await loadAndDecrypt("ripple_hrt_medications", key);
    const hrtDoseLogsRaw = await loadAndDecrypt("ripple_hrt_dose_logs", key);
    const logs: DayLog[] = logsRaw ? JSON.parse(logsRaw) : [];
    const dismissals: DismissalRecord[] = dismissalsRaw ? JSON.parse(dismissalsRaw) : [];
    const cycleEvents: CycleEvent[] = cycleEventsRaw ? JSON.parse(cycleEventsRaw) : [];
    const hrtMedications: HRTMedication[] = hrtMedsRaw ? JSON.parse(hrtMedsRaw) : [];
    const hrtDoseLogs: HRTDoseLog[] = hrtDoseLogsRaw ? JSON.parse(hrtDoseLogsRaw) : [];
    // Compute trigger analysis from loaded logs
    const triggerAnalysis = computeTriggerCorrelations(logs);
    set({ logs, dismissals, cycleEvents, hrtMedications, hrtDoseLogs, triggerAnalysis });
  },

  addCycleEvent: async (event: CycleEvent) => {
    const { sessionKey, cycleEvents } = get();
    if (!sessionKey) return;
    // Remove any existing event of the same type on the same date (idempotent)
    const filtered = cycleEvents.filter(
      (e: CycleEvent) => !(e.date === event.date && e.type === event.type)
    );
    const updated = [...filtered, event].sort((a, b) => a.date.localeCompare(b.date));
    await encryptAndSave("ripple_cycle_events", JSON.stringify(updated), sessionKey);
    set({ cycleEvents: updated });
  },

  removeCycleEvent: async (id: string) => {
    const { sessionKey, cycleEvents } = get();
    if (!sessionKey) return;
    const updated = cycleEvents.filter((e: CycleEvent) => e.id !== id);
    await encryptAndSave("ripple_cycle_events", JSON.stringify(updated), sessionKey);
    set({ cycleEvents: updated });
  },

  saveLog: async (log: DayLog) => {
    const { sessionKey, logs } = get();
    if (!sessionKey) return;
    const existing = logs.findIndex((l: DayLog) => l.id === log.id);
    const updated = existing >= 0
      ? logs.map((l: DayLog) => (l.id === log.id ? log : l))
      : [...logs, log];
    await encryptAndSave("ripple_day_logs", JSON.stringify(updated), sessionKey);
    set({ logs: updated });
    // Recompute trigger analysis after every log save
    const triggerAnalysis = computeTriggerCorrelations(updated);
    set({ triggerAnalysis });
  },

  resetVault: () => {
    [
      "ripple_day_logs",
      "ripple_dismissals",
      VAULT_CONFIGURED_KEY,
      VAULT_VERIFICATION_KEY,
      "ripple_vault_salt",
      VAULT_TYPE_KEY,
      ONBOARDING_KEY,
      LEGAL_ACCEPTED_KEY,
      "ripple_license_tier",
      "ripple_cycle_events",
      "ripple_hrt_medications",
      "ripple_hrt_dose_logs",
    ].forEach((k: string) => localStorage.removeItem(k));
    set({
      sessionKey: null,
      isVaultConfigured: false,
      vaultType: null,
      isOnboardingCompleted: false,
      isLegalAccepted: false,
      logs: [],
      dismissals: [],
      cycleEvents: [],
      hrtMedications: [],
      hrtDoseLogs: [],
      triggerAnalysis: null,
      licenseTier: "Free",
    });
  },

  getLogForToday: () => {
    const today = TODAY();
    return get().logs.find((l) => l.id === today);
  },

  // ── HRT & Trigger Actions ────────────────────────────────────────────────
  addHRTMedication: async (med: HRTMedication) => {
    const { sessionKey, hrtMedications } = get();
    if (!sessionKey) return;
    const updated = [...hrtMedications, med];
    await encryptAndSave("ripple_hrt_medications", JSON.stringify(updated), sessionKey);
    set({ hrtMedications: updated });
  },

  updateHRTMedication: async (med: HRTMedication) => {
    const { sessionKey, hrtMedications } = get();
    if (!sessionKey) return;
    const updated = hrtMedications.map((m: HRTMedication) => m.id === med.id ? med : m);
    await encryptAndSave("ripple_hrt_medications", JSON.stringify(updated), sessionKey);
    set({ hrtMedications: updated });
  },

  removeHRTMedication: async (id: string) => {
    const { sessionKey, hrtMedications } = get();
    if (!sessionKey) return;
    const updated = hrtMedications.filter((m: HRTMedication) => m.id !== id);
    await encryptAndSave("ripple_hrt_medications", JSON.stringify(updated), sessionKey);
    set({ hrtMedications: updated });
  },

  logHRTDose: async (doseLog: HRTDoseLog) => {
    const { sessionKey, hrtDoseLogs } = get();
    if (!sessionKey) return;
    // Replace any existing log for the same medication on the same day
    const filtered = hrtDoseLogs.filter(
      (d: HRTDoseLog) => !(d.medicationId === doseLog.medicationId && d.scheduledDate === doseLog.scheduledDate)
    );
    const updated = [...filtered, doseLog].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    await encryptAndSave("ripple_hrt_dose_logs", JSON.stringify(updated), sessionKey);
    set({ hrtDoseLogs: updated });
  },

  updateTriggerAnalysis: () => {
    const { logs } = get();
    const analysis = computeTriggerCorrelations(logs);
    set({ triggerAnalysis: analysis });
  },

  addDismissal: async (record: DismissalRecord) => {
    const { sessionKey, dismissals } = get();
    if (!sessionKey) return;
    const updated = [...dismissals, record];
    await encryptAndSave("ripple_dismissals", JSON.stringify(updated), sessionKey);
    set({ dismissals: updated });
  },

  updateDismissal: async (record: DismissalRecord) => {
    const { sessionKey, dismissals } = get();
    if (!sessionKey) return;
    const updated = dismissals.map((d: DismissalRecord) => d.id === record.id ? record : d);
    await encryptAndSave("ripple_dismissals", JSON.stringify(updated), sessionKey);
    set({ dismissals: updated });
  },

  removeDismissal: async (id: string) => {
    const { sessionKey, dismissals } = get();
    if (!sessionKey) return;
    const updated = dismissals.filter((d: DismissalRecord) => d.id !== id);
    await encryptAndSave("ripple_dismissals", JSON.stringify(updated), sessionKey);
    set({ dismissals: updated });
  },
}));

