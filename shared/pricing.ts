// ─── Single source of truth for all Ripple subscription pricing ────────────
// Every price shown anywhere in the app (client pages, in-app upgrade
// prompts, server billing config, tests) must be derived from this file.
// Do not hardcode a dollar amount, "/mo", or "/yr" string outside of here —
// see server/pricingDrift.test.ts, which fails the build if one reappears.

export type TierId = "Pro" | "Premier";
export type BillingCycle = "monthly" | "annual";

export interface TierPricing {
  id: TierId;
  name: string;
  /** True monthly price if billed monthly — no discount. In cents. */
  monthlyCents: number;
  /** Total price if billed annually, as a single annual charge. In cents. */
  annualCents: number;
}

// ─── Canonical amounts ──────────────────────────────────────────────────────
// These are Ripple's own prices (USD, North America market). They are
// independent of whatever Price objects Stripe happens to have configured —
// see server/billing/products.ts for the Stripe reconciliation, which is
// reported, not auto-corrected. Annual = 10x monthly (2 months free).
export const PRICING: Record<TierId, TierPricing> = {
  Pro: {
    id: "Pro",
    name: "Pro",
    monthlyCents: 599,
    annualCents: 5999,
  },
  Premier: {
    id: "Premier",
    name: "Premier",
    monthlyCents: 999,
    annualCents: 9999,
  },
};

export const TIER_IDS = Object.keys(PRICING) as TierId[];

// ─── Cent-level math ─────────────────────────────────────────────────────────

export function trueMonthlyCents(tier: TierId): number {
  return PRICING[tier].monthlyCents;
}

export function annualTotalCents(tier: TierId): number {
  return PRICING[tier].annualCents;
}

/** Effective per-month rate when paying annually (annual total ÷ 12). */
export function annualEffectiveMonthlyCents(tier: TierId): number {
  return Math.round(PRICING[tier].annualCents / 12);
}

/** % saved per year by paying annually instead of 12x the true monthly price. */
export function annualSavingsPercent(tier: TierId): number {
  const { monthlyCents, annualCents } = PRICING[tier];
  const payMonthlyAllYear = monthlyCents * 12;
  return Math.round((1 - annualCents / payMonthlyAllYear) * 100);
}

/** The largest annual savings % across all paid tiers — for a single "Save up to N%" badge. */
export function maxAnnualSavingsPercent(): number {
  return Math.max(...TIER_IDS.map(annualSavingsPercent));
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export function centsToDisplay(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** e.g. "$7.99/mo" — the true, achievable-every-month price. */
export function displayTrueMonthly(tier: TierId): string {
  return `${centsToDisplay(trueMonthlyCents(tier))}/mo`;
}

/** e.g. "$59.99/yr" */
export function displayAnnualTotal(tier: TierId): string {
  return `${centsToDisplay(annualTotalCents(tier))}/yr`;
}

/**
 * e.g. "$5.00/mo billed annually" — an annual-derived monthly figure MUST
 * always carry this "billed annually" qualifier per the pricing display
 * convention: no "/mo" number may be shown that isn't achievable monthly.
 */
export function displayAnnualEffectiveMonthly(tier: TierId): string {
  return `${centsToDisplay(annualEffectiveMonthlyCents(tier))}/mo billed annually`;
}

export function displayForCycle(tier: TierId, cycle: BillingCycle): string {
  return cycle === "annual" ? displayAnnualEffectiveMonthly(tier) : displayTrueMonthly(tier);
}

/** displayPrice string for server PriceConfig rows: "$X.XX/mo" or "$X.XX/yr" per cycle. */
export function displayPriceForCycle(tier: TierId, cycle: BillingCycle): string {
  return cycle === "monthly" ? displayTrueMonthly(tier) : displayAnnualTotal(tier);
}

export function amountCentsForCycle(tier: TierId, cycle: BillingCycle): number {
  return cycle === "monthly" ? trueMonthlyCents(tier) : annualTotalCents(tier);
}
