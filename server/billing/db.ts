// ─── Ripple v2 — Billing Database Helpers ────────────────────────────────────
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  stripeCustomers,
  subscriptions,
  users,
  InsertStripeCustomer,
  InsertSubscription,
} from "../../drizzle/schema";
import { PlanId, resolveLicenseTier } from "./products";

// ─── Stripe Customer ──────────────────────────────────────────────────────────

export async function getStripeCustomerId(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.userId, userId))
    .limit(1);
  return rows[0]?.stripeCustomerId ?? null;
}

export async function upsertStripeCustomer(userId: number, stripeCustomerId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(stripeCustomers)
    .values({ userId, stripeCustomerId })
    .onDuplicateKeyUpdate({ set: { stripeCustomerId } });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function upsertSubscription(data: InsertSubscription): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(subscriptions)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        stripePriceId: data.stripePriceId,
        planId: data.planId,
        billingCycle: data.billingCycle,
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      },
    });
}

export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
  cancelAtPeriodEnd?: boolean,
  currentPeriodEnd?: Date
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(subscriptions)
    .set({
      status,
      ...(cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd } : {}),
      ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

export async function getActiveSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    );
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return null;
  const customerRows = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.stripeCustomerId, stripeCustomerId))
    .limit(1);
  if (!customerRows[0]) return null;

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, customerRows[0].userId))
    .limit(1);
  return userRows[0] ?? null;
}

// ─── Sync license tier ────────────────────────────────────────────────────────
// After any subscription change, recompute and update the user's licenseTier

export async function syncUserLicenseTier(userId: number): Promise<"Free" | "Pro" | "Premier"> {
  const db = await getDb();
  if (!db) return "Free";

  const activeSubs = await getActiveSubscriptions(userId);
  const activePlanIds = activeSubs.map((s) => s.planId as PlanId);
  const tier = resolveLicenseTier(activePlanIds);

  await db
    .update(users)
    .set({ licenseTier: tier })
    .where(eq(users.id, userId));

  return tier;
}
