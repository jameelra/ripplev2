// ─── Ripple v2 — Stripe Products Configuration ───────────────────────────────
// Create these products and prices in your Stripe Dashboard, then paste the
// Price IDs below. Use test mode Price IDs for development.
//
// Products to create:
//   1. "Ripple Pro"     — Monthly $7.99, Annual $59.99
//   2. "Ripple Premier" — Monthly $12.99, Annual $99.99
//   3. "Ripple HRT Add-on" — Monthly $4.99, Annual $39.99
//
// After creating, paste the Price IDs (price_xxx) from Stripe Dashboard here.
// These are read from environment variables so they can differ between test/live.

export type PlanId = "Pro" | "Premier" | "HRT_Addon";
export type BillingCycle = "monthly" | "annual";

export interface PriceConfig {
  priceId: string;
  planId: PlanId;
  billingCycle: BillingCycle;
  amount: number;       // in cents
  displayPrice: string; // e.g. "$7.99/mo"
  licenseTier: "Pro" | "Premier"; // which tier this unlocks
}

// ─── Price ID environment variable mapping ────────────────────────────────────
// Set these in your Stripe Dashboard → Products → Copy Price ID
// Then add them as secrets in the Manus Management UI → Settings → Secrets
function getPriceId(envVar: string, fallback: string): string {
  return process.env[envVar] ?? fallback;
}

export const PRICES: PriceConfig[] = [
  // Pro — Monthly
  {
    priceId: getPriceId("STRIPE_PRICE_PRO_MONTHLY", "price_pro_monthly_placeholder"),
    planId: "Pro",
    billingCycle: "monthly",
    amount: 799,
    displayPrice: "$7.99/mo",
    licenseTier: "Pro",
  },
  // Pro — Annual
  {
    priceId: getPriceId("STRIPE_PRICE_PRO_ANNUAL", "price_pro_annual_placeholder"),
    planId: "Pro",
    billingCycle: "annual",
    amount: 5999,
    displayPrice: "$59.99/yr",
    licenseTier: "Pro",
  },
  // Premier — Monthly
  {
    priceId: getPriceId("STRIPE_PRICE_PREMIER_MONTHLY", "price_premier_monthly_placeholder"),
    planId: "Premier",
    billingCycle: "monthly",
    amount: 1299,
    displayPrice: "$12.99/mo",
    licenseTier: "Premier",
  },
  // Premier — Annual
  {
    priceId: getPriceId("STRIPE_PRICE_PREMIER_ANNUAL", "price_premier_annual_placeholder"),
    planId: "Premier",
    billingCycle: "annual",
    amount: 9999,
    displayPrice: "$99.99/yr",
    licenseTier: "Premier",
  },
  // HRT Add-on — Monthly
  {
    priceId: getPriceId("STRIPE_PRICE_HRT_MONTHLY", "price_hrt_monthly_placeholder"),
    planId: "HRT_Addon",
    billingCycle: "monthly",
    amount: 499,
    displayPrice: "$4.99/mo",
    licenseTier: "Pro", // HRT Add-on requires at least Pro
  },
  // HRT Add-on — Annual
  {
    priceId: getPriceId("STRIPE_PRICE_HRT_ANNUAL", "price_hrt_annual_placeholder"),
    planId: "HRT_Addon",
    billingCycle: "annual",
    amount: 3999,
    displayPrice: "$39.99/yr",
    licenseTier: "Pro",
  },
];

export function getPriceConfig(planId: PlanId, billingCycle: BillingCycle): PriceConfig | undefined {
  return PRICES.find((p) => p.planId === planId && p.billingCycle === billingCycle);
}

export function getPriceConfigByPriceId(priceId: string): PriceConfig | undefined {
  return PRICES.find((p) => p.priceId === priceId);
}

// Maps a plan + HRT add-on combination to a licenseTier
export function resolveLicenseTier(
  activePlans: PlanId[]
): "Free" | "Pro" | "Premier" {
  if (activePlans.includes("Premier")) return "Premier";
  if (activePlans.includes("Pro")) return "Pro";
  if (activePlans.includes("HRT_Addon")) return "Pro"; // HRT add-on grants Pro tier
  return "Free";
}
