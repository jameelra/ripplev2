// Billing product/price configuration for server
export type PlanId = "Pro" | "Premier" | "HRT_Addon";
export type BillingCycle = "monthly" | "annual";

export type PriceConfig = {
  planId: PlanId;
  billingCycle: BillingCycle;
  amount: number; // cents
  displayPrice: string;
  priceId: string;
  licenseTier: "Free" | "Pro" | "Premier";
};

export const PRICES: PriceConfig[] = [
  {
    planId: "Pro",
    billingCycle: "monthly",
    amount: 799,
    displayPrice: "$7.99/mo",
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "placeholder_price_pro_monthly",
    licenseTier: "Pro",
  },
  {
    planId: "Pro",
    billingCycle: "annual",
    amount: 5999,
    displayPrice: "$59.99/yr",
    priceId: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "placeholder_price_pro_annual",
    licenseTier: "Pro",
  },
  {
    planId: "Premier",
    billingCycle: "monthly",
    amount: 1299,
    displayPrice: "$12.99/mo",
    priceId: process.env.STRIPE_PRICE_PREMIER_MONTHLY ?? "placeholder_price_premier_monthly",
    licenseTier: "Premier",
  },
  {
    planId: "Premier",
    billingCycle: "annual",
    amount: 9999,
    displayPrice: "$99.99/yr",
    priceId: process.env.STRIPE_PRICE_PREMIER_ANNUAL ?? "placeholder_price_premier_annual",
    licenseTier: "Premier",
  },
  {
    planId: "HRT_Addon",
    billingCycle: "monthly",
    amount: 333,
    displayPrice: "$3.33/mo",
    priceId: process.env.STRIPE_PRICE_HRT_ADDON_MONTHLY ?? "placeholder_price_hrt_monthly",
    licenseTier: "Pro",
  },
  {
    planId: "HRT_Addon",
    billingCycle: "annual",
    amount: 3999,
    displayPrice: "$39.99/yr",
    priceId: process.env.STRIPE_PRICE_HRT_ADDON_ANNUAL ?? "placeholder_price_hrt_annual",
    licenseTier: "Pro",
  },
];

export function getPriceConfig(planId: PlanId, billingCycle: BillingCycle) {
  return PRICES.find((p) => p.planId === planId && p.billingCycle === billingCycle) ?? null;
}

export function getPriceConfigByPriceId(priceId: string) {
  return PRICES.find((p) => p.priceId === priceId) ?? null;
}

export function resolveLicenseTier(activePlanIds: PlanId[]): "Free" | "Pro" | "Premier" {
  if (activePlanIds.includes("Premier")) return "Premier";
  if (activePlanIds.includes("Pro")) return "Pro";
  return "Free";
}

 