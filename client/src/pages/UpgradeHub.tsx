import React from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Shield, Star, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVaultStore } from "../stores/vaultStore";
import type { LicenseTier } from "../../../shared/types";

const TIERS = [
  {
    id: "Free" as LicenseTier,
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "Start tracking your health journey",
    icon: Shield,
    iconColor: "text-[#6b7a72]",
    iconBg: "bg-[#f5f0ea]",
    borderColor: "border-[#e0d5c8]",
    badgeBg: "bg-[#f5f0ea] text-[#6b7a72]",
    ctaStyle: "bg-[#f5f0ea] hover:bg-[#eae5de] text-[#3a3a32] border border-[#e0d5c8]",
    features: [
      "Symptom logging (12 symptoms, 0–3 severity)",
      "Biological signals tracking",
      "Cycle tracker",
      "Basic dashboard with PSS score",
      "14-day symptom trend chart",
      "Streak tracker",
      "Basic diary journaling",
      "Reverse symptom lookup (database)",
      "Basic GP brief (no Greene scoring)",
      "AES-GCM encrypted vault",
    ],
    locked: [
      "AI Diary Analysis",
      "Full Evidence Engine (Greene Scale)",
      "Peer-reviewed citations in brief",
      "AI-powered symptom lookup",
    ],
  },
  {
    id: "Pro" as LicenseTier,
    name: "Pro",
    price: "$9.99",
    period: "/mo",
    tagline: "Clinical-grade advocacy tools",
    icon: Sparkles,
    iconColor: "text-[#4a8a72]",
    iconBg: "bg-[#eef4f1]",
    borderColor: "border-[#4a8a72]",
    badgeBg: "bg-[#eef4f1] text-[#4a8a72]",
    ctaStyle: "bg-[#4a8a72] hover:bg-[#3a7060] text-white",
    recommended: true,
    features: [
      "Everything in Free",
      "AI Diary Analysis (LLM-powered)",
      "Full Evidence Engine with Greene Climacteric Scale",
      "Peer-reviewed NAMS/BMS/Endocrine Society citations",
      "Printable clinical GP brief",
      "AI-powered Reverse Symptom Lookup",
      "Dismissal record tracking",
      "Unlimited history access",
      "Advanced trend analytics",
    ],
    locked: [
      "Hormonal Fingerprint™ predictions",
      "Partner Intelligence Report",
      "Longitudinal Evidence Timeline PDF",
    ],
  },
  {
    id: "Premier" as LicenseTier,
    name: "Premier",
    price: "$17.99",
    period: "/mo",
    tagline: "The complete perimenopause companion",
    icon: Crown,
    iconColor: "text-[#c07060]",
    iconBg: "bg-[#faf5f3]",
    borderColor: "border-[#c07060]",
    badgeBg: "bg-[#faf5f3] text-[#c07060]",
    ctaStyle: "bg-[#c07060] hover:bg-[#a05848] text-white",
    features: [
      "Everything in Pro",
      "Hormonal Fingerprint™ — personalised symptom predictions",
      "Partner Intelligence Report (monthly)",
      "Longitudinal Evidence Timeline PDF",
      "Community Intelligence Layer (opt-in)",
      "Real-time Appointment Mode",
      "Priority support",
      "Early access to new features",
    ],
    locked: [],
  },
];

