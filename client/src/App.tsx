import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, PlusCircle, Sparkles, Binary, Compass,
  CreditCard, LogOut, Menu, X, Lock, ShieldCheck, Crown, BookOpen,
  FlaskConical, ShieldAlert, CalendarDays, TrendingUp, Pill
} from "lucide-react";
import { useVaultStore, TabId } from "./stores/vaultStore";
import Onboarding from "./pages/Onboarding";
import VaultGate from "./pages/VaultGate";
import Dashboard from "./pages/Dashboard";
import SymptomLog from "./pages/SymptomLog";
import AIDiary from "./pages/AIDiary";
import EvidenceEngine from "./pages/EvidenceEngine";
import ReverseLookup from "./pages/ReverseLookup";
import UpgradeHub from "./pages/UpgradeHub";
import Resources from "./pages/Resources";
import ClinicalKnowledgeBase from "./pages/ClinicalKnowledgeBase";
import DismissalTracker from "./pages/DismissalTracker";
import CycleCalendar from "./pages/CycleCalendar";
import CorrelationsPage from "./pages/CorrelationsPage";
import HRTTracker from "./pages/HRTTracker";

// ─── Ripple Logo ──────────────────────────────────────────────────────────────
function RippleLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center shrink-0 select-none">
      <div className="absolute inset-0 rounded-full bg-[#f5f0ea] border border-[#e0d5c8] flex items-center justify-center">
        <div className="w-[80%] h-[80%] rounded-full border border-[#c8d8d0]/60 bg-[#eef4f1] flex items-center justify-center">
          <div className="w-[60%] h-[60%] rounded-full border border-[#a8c8bc]/70 bg-[#dbeee7] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#c07060]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toast Notification ───────────────────────────────────────────────────────
