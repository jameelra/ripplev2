// ─── Ripple v2 — Billing tRPC Router ─────────────────────────────────────────
import Stripe from "stripe";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getPriceConfig,
  getPriceConfigByPriceId,
  PRICES,
  PlanId,
  BillingCycle,
} from "./products";
import {
  getStripeCustomerId,
  upsertStripeCustomer,
  getActiveSubscriptions,
  syncUserLicenseTier,
  updateSubscriptionStatus,
} from "./db";

// ─── Stripe client ────────────────────────────────────────────────────────────
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("[Billing] STRIPE_SECRET_KEY not set — billing unavailable");
    return null;
  }
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

// ─── Billing Router ───────────────────────────────────────────────────────────
export const billingRouter = router({
  // ── Get available plans ────────────────────────────────────────────────────
  getPlans: protectedProcedure.query(() => {
    return PRICES.map((p) => ({
      planId: p.planId,
      billingCycle: p.billingCycle,
      amount: p.amount,
      displayPrice: p.displayPrice,
      licenseTier: p.licenseTier,
      priceId: p.priceId,
    }));
  }),

  // ── Get current subscription status ───────────────────────────────────────
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subs = await getActiveSubscriptions(ctx.user.id);
    return {
      activePlans: subs.map((s) => ({
        planId: s.planId,
        billingCycle: s.billingCycle,
        status: s.status,
        currentPeriodEnd: s.currentPeriodEnd,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
        stripeSubscriptionId: s.stripeSubscriptionId,
      })),
      licenseTier: ctx.user.licenseTier,
    };
  }),

  // ── Create Stripe Checkout Session ────────────────────────────────────────
  createCheckout: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["Pro", "Premier", "HRT_Addon"]),
        billingCycle: z.enum(["monthly", "annual"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      if (!stripe) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Stripe is not configured. Please add STRIPE_SECRET_KEY in Settings → Payment.",
        });
      }

      const priceConfig = getPriceConfig(input.planId as PlanId, input.billingCycle as BillingCycle);
      if (!priceConfig) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid plan or billing cycle." });
      }

      if (priceConfig.priceId.includes("placeholder")) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Stripe Price ID for ${input.planId} ${input.billingCycle} is not configured. Please add STRIPE_PRICE_${input.planId.toUpperCase()}_${input.billingCycle.toUpperCase()} in Settings → Payment.`,
        });
      }

      // Get or create Stripe customer
      let stripeCustomerId = await getStripeCustomerId(ctx.user.id);
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: ctx.user.email ?? undefined,
          name: ctx.user.name ?? undefined,
          metadata: {
            userId: ctx.user.id.toString(),
            openId: ctx.user.openId,
          },
        });
        stripeCustomerId = customer.id;
        await upsertStripeCustomer(ctx.user.id, stripeCustomerId);
      }

      // Build origin for redirect URLs
      const origin = ctx.req.headers.origin as string ?? "https://ripple.health";

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId!,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceConfig.priceId,
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          plan_id: input.planId,
          billing_cycle: input.billingCycle,
        },
        success_url: `${origin}/?payment=success&plan=${input.planId}`,
        cancel_url: `${origin}/?payment=cancelled`,
      });

      return { checkoutUrl: session.url };
    }),

  // ── Create Customer Portal Session (manage/cancel) ─────────────────────────
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    if (!stripe) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe is not configured." });
    }

    const stripeCustomerId = await getStripeCustomerId(ctx.user.id);
    if (!stripeCustomerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No Stripe customer found. Please subscribe first.",
      });
    }

    const origin = ctx.req.headers.origin as string ?? "https://ripple.health";
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/`,
    });

    return { portalUrl: session.url };
  }),
});