export default function UpgradeHub() {
  const { licenseTier, setLicenseTier, setToastNotification } = useVaultStore();

  const handleSelectTier = (tier: LicenseTier) => {
    if (tier === licenseTier) return;
    setLicenseTier(tier);
    setToastNotification({
      type: "success",
      title: `${tier} Plan Activated`,
      description:
        tier === "Free"
          ? "You are now on the Free plan."
          : `Welcome to Ripple ${tier}! Your features have been unlocked.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ripple-section-title">Upgrade Hub</h1>
        <p className="text-sm text-[#6b7a72] mt-1">
          Feature-based plans — no time limits, no data cutoffs, ever
        </p>
      </div>

      {/* Current plan banner */}
      <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4a8a72]" />
          <p className="text-sm font-bold text-[#1a2b22]">Current Plan: <span className="text-[#4a8a72]">{licenseTier}</span></p>
        </div>
        <p className="text-xs text-[#6b7a72] font-mono">Your data is always yours</p>
      </div>

      {/* Ethics statement */}
      <div className="ripple-card p-4 bg-[#f5f0ea] border-[#e0d5c8] space-y-2">
        <p className="text-xs font-bold text-[#1a2b22]">Our Freemium Promise</p>
        <p className="text-xs text-[#6b7a72] leading-relaxed">
          We believe every woman deserves access to basic health tracking tools. The Free tier has <strong>no time limits</strong> and <strong>no data cutoffs</strong>. You will always have access to your logged health data, regardless of your plan. Upgrades unlock additional features, not your own data.
        </p>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 gap-4">
        {TIERS.map((tier, i) => {
          const Icon = tier.icon;
          const isCurrent = licenseTier === tier.id;
          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`ripple-card p-5 space-y-4 relative overflow-hidden ${
                isCurrent ? `border-2 ${tier.borderColor}` : ""
              }`}
            >
              {/* Recommended badge */}
              {tier.recommended && (
                <div className="absolute top-4 right-4">
                  <span className="text-[9px] font-mono uppercase tracking-wider bg-[#4a8a72] text-white px-2.5 py-1 rounded-full font-bold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${tier.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${tier.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-xl font-bold text-[#1a2b22]">{tier.name}</p>
                    {isCurrent && (
                      <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border ${tier.badgeBg}`}>
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-0.5 mt-0.5">
                    <span className="font-serif text-2xl font-bold text-[#1a2b22]">{tier.price}</span>
                    <span className="text-sm text-[#6b7a72]">{tier.period}</span>
                  </div>
                  <p className="text-xs text-[#6b7a72] mt-0.5">{tier.tagline}</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1.5">
                {tier.features.map((feature, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#4a8a72] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#4a4a42] leading-relaxed">{feature}</p>
                  </div>
                ))}
                {tier.locked.map((feature, j) => (
                  <div key={j} className="flex items-start gap-2 opacity-40">
                    <Lock className="w-3.5 h-3.5 text-[#9a9490] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#9a9490] leading-relaxed">{feature}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button
                onClick={() => handleSelectTier(tier.id)}
                disabled={isCurrent}
                className={`w-full font-mono text-xs font-bold py-3 rounded-xl ${tier.ctaStyle} disabled:opacity-50`}
              >
                {isCurrent ? (
                  <><Check className="w-4 h-4 mr-1.5" />Current Plan</>
                ) : tier.id === "Free" ? (
                  "Downgrade to Free"
                ) : (
                  `Upgrade to ${tier.name} — ${tier.price}/mo`
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="ripple-card p-5 space-y-4">
        <p className="ripple-label">Frequently Asked Questions</p>
        {[
          {
            q: "Will I lose my data if I downgrade?",
            a: "Never. Your encrypted health data belongs to you and is always accessible, regardless of your plan tier.",
          },
          {
            q: "Is my health data safe?",
            a: "Yes. All health data is encrypted client-side using AES-GCM encryption before it ever leaves your device. We cannot read your health data.",
          },
          {
            q: "Can I cancel anytime?",
            a: "Yes. You can change your plan at any time. No contracts, no cancellation fees.",
          },
          {
            q: "Is this app a medical device?",
            a: "No. Ripple is a general wellness tracking application for informational purposes only. It is not a medical device and does not provide medical diagnoses.",
          },
        ].map(({ q, a }, i) => (
          <div key={i} className="space-y-1 border-t border-[#f0ebe4] pt-4 first:border-0 first:pt-0">
            <p className="text-sm font-bold text-[#1a2b22]">{q}</p>
            <p className="text-xs text-[#6b7a72] leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
