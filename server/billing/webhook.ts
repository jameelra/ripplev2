// ─── Ripple v2 — Stripe Webhook Handler ──────────────────────────────────────
import { Request, Response } from "express";
import Stripe from "stripe";
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
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const stripe = getStripe();
  if (!stripe) {
    console.warn("[Webhook] Stripe not configured — ignoring event");
    res.json({ received: true });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      // No webhook secret — parse raw body directly (dev/test only)
      event = JSON.parse(req.body.toString()) as Stripe.Event;
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
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

        // Save Stripe customer ID
        if (session.customer) {
          await upsertStripeCustomer(userId, session.customer as string);
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
