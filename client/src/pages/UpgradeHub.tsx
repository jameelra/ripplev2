import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Crown, Sparkles, Pill, Lock,
  ShieldCheck, Info, ChevronDown, ChevronUp, ExternalLink,
  Loader2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVaultStore } from "../stores/vaultStore";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type BillingCycle = "monthly" | "annual";
type PlanId = "Pro" | "Premier" | "HRT_Addon";

const PLANS = [
  {
    id: "Free",
    name: "Free",
    tagline: "Start tracking today",
    monthlyPrice: 0,
    annualPrice: 0,
    annualEquiv: 0,
    color: "text-[#6b7a72]",
    bg: "bg-[#f5f0ea]",
    border: "border-[#e0d5c8]",
    icon: ShieldCheck,
    features: [
      { text: "12-symptom daily logging (0–3 scale)", on: true },
      { text: "Perimenopause Severity Score (PSS)", on: true },
      { text: "14-day trend chart & streak tracker", on: true },
      { text: "Quick Log (30-second entry)", on: true },
      { text: "Symptom Heatmap Calendar", on: true },
      { text: "Symptom Library (10 clinical entries)", on: true },
      { text: "Menopause Wiki deep-links", on: true },
      { text: "Zero-knowledge AES-GCM encryption", on: true },
      { text: "Evidence Engine (GP brief)", on: false },
      { text: "AI Diary analysis", on: false },
      { text: "Trigger Tracker", on: false },
      { text: "HRT Tracker", on: false },
    ],
    cta: "Current Plan",
    ctaClass: "bg-[#f5f0ea] text-[#9a9490] border border-[#e0d5c8] cursor-not-allowed",
  },
  {
    id: "Pro" as PlanId,
    name: "Pro",
    tagline: "Walk into every appointment prepared",
    monthlyPrice: 7.99,
    annualPrice: 59.99,
    annualEquiv: 5.0,
    color: "text-[#4a8a72]",
    bg: "bg-[#eef4f1]",
    border: "border-[#4a8a72]",
    icon: Sparkles,
    badge: "Most Popular",
    features: [
      { text: "Everything in Free", on: true },
      { text: "Evidence Engine — 8-section GP brief", on: true, bold: true },
      { text: "Greene Climacteric Scale scoring", on: true },
      { text: "Appointment Prep with GP scripts", on: true, bold: true },
      { text: "AI Diary analysis (LLM-powered)", on: true },
      { text: "Reverse Symptom Lookup (AI-enhanced)", on: true },
      { text: "Dismissal Tracker", on: true, bold: true },
      { text: "Trigger Tracker + Experiment Mode", on: true },
      { text: "Biological Correlations chart", on: true },
      { text: "HRT Tracker", on: false },
      { text: "Cycle Calendar + Predictions", on: false },
    ],
    cta: "Start 7-Day Free Trial",
    ctaClass: "bg-[#4a8a72] hover:bg-[#3a7060] text-white",
  },
  {
    id: "Premier" as PlanId,
    name: "Premier",
    tagline: "The complete clinical companion",
    monthlyPrice: 12.99,
    annualPrice: 99.99,
    annualEquiv: 8.33,
    color: "text-[#c07060]",
    bg: "bg-[#faf5f3]",
    border: "border-[#c07060]",
    icon: Crown,
    features: [
      { text: "Everything in Pro", on: true },
      { text: "HRT Tracker (80+ medications)", on: true, bold: true },
      { text: "Patch countdown & site rotation", on: true },
      { text: "Treatment Response analysis", on: true, bold: true },
      { text: "Dose adherence tracking", on: true },
      { text: "Cycle Calendar + Reproductive Intelligence", on: true },
      { text: "STRAW+10 cycle variability classification", on: true },
      { text: "Menopause Mode (Surgical / Early)", on: true },
      { text: "Priority support", on: true },
    ],
    cta: "Start 7-Day Free Trial",
    ctaClass: "bg-[#c07060] hover:bg-[#a05848] text-white",
  },
] as const;

