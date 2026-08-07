// ─── Ripple v2 — Stripe Webhook Handler ──────────────────────────────────────
import { Request, Response } from "express";
import Stripe from "stripe";
import { ENV } from "../_core/env";
import {
  upsertStripeCustomer,
  upsertSubscription,
  updateSubscriptionStatus,
  getUserByStripeCustomerId,
  syncUserLicenseTier,
} from "./db";
import { getPriceConfigByPriceId } from "./products";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
}

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  // Checked before any body handling — this endpoint has no other gate, so a
  // disabled-payments deployment must never even look at the request body.
  if (!ENV.paymentsEnabled) {
    res.status(503).json({ error: "Payments are not enabled." });
    return;
  }

  const stripe = getStripe();
  if (!stripe) {
    console.warn("[Webhook] Stripe not configured — refusing event");
    res.status(503).json({ error: "Stripe is not configured." });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // No unsigned fallback: without a webhook secret there is no way to tell a
  // genuine Stripe event from an arbitrary POST, so we refuse to parse the
  // body at all rather than trust it. Local testing should use the signing
  // secret the Stripe CLI prints for `stripe listen --forward-to ...`, not a
  // parse-without-verifying code path.
  if (!webhookSecret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET is not set — refusing to process the event unsigned.");
    res.status(503).json({ error: "Webhook signing secret is not configured." });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    res.status(400).json({ error: "Webhook signature verification failed" });
    return;
  }

  // ── Test event detection (required for webhook verification) ──────────────
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    res.json({ verified: true });
    return;
  }

  console.log(`[Webhook] Processing event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      // ── Checkout completed — subscription created ────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = parseInt(session.client_reference_id ?? session.metadata?.user_id ?? "0");
        if (!userId) {
          console.error("[Webhook] No user_id in checkout session metadata");
          break;
        }

        // Save Stripe customer ID — refuse the whole event if it would
        // reassign an existing customer ID to a different one, rather than
        // silently overwriting it (see upsertStripeCustomer in ./db).
        if (session.customer) {
          const customerResult = await upsertStripeCustomer(userId, session.customer as string);
          if (!customerResult.ok) {
            console.error(
              `[Webhook] Rejecting checkout.session.completed for user ${userId}: ${customerResult.reason}`
            );
            break;
          }
        }

        // Retrieve the full subscription to get price details
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id ?? "";
        const priceConfig = getPriceConfigByPriceId(priceId);

        if (!priceConfig) {
          console.error(`[Webhook] Unknown price ID: ${priceId}`);
          break;
        }

        // Use type assertion for newer Stripe API fields
        const sub = subscription as any;
        await upsertSubscription({
          userId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId,
          planId: priceConfig.planId,
          billingCycle: priceConfig.billingCycle,
          status: subscription.status,
          currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
          cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
        });

        const tier = await syncUserLicenseTier(userId);
        console.log(`[Webhook] User ${userId} subscribed to ${priceConfig.planId} — tier: ${tier}`);
        break;
      }

      // ── Subscription updated (renewal, upgrade, downgrade) ───────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const priceId = subscription.items?.data[0]?.price?.id ?? "";
        const priceConfig = getPriceConfigByPriceId(priceId);

        await updateSubscriptionStatus(
          subscription.id,
          subscription.status,
          subscription.cancel_at_period_end,
          subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined
        );

        // If price changed (upgrade/downgrade), update plan details
        if (priceConfig) {
          const user = await getUserByStripeCustomerId(subscription.customer as string);
          if (user) {
            await upsertSubscription({
              userId: user.id,
              stripeSubscriptionId: subscription.id,
              stripePriceId: priceId,
              planId: priceConfig.planId,
              billingCycle: priceConfig.billingCycle,
              status: subscription.status,
              currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
              cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            });
            await syncUserLicenseTier(user.id);
          }
        }
        break;
      }

      // ── Subscription deleted (cancelled, expired) ─────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await updateSubscriptionStatus(subscription.id, "canceled");

        const user = await getUserByStripeCustomerId(subscription.customer as string);
        if (user) {
          const tier = await syncUserLicenseTier(user.id);
          console.log(`[Webhook] User ${user.id} subscription cancelled — tier downgraded to ${tier}`);
        }
        break;
      }

      // ── Invoice paid (renewal) ─────────────────────────────────────────────────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string | null;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
        await updateSubscriptionStatus(
          subscriptionId,
          subscription.status,
          subscription.cancel_at_period_end,
          subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined
        );
        console.log(`[Webhook] Invoice paid for subscription ${subscriptionId}`);
        break;
      }

      // ── Invoice payment failed ────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string | null;
        if (!subscriptionId) break;

        await updateSubscriptionStatus(subscriptionId, "past_due");
        console.warn(`[Webhook] Payment failed for subscription ${subscriptionId}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Webhook] Error processing ${event.type}:`, err);
    res.status(500).json({ error: "Webhook processing failed" });
    return;
  }

  res.json({ received: true });
}
