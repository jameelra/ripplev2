import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { appRouter } from "./routers";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { syncUserLicenseTier, upsertStripeCustomer } from "./billing/db";
import { handleStripeWebhook } from "./billing/webhook";
import { users, subscriptions, stripeCustomers } from "../drizzle/schema";
import {
  trueMonthlyCents,
  annualTotalCents,
  displayTrueMonthly,
  displayAnnualTotal,
} from "../shared/pricing";

// getDb() naturally returns null in this test environment (no DATABASE_URL),
// which is what every other test in this file relies on. Wrapping it in
// vi.fn(actual.getDb) preserves that real behavior by default and lets the
// two db.ts hardening tests below inject an in-memory fake just for their
// own assertions.
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getDb: vi.fn(actual.getDb) };
});

// Clears call history (not the underlying implementation) before every test
// in this file, so call-count assertions below aren't order-dependent on
// whatever earlier tests happened to invoke.
beforeEach(() => {
  vi.mocked(getDb).mockClear();
});

// These tests exercise the Stripe integration itself, so they assume
// payments are turned on — the "payments disabled" path is tested
// separately below.
ENV.paymentsEnabled = true;

// ─── Mock context ─────────────────────────────────────────────────────────────
function createAuthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "email",
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
  it("returns all 4 price configurations — no HRT Add-on", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();

    expect(plans).toHaveLength(4);
    const planIds = plans.map((p) => p.planId);
    expect(planIds).toContain("Pro");
    expect(planIds).toContain("Premier");
    expect(planIds).not.toContain("HRT_Addon");
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

  it("Pro monthly price matches shared/pricing.ts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();

    const proMonthly = plans.find((p) => p.planId === "Pro" && p.billingCycle === "monthly");
    expect(proMonthly?.amount).toBe(trueMonthlyCents("Pro"));
    expect(proMonthly?.displayPrice).toBe(displayTrueMonthly("Pro"));
  });

  it("Premier annual price matches shared/pricing.ts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();

    const premierAnnual = plans.find((p) => p.planId === "Premier" && p.billingCycle === "annual");
    expect(premierAnnual?.amount).toBe(annualTotalCents("Premier"));
    expect(premierAnnual?.displayPrice).toBe(displayAnnualTotal("Premier"));
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

describe("billing.paymentsEnabled gate", () => {
  it("blocks checkout with a friendly message when payments are disabled", async () => {
    ENV.paymentsEnabled = false;
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.billing.createCheckout({ planId: "Pro", billingCycle: "monthly" })
    ).rejects.toThrow("Payments are coming soon");

    ENV.paymentsEnabled = true;
  });

  it("blocks the billing portal with the same message when disabled", async () => {
    ENV.paymentsEnabled = false;
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.billing.createPortalSession()).rejects.toThrow(
      "Payments are coming soon"
    );

    ENV.paymentsEnabled = true;
  });

  it("reports its state via the public paymentsEnabled query", async () => {
    ENV.paymentsEnabled = false;
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(await caller.billing.paymentsEnabled()).toBe(false);

    ENV.paymentsEnabled = true;
    expect(await caller.billing.paymentsEnabled()).toBe(true);
  });
});

// ─── Webhook hardening ──────────────────────────────────────────────────────
// See server/billing/webhook.ts. Both checks below must fire before the
// request body is ever parsed.

function createFakeReqRes(body: unknown = { id: "evt_test_1", type: "checkout.session.completed" }) {
  const req = {
    headers: { "stripe-signature": "sig_test" },
    body: Buffer.from(JSON.stringify(body)),
  } as unknown as Request;

  const state: { statusCode?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      state.body = payload;
      return res;
    },
  } as unknown as Response;

  return { req, res, state };
}

describe("handleStripeWebhook — hardening", () => {
  it("returns 503 and never parses the body when STRIPE_WEBHOOK_SECRET is unset", async () => {
    const originalKey = process.env.STRIPE_SECRET_KEY;
    const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_SECRET_KEY = "sk_test_fake_key_for_testing";
    delete process.env.STRIPE_WEBHOOK_SECRET;
    ENV.paymentsEnabled = true;

    // A body that would resolve to a real, writable user if it were ever parsed.
    const { req, res, state } = createFakeReqRes({
      id: "evt_test_forged",
      type: "checkout.session.completed",
      data: { object: { mode: "subscription", client_reference_id: "1" } },
    });

    await handleStripeWebhook(req, res);

    expect(state.statusCode).toBe(503);
    expect(vi.mocked(getDb)).not.toHaveBeenCalled();

    if (originalKey) process.env.STRIPE_SECRET_KEY = originalKey;
    else delete process.env.STRIPE_SECRET_KEY;
    if (originalSecret) process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });

  it("returns 503 when payments are disabled, before touching the body at all", async () => {
    ENV.paymentsEnabled = false;
    const { req, res, state } = createFakeReqRes();

    await handleStripeWebhook(req, res);

    expect(state.statusCode).toBe(503);
    ENV.paymentsEnabled = true;
  });
});