function ToastNotification() {
  const { toastNotification, setToastNotification } = useVaultStore();
  if (!toastNotification) return null;
  return (
    <AnimatePresence>
      <motion.div
        key="toast"
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full bg-white border border-[#e0d5c8] rounded-2xl p-4 shadow-xl flex items-start gap-3"
      >
        {toastNotification.type === "success" ? (
          <ShieldCheck className="w-5 h-5 text-[#4a8a72] shrink-0 mt-0.5" />
        ) : toastNotification.type === "error" ? (
          <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        ) : (
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1a2b22]">{toastNotification.title}</p>
          <p className="text-xs text-[#6b7a72] mt-0.5 leading-relaxed">{toastNotification.description}</p>
        </div>
        <button onClick={() => setToastNotification(null)} className="text-[#9a9490] hover:text-[#1a2b22] shrink-0">
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Navigation Config ────────────────────────────────────────────────────────
const NAV_ITEMS: Array<{ id: TabId; label: string; icon: React.ElementType; tier?: "Pro" | "Premier" }> = [
  { id: "dashboard", label: "My Dashboard", icon: BarChart2 },
  { id: "log_signals", label: "Today's Log", icon: PlusCircle },
  { id: "ai_diary", label: "AI Diary", icon: Sparkles, tier: "Pro" },
  { id: "evidence_engine", label: "Evidence Engine", icon: Binary },
  { id: "reverse_lookup", label: "Symptom Lookup", icon: Compass },
  { id: "hrt_tracker", label: "HRT Tracker", icon: Pill },
  { id: "cycle_calendar", label: "Cycle Calendar", icon: CalendarDays },
  { id: "correlations", label: "Correlations", icon: TrendingUp },
  { id: "clinical_kb", label: "Symptom Library", icon: FlaskConical },
  { id: "dismissal_tracker", label: "Dismissal Tracker", icon: ShieldAlert },
  { id: "upgrade_hub", label: "Upgrade Hub", icon: CreditCard },
  { id: "resources", label: "Resources", icon: BookOpen },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ onClose }: { onClose?: () => void }) {
  const { activeTab, setActiveTab, licenseTier, lockVault } = useVaultStore();

  const handleNav = (tab: TabId) => {
    setActiveTab(tab);
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[#f0ebe4]">
        <div className="flex items-center gap-2.5">
          <RippleLogo size={28} />
          <div>
            <span className="text-sm font-serif font-bold text-[#1a2b22]">Ripple</span>
            <span className="text-[8px] font-mono bg-[#eae5de] text-[#6b7a72] border border-[#ddd8d0] px-1.5 py-0.5 rounded ml-1.5">v2</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-[#9a9490] hover:text-[#1a2b22]">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[9px] font-mono uppercase tracking-widest text-[#9a9490] font-bold px-2 mb-2">Navigation</p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isUpgrade = item.id === "upgrade_hub";
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left border ${
                isActive
                  ? isUpgrade
                    ? "bg-[#faf5f3] border-[#e8d8d0] text-[#c07060]"
                    : "bg-[#eef4f1] border-[#c8d8d0] text-[#1a2b22]"
                  : isUpgrade
                    ? "border-dashed border-[#e0d5c8] text-[#c07060] hover:bg-[#faf5f3]"
                    : "border-transparent text-[#6b7a72] hover:text-[#1a2b22] hover:bg-[#f5f0ea]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? isUpgrade ? "text-[#c07060]" : "text-[#4a8a72]" : "text-[#9a9490]"}`} />
                <span>{item.label}</span>
              </div>
              {item.tier && !isActive && (
                <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border font-bold ${
                  item.tier === "Premier"
                    ? "bg-[#faf5f3] text-[#c07060] border-[#e8d8d0]"
                    : "bg-[#eef4f1] text-[#4a8a72] border-[#c8d8d0]"
                }`}>
                  {item.tier}
                </span>
              )}
              {isUpgrade && !isActive && (
                <span className="text-[8px] font-mono uppercase tracking-wider bg-[#faf5f3] text-[#c07060] border border-[#e8d8d0] px-1.5 py-0.5 rounded font-bold">
                  Plans
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#f0ebe4] space-y-3">
        <div className="flex items-center gap-2 text-[10px] text-[#6b7a72]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4a8a72]" />
          <span>Vault Encrypted · {licenseTier} Plan</span>
        </div>
        <button
          onClick={lockVault}
          className="w-full flex items-center gap-2 text-xs text-[#6b7a72] hover:text-[#c07060] hover:bg-[#faf5f3] px-3 py-2 rounded-xl transition-all border border-transparent hover:border-[#e8d8d0]"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lock Vault</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main App Shell ───────────────────────────────────────────────────────────
function AppShell() {
  const { activeTab, isMobileMenuOpen, setIsMobileMenuOpen } = useVaultStore();

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "log_signals": return <SymptomLog />;
      case "ai_diary": return <AIDiary />;
      case "evidence_engine": return <EvidenceEngine />;
      case "reverse_lookup": return <ReverseLookup />;
      case "upgrade_hub": return <UpgradeHub />;
      case "resources": return <Resources />;
      case "hrt_tracker": return <HRTTracker />;
      case "cycle_calendar": return <CycleCalendar />;
      case "correlations": return <CorrelationsPage />;
      case "clinical_kb": return <ClinicalKnowledgeBase />;
      case "dismissal_tracker": return <DismissalTracker />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0ea] flex flex-col">
      {/* Top bar (mobile) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e0d5c8] h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <RippleLogo size={26} />
          <span className="text-sm font-serif font-bold text-[#1a2b22]">Ripple</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono text-[#4a8a72] font-bold hidden sm:block">● ENCRYPTED</div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-[#6b7a72] hover:text-[#1a2b22] hover:bg-[#f5f0ea] rounded-xl transition"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white border border-[#e0d5c8] rounded-2xl sticky top-6 shadow-sm overflow-hidden">
            <Sidebar />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="bg-white border border-[#e0d5c8] rounded-2xl p-5 sm:p-6 shadow-sm min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#1a2b22] z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white border-r border-[#e0d5c8] z-50 lg:hidden overflow-y-auto"
            >
              <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <ToastNotification />
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function AppRouter() {
  const {
    isOnboardingCompleted,
    isLegalAccepted,
    isVaultConfigured,
    sessionKey,
    setIsOnboardingCompleted,
    setIsLegalAccepted,
    unlockAmbientVault,
    vaultType,
  } = useVaultStore();

  // Auto-unlock ambient vault on mount if configured
  useEffect(() => {
    if (isVaultConfigured && vaultType === "ambient" && !sessionKey) {
      unlockAmbientVault().catch(console.error);
    }
  }, [isVaultConfigured, vaultType, sessionKey, unlockAmbientVault]);

  // Show onboarding if not completed
  if (!isOnboardingCompleted || !isLegalAccepted) {
    return (
      <Onboarding
        onComplete={() => {
          setIsOnboardingCompleted(true);
          setIsLegalAccepted(true);
        }}
      />
    );
  }

  // Show vault gate if vault is configured but not unlocked
  if (isVaultConfigured && !sessionKey) {
    return <VaultGate />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