export default function UpgradeHub() {
  const { licenseTier } = useVaultStore();
  const { user, openAuthModal } = useAuth();
  const [billing, setBilling] = useState<BillingCycle>("annual");
  const [showAddon, setShowAddon] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast.success("Redirecting to checkout…", {
          description: "A new tab has opened with the Stripe checkout page.",
        });
      }
      setLoadingPlan(null);
    },
    onError: (err) => {
      toast.error("Checkout failed", { description: err.message });
      setLoadingPlan(null);
    },
  });

  const createPortal = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.portalUrl) window.open(data.portalUrl, "_blank");
    },
    onError: (err) => {
      toast.error("Portal failed", { description: err.message });
    },
  });

  const { data: subscriptionData } = trpc.billing.getSubscription.useQuery(undefined, {
    retry: false,
    enabled: !!user,
  });

  const handleSelect = async (planId: PlanId) => {
    if (!user) {
      openAuthModal();
      return;
    }
    setLoadingPlan(planId + billing);
    createCheckout.mutate({ planId, billingCycle: billing });
  };

  const handleAddonSelect = async (cycle: BillingCycle) => {
    if (!user) {
      openAuthModal();
      return;
    }
    setLoadingPlan("HRT_Addon" + cycle);
    createCheckout.mutate({ planId: "HRT_Addon", billingCycle: cycle });
  };

  const hasActiveSubscription = subscriptionData && subscriptionData.activePlans.length > 0;

  const faqs = [
    { q: "Will I lose my data if I downgrade?", a: "Never. Your encrypted health data belongs to you and is always accessible, regardless of your plan. Downgrading removes access to premium features, not your own data." },
    { q: "Is there really a free trial?", a: "Yes — Pro and Premier include a 7-day free trial. No credit card required to start. You will only be charged if you choose to continue after the trial." },
    { q: "Why is the HRT Tracker in Premier and not Pro?", a: "The HRT Tracker is a sophisticated feature (80+ medications, patch countdowns, treatment response analysis) that took significant clinical research to build. It is also available as a standalone add-on for $3.33/mo if you just want the medication tracking." },
    { q: "What is the HRT Add-on?", a: "The HRT Add-on gives you just the HRT Tracker without the full Premier tier. It is designed for women who already use another symptom tracker and just want Ripple's medication tracking. At $3.33/mo (annual), it is the most affordable dedicated HRT tracker on the market." },
    { q: "How do I cancel?", a: "Click 'Manage Subscription' below to access the Stripe customer portal, where you can cancel, change plans, or update payment details at any time." },
    { q: "Is this app a medical device?", a: "No. Ripple is a general wellness tracking application for informational purposes only. It is not a medical device and does not provide medical diagnoses or treatment recommendations." },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="ripple-section-title">Plans & Pricing</h1>
        <p className="text-sm text-[#6b7a72] max-w-sm mx-auto leading-relaxed">
          Feature limits, never time limits. Your data is always yours.
        </p>
      </div>

      {/* Ethics promise */}
      <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-[#4a8a72] shrink-0 mt-0.5" />
        <p className="text-xs text-[#4a4a42] leading-relaxed">
          <strong>Our Ethical Freemium Promise:</strong> Free users always own their data. No time limits. No data selling. No cutting off access to your own health history.
        </p>
      </div>

      {/* Current plan */}
      <div className="flex items-center justify-between bg-[#f5f0ea] rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4a8a72]" />
          <p className="text-xs font-bold text-[#1a2b22]">Current Plan: <span className="text-[#4a8a72]">{licenseTier}</span></p>
        </div>
        {hasActiveSubscription && (
          <button
            onClick={() => createPortal.mutate()}
            disabled={createPortal.isPending}
            className="text-[10px] font-mono text-[#4a8a72] hover:underline flex items-center gap-1"
          >
            {createPortal.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
            Manage Subscription
          </button>
        )}
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-1 bg-[#f5f0ea] p-1 rounded-xl">
        <button
          onClick={() => setBilling("monthly")}
          className={`flex-1 text-xs font-mono font-bold py-2.5 rounded-lg transition-all ${billing === "monthly" ? "bg-white text-[#1a2b22] shadow-sm" : "text-[#6b7a72]"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling("annual")}
          className={`flex-1 text-xs font-mono font-bold py-2.5 rounded-lg transition-all relative ${billing === "annual" ? "bg-white text-[#1a2b22] shadow-sm" : "text-[#6b7a72]"}`}
        >
          Annual
          <span className="ml-1.5 text-[8px] bg-[#4a8a72] text-white px-1.5 py-0.5 rounded-full font-bold">Save 37%</span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="space-y-4">
        {PLANS.map((plan, i) => {
          const Icon = plan.icon;
          const isCurrent = licenseTier === plan.id;
          const price = billing === "annual" ? plan.annualEquiv : plan.monthlyPrice;
          const isLoading = loadingPlan === (plan.id + billing);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`ripple-card p-5 space-y-4 relative ${isCurrent ? `border-2 ${plan.border}` : ""} ${plan.bg}`}
            >
              {"badge" in plan && plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#4a8a72] text-white text-[9px] font-mono uppercase tracking-wider px-3 py-1 rounded-full font-bold">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-5 h-5 ${plan.color}`} />
                  <div>
                    <p className="font-serif text-base font-bold text-[#1a2b22]">{plan.name}</p>
                    <p className="text-[10px] text-[#6b7a72]">{plan.tagline}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {plan.monthlyPrice === 0 ? (
                    <p className="font-serif text-2xl font-bold text-[#1a2b22]">Free</p>
                  ) : (
                    <>
                      <p className="font-serif text-2xl font-bold text-[#1a2b22]">
                        ${price.toFixed(2)}<span className="text-xs font-sans text-[#6b7a72]">/mo</span>
                      </p>
                      {billing === "annual" && (
                        <p className="text-[9px] text-[#9a9490] font-mono">${plan.annualPrice}/yr</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                {plan.features.map((f) => (
                  <div key={f.text} className={`flex items-start gap-2 ${!f.on ? "opacity-40" : ""}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${f.on ? "bg-[#4a8a72]/10" : "bg-[#e0d5c8]"}`}>
                      {f.on
                        ? <CheckCircle2 className="w-3 h-3 text-[#4a8a72]" />
                        : <Lock className="w-2.5 h-2.5 text-[#9a9490]" />
                      }
                    </div>
                    <p className={`text-xs leading-relaxed ${"bold" in f && f.bold ? "font-semibold text-[#1a2b22]" : "text-[#4a4a42]"}`}>{f.text}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => plan.id !== "Free" && handleSelect(plan.id as PlanId)}
                disabled={isCurrent || plan.id === "Free" || isLoading}
                className={`w-full font-mono text-xs font-bold py-3 rounded-xl ${plan.ctaClass} disabled:opacity-60`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Opening checkout…</span>
                ) : isCurrent ? "Current Plan" : plan.cta}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* HRT Add-on */}
      <div className="space-y-2">
        <button
          onClick={() => setShowAddon(!showAddon)}
          className="w-full flex items-center justify-between ripple-card p-4 hover:bg-[#f5f0ea] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
              <Pill className="w-4 h-4 text-purple-700" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[#1a2b22]">HRT Add-on</p>
              <p className="text-[10px] text-[#9a9490]">
                Just the medication tracker · {billing === "annual" ? "$3.33/mo ($39.99/yr)" : "$4.99/mo"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">Add-on</span>
            {showAddon ? <ChevronUp className="w-4 h-4 text-[#9a9490]" /> : <ChevronDown className="w-4 h-4 text-[#9a9490]" />}
          </div>
        </button>

        {showAddon && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="ripple-card p-5 space-y-4 border-purple-200 bg-purple-50/20"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-serif text-base font-bold text-[#1a2b22]">HRT Tracker Add-on</p>
                <p className="text-[10px] text-[#6b7a72] mt-0.5">For women who already have a symptom tracker</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-xl font-bold text-[#1a2b22]">
                  ${billing === "annual" ? "3.33" : "4.99"}<span className="text-xs font-sans text-[#6b7a72]">/mo</span>
                </p>
                {billing === "annual" && <p className="text-[9px] text-[#9a9490] font-mono">$39.99/yr</p>}
              </div>
            </div>
            <p className="text-xs text-[#4a4a42] leading-relaxed">
              Full HRT Tracker with 80+ medications, dose logging, patch change countdowns, application site rotation, adherence tracking, and treatment response analysis.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed">
                <strong>Value tip:</strong> Pro + HRT Add-on = $12.98/mo. Premier = $12.99/mo. Premier is the better value.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleAddonSelect("monthly")}
                disabled={loadingPlan === "HRT_Addonmonthly"}
                variant="outline"
                className="flex-1 text-xs font-mono border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {loadingPlan === "HRT_Addonmonthly" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "$4.99/mo"}
              </Button>
              <Button
                onClick={() => handleAddonSelect("annual")}
                disabled={loadingPlan === "HRT_Addonannual"}
                className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-mono text-xs font-bold rounded-xl"
              >
                {loadingPlan === "HRT_Addonannual" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Pill className="w-3.5 h-3.5 mr-1.5" />$39.99/yr — Best Value</>}
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Test card info */}
      <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-4 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#4a8a72] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-[#1a2b22]">Test payments</p>
          <p className="text-[10px] text-[#6b7a72] leading-relaxed mt-0.5">
            Use card number <strong className="font-mono">4242 4242 4242 4242</strong> with any future expiry and any CVC to test checkout. Real payments require claiming your Stripe sandbox in Settings → Payment.
          </p>
        </div>
      </div>

      {/* Pricing comparison */}
      <div className="ripple-card p-5 space-y-3">
        <p className="ripple-label">How we compare</p>
        <div className="space-y-2">
          {[
            { app: "Stabilize HRT", price: "$49.99/yr", note: "Basic HRT tracking, iOS only, no GP brief" },
            { app: "Crest (FemHQ)", price: "Free", note: "HRT tracking only, no clinical tools or GP brief" },
            { app: "Balance App", price: "Free", note: "Education only, no clinical tools" },
            { app: "Ripple Pro", price: "$59.99/yr", note: "Evidence Engine, GP brief, Trigger Tracker, Dismissal Tracker" },
            { app: "Ripple Premier", price: "$99.99/yr", note: "Everything + HRT Tracker, Cycle Calendar, Treatment Response" },
          ].map(({ app, price, note }) => (
            <div key={app} className={`flex items-start justify-between gap-3 p-3 rounded-xl ${app.startsWith("Ripple") ? "bg-[#eef4f1] border border-[#c8d8d0]" : "bg-[#f5f0ea]"}`}>
              <div>
                <p className={`text-xs font-bold ${app.startsWith("Ripple") ? "text-[#1a2b22]" : "text-[#6b7a72]"}`}>{app}</p>
                <p className="text-[10px] text-[#9a9490] leading-relaxed">{note}</p>
              </div>
              <p className={`text-xs font-mono font-bold shrink-0 ${app.startsWith("Ripple") ? "text-[#4a8a72]" : "text-[#9a9490]"}`}>{price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-2">
        <p className="ripple-label">Frequently Asked Questions</p>
        {faqs.map(({ q, a }, i) => (
          <div key={i} className="ripple-card overflow-hidden">
            <button
              onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[#faf8f5] transition-colors"
            >
              <p className="text-xs font-bold text-[#1a2b22] pr-4">{q}</p>
              {expandedFaq === i ? <ChevronUp className="w-4 h-4 text-[#9a9490] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#9a9490] shrink-0" />}
            </button>
            {expandedFaq === i && (
              <div className="px-4 pb-4 border-t border-[#f0ebe4]">
                <p className="text-xs text-[#6b7a72] leading-relaxed pt-3">{a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