// ─── db.ts hardening ────────────────────────────────────────────────────────
// Minimal fake drizzle client covering only the chains server/billing/db.ts
// actually calls: select().from(table).where(...)[.limit(n)],
// update(table).set(v).where(...), insert(table).values(v).onDuplicateKeyUpdate(...).

function createFakeDb(seed: {
  users?: Array<{ id: number }>;
  subscriptions?: Array<{ userId: number; planId: string; status: string }>;
  stripeCustomers?: Array<{ userId: number; stripeCustomerId: string }>;
} = {}) {
  const state = {
    users: seed.users ?? [],
    subscriptions: seed.subscriptions ?? [],
    stripeCustomers: seed.stripeCustomers ?? [],
  };
  const updates: Array<{ table: string; values: unknown }> = [];
  const inserts: Array<{ table: string; values: unknown }> = [];

  function nameOf(table: unknown): "users" | "subscriptions" | "stripeCustomers" {
    if (table === users) return "users";
    if (table === subscriptions) return "subscriptions";
    if (table === stripeCustomers) return "stripeCustomers";
    throw new Error("createFakeDb: unrecognized table");
  }

  // Each test seeds exactly the row(s) its own query needs, so the fake
  // .where() doesn't need to evaluate the real drizzle condition — it just
  // returns whatever was seeded for that table.
  function queryResult<T>(rows: T[]) {
    const promise = Promise.resolve(rows) as Promise<T[]> & { limit: (n: number) => Promise<T[]> };
    promise.limit = (n: number) => Promise.resolve(rows.slice(0, n));
    return promise;
  }

  const fakeDb = {
    select: () => ({
      from: (table: unknown) => ({
        where: () => queryResult((state as Record<string, unknown[]>)[nameOf(table)]),
      }),
    }),
    update: (table: unknown) => ({
      set: (values: unknown) => ({
        where: () => {
          updates.push({ table: nameOf(table), values });
          return Promise.resolve();
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: unknown) => ({
        onDuplicateKeyUpdate: () => {
          inserts.push({ table: nameOf(table), values });
          return Promise.resolve();
        },
      }),
    }),
  };

  return { fakeDb, updates, inserts };
}

describe("syncUserLicenseTier — nonexistent user", () => {
  it("no-ops and logs instead of writing when the user row doesn't exist", async () => {
    const { fakeDb, updates } = createFakeDb({ users: [] });
    vi.mocked(getDb).mockResolvedValueOnce(fakeDb as never);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const tier = await syncUserLicenseTier(999);

    expect(tier).toBe("Free");
    expect(updates).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("no user found for id 999"));

    warnSpy.mockRestore();
  });

  it("still updates when the user does exist", async () => {
    const { fakeDb, updates } = createFakeDb({
      users: [{ id: 1 }],
      subscriptions: [{ userId: 1, planId: "Pro", status: "active" }],
    });
    vi.mocked(getDb).mockResolvedValueOnce(fakeDb as never).mockResolvedValueOnce(fakeDb as never);

    const tier = await syncUserLicenseTier(1);

    expect(tier).toBe("Pro");
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ table: "users", values: { licenseTier: "Pro" } });
  });
});

describe("upsertStripeCustomer — reassignment guard", () => {
  it("refuses to overwrite an existing customer ID with a different one", async () => {
    const { fakeDb, inserts } = createFakeDb({
      stripeCustomers: [{ userId: 1, stripeCustomerId: "cus_existing" }],
    });
    // Two getDb() calls happen per upsertStripeCustomer invocation: one
    // directly, one inside its own call to getStripeCustomerId().
    vi.mocked(getDb).mockResolvedValueOnce(fakeDb as never).mockResolvedValueOnce(fakeDb as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await upsertStripeCustomer(1, "cus_attacker_controlled");

    expect(result).toEqual({ ok: false, reason: expect.stringContaining("already assigned") });
    expect(inserts).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("allows setting the customer ID when none is assigned yet", async () => {
    const { fakeDb, inserts } = createFakeDb({ stripeCustomers: [] });
    vi.mocked(getDb).mockResolvedValueOnce(fakeDb as never).mockResolvedValueOnce(fakeDb as never);

    const result = await upsertStripeCustomer(1, "cus_new");

    expect(result).toEqual({ ok: true });
    expect(inserts).toHaveLength(1);
  });

  it("allows re-saving the same customer ID (idempotent)", async () => {
    const { fakeDb, inserts } = createFakeDb({
      stripeCustomers: [{ userId: 1, stripeCustomerId: "cus_existing" }],
    });
    vi.mocked(getDb).mockResolvedValueOnce(fakeDb as never).mockResolvedValueOnce(fakeDb as never);

    const result = await upsertStripeCustomer(1, "cus_existing");

    expect(result).toEqual({ ok: true });
    expect(inserts).toHaveLength(1);
  });
});
