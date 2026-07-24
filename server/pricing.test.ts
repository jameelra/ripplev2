import { describe, expect, it } from "vitest";
import {
  PRICING,
  TIER_IDS,
  trueMonthlyCents,
  annualTotalCents,
  annualEffectiveMonthlyCents,
  annualSavingsPercent,
  maxAnnualSavingsPercent,
  sumTrueMonthlyCents,
  sumAnnualEffectiveMonthlyCents,
  centsToDisplay,
  displayTrueMonthly,
  displayAnnualTotal,
  displayAnnualEffectiveMonthly,
  displayForCycle,
} from "../shared/pricing";
import { PRICES } from "./billing/products";

describe("shared/pricing.ts — canonical amounts", () => {
  it("defines exactly Pro, Premier, and HRT_Addon", () => {
    expect(TIER_IDS.sort()).toEqual(["HRT_Addon", "Premier", "Pro"]);
  });

  it("every tier's annual price is cheaper than 12x its monthly price", () => {
    for (const tier of TIER_IDS) {
      expect(annualTotalCents(tier)).toBeLessThan(trueMonthlyCents(tier) * 12);
    }
  });
});

describe("shared/pricing.ts — derived helpers", () => {
  it("computes the annual-effective monthly rate as annual / 12, rounded", () => {
    expect(annualEffectiveMonthlyCents("Pro")).toBe(Math.round(PRICING.Pro.annualCents / 12));
    expect(annualEffectiveMonthlyCents("Premier")).toBe(Math.round(PRICING.Premier.annualCents / 12));
    expect(annualEffectiveMonthlyCents("HRT_Addon")).toBe(Math.round(PRICING.HRT_Addon.annualCents / 12));
  });

  it("computes annual savings percent from monthly*12 vs annual total", () => {
    for (const tier of TIER_IDS) {
      const payMonthlyAllYear = trueMonthlyCents(tier) * 12;
      const expected = Math.round((1 - annualTotalCents(tier) / payMonthlyAllYear) * 100);
      expect(annualSavingsPercent(tier)).toBe(expected);
    }
  });

  it("maxAnnualSavingsPercent is the largest of the three tiers' savings", () => {
    const values = TIER_IDS.map(annualSavingsPercent);
    expect(maxAnnualSavingsPercent()).toBe(Math.max(...values));
  });

  it("sumTrueMonthlyCents and sumAnnualEffectiveMonthlyCents add per-tier cents", () => {
    expect(sumTrueMonthlyCents(["Pro", "HRT_Addon"])).toBe(
      trueMonthlyCents("Pro") + trueMonthlyCents("HRT_Addon")
    );
    expect(sumAnnualEffectiveMonthlyCents(["Pro", "HRT_Addon"])).toBe(
      annualEffectiveMonthlyCents("Pro") + annualEffectiveMonthlyCents("HRT_Addon")
    );
  });
});

describe("shared/pricing.ts — display strings", () => {
  it("centsToDisplay formats cents as a two-decimal dollar string", () => {
    expect(centsToDisplay(799)).toBe("$7.99");
    expect(centsToDisplay(500)).toBe("$5.00");
  });

  it("displayTrueMonthly never implies a discount", () => {
    expect(displayTrueMonthly("Pro")).toBe("$7.99/mo");
    expect(displayTrueMonthly("Premier")).toBe("$12.99/mo");
    expect(displayTrueMonthly("HRT_Addon")).toBe("$4.99/mo");
  });

  it("displayAnnualTotal shows the one-time annual charge", () => {
    expect(displayAnnualTotal("Pro")).toBe("$59.99/yr");
    expect(displayAnnualTotal("Premier")).toBe("$99.99/yr");
    expect(displayAnnualTotal("HRT_Addon")).toBe("$39.99/yr");
  });

  it("displayAnnualEffectiveMonthly always carries the 'billed annually' qualifier", () => {
    for (const tier of TIER_IDS) {
      expect(displayAnnualEffectiveMonthly(tier)).toMatch(/\/mo billed annually$/);
    }
    expect(displayAnnualEffectiveMonthly("Pro")).toBe("$5.00/mo billed annually");
    expect(displayAnnualEffectiveMonthly("Premier")).toBe("$8.33/mo billed annually");
    expect(displayAnnualEffectiveMonthly("HRT_Addon")).toBe("$3.33/mo billed annually");
  });

  it("displayForCycle picks the right string per billing cycle", () => {
    expect(displayForCycle("Pro", "monthly")).toBe(displayTrueMonthly("Pro"));
    expect(displayForCycle("Pro", "annual")).toBe(displayAnnualEffectiveMonthly("Pro"));
  });
});

describe("server/billing/products.ts — derived from shared/pricing.ts", () => {
  it("every PRICES row's amount matches the canonical cents for its cycle", () => {
    for (const p of PRICES) {
      const expectedCents = p.billingCycle === "monthly" ? trueMonthlyCents(p.planId) : annualTotalCents(p.planId);
      expect(p.amount).toBe(expectedCents);
    }
  });

  it("every PRICES row's displayPrice matches the canonical display string for its cycle", () => {
    for (const p of PRICES) {
      const expected = p.billingCycle === "monthly" ? displayTrueMonthly(p.planId) : displayAnnualTotal(p.planId);
      expect(p.displayPrice).toBe(expected);
    }
  });

  it("HRT_Addon's monthly price is its own true monthly rate, not the annual-equivalent", () => {
    // Regression test: products.ts previously hardcoded HRT_Addon's monthly
    // amount as 333 cents ($3.33) — actually the annual-equivalent rate — so
    // it silently disagreed with the $4.99/mo shown on the upgrade page.
    const hrtMonthly = PRICES.find((p) => p.planId === "HRT_Addon" && p.billingCycle === "monthly");
    expect(hrtMonthly?.amount).toBe(499);
    expect(hrtMonthly?.amount).not.toBe(annualEffectiveMonthlyCents("HRT_Addon"));
  });
});
