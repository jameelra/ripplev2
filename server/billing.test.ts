import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock context ─────────────────────────────────────────────────────────────
function createAuthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      licenseTier: "Free",
      onboardingCompleted: true,
      vaultType: "ambient",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { origin: "https://ripple.health" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

// ─── Billing Router Tests ─────────────────────────────────────────────────────

describe("billing.getPlans", () => {
  it("returns all 6 price configurations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();

    expect(plans).toHaveLength(6);
    const planIds = plans.map((p) => p.planId);
    expect(planIds).toContain("Pro");
    expect(planIds).toContain("Premier");
    expect(planIds).toContain("HRT_Addon");
  });

  it("includes both monthly and annual options for each plan", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();

    const proPrices = plans.filter((p) => p.planId === "Pro");
    expect(proPrices).toHaveLength(2);
    expect(proPrices.some((p) => p.billingCycle === "monthly")).toBe(true);
    expect(proPrices.some((p) => p.billingCycle === "annual")).toBe(true);
  });

  it("Pro monthly price is $7.99", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();

    const proMonthly = plans.find((p) => p.planId === "Pro" && p.billingCycle === "monthly");
    expect(proMonthly?.amount).toBe(799); // cents
    expect(proMonthly?.displayPrice).toBe("$7.99/mo");
  });

  it("Premier annual price is $99.99", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();

    const premierAnnual = plans.find((p) => p.planId === "Premier" && p.billingCycle === "annual");
    expect(premierAnnual?.amount).toBe(9999); // cents
    expect(premierAnnual?.displayPrice).toBe("$99.99/yr");
  });

  it("HRT Add-on annual price is $39.99", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();

    const hrtAnnual = plans.find((p) => p.planId === "HRT_Addon" && p.billingCycle === "annual");
    expect(hrtAnnual?.amount).toBe(3999); // cents
  });
});

describe("billing.getSubscription", () => {
  it("returns empty active plans for a new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const sub = await caller.billing.getSubscription();

    expect(sub.activePlans).toHaveLength(0);
    expect(sub.licenseTier).toBe("Free");
  });
});

describe("billing.createCheckout", () => {
  it("throws PRECONDITION_FAILED when Stripe is not configured", async () => {
    // Temporarily clear the key
    const originalKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.billing.createCheckout({ planId: "Pro", billingCycle: "monthly" })
    ).rejects.toThrow("Stripe is not configured");

    // Restore
    if (originalKey) process.env.STRIPE_SECRET_KEY = originalKey;
  });

  it("throws PRECONDITION_FAILED when price ID is a placeholder", async () => {
    // Set a fake key so Stripe initialises but price IDs are still placeholders
    const originalKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "sk_test_fake_key_for_testing";

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.billing.createCheckout({ planId: "Pro", billingCycle: "monthly" })
    ).rejects.toThrow(/Price ID.*not configured/);

    if (originalKey) process.env.STRIPE_SECRET_KEY = originalKey;
    else delete process.env.STRIPE_SECRET_KEY;
  });
});

describe("billing.createPortalSession", () => {
  it("throws NOT_FOUND when user has no Stripe customer", async () => {
    const originalKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "sk_test_fake_key_for_testing";

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.billing.createPortalSession()).rejects.toThrow(
      "No Stripe customer found"
    );

    if (originalKey) process.env.STRIPE_SECRET_KEY = originalKey;
    else delete process.env.STRIPE_SECRET_KEY;
  });
});
