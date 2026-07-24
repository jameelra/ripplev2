// Billing product/price configuration for server
import { amountCentsForCycle, displayPriceForCycle } from "../../shared/pricing";
import type { TierId, BillingCycle as PricingBillingCycle } from "../../shared/pricing";

export type PlanId = TierId;
export type BillingCycle = PricingBillingCycle;

export type PriceConfig = {
  planId: PlanId;
  billingCycle: BillingCycle;
  amount: number; // cents — derived from shared/pricing.ts, never hardcoded here
  displayPrice: string;
  priceId: string;
  licenseTier: "Free" | "Pro" | "Premier";
};

function priceConfig(
  planId: PlanId,
  billingCycle: BillingCycle,
  envVar: string | undefined,
  placeholder: string,
  licenseTier: "Free" | "Pro" | "Premier"
): PriceConfig {
  return {
    planId,
    billingCycle,
    amount: amountCentsForCycle(planId, billingCycle),
    displayPrice: displayPriceForCycle(planId, billingCycle),
    priceId: envVar ?? placeholder,
    licenseTier,
  };
}

export const PRICES: PriceConfig[] = [
  priceConfig("Pro", "monthly", process.env.STRIPE_PRICE_PRO_MONTHLY, "placeholder_price_pro_monthly", "Pro"),
  priceConfig("Pro", "annual", process.env.STRIPE_PRICE_PRO_ANNUAL, "placeholder_price_pro_annual", "Pro"),
  priceConfig("Premier", "monthly", process.env.STRIPE_PRICE_PREMIER_MONTHLY, "placeholder_price_premier_monthly", "Premier"),
  priceConfig("Premier", "annual", process.env.STRIPE_PRICE_PREMIER_ANNUAL, "placeholder_price_premier_annual", "Premier"),
  priceConfig("HRT_Addon", "monthly", process.env.STRIPE_PRICE_HRT_ADDON_MONTHLY, "placeholder_price_hrt_monthly", "Pro"),
  priceConfig("HRT_Addon", "annual", process.env.STRIPE_PRICE_HRT_ADDON_ANNUAL, "placeholder_price_hrt_annual", "Pro"),
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

 