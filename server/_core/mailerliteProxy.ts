import type { Express } from "express";
import { ENV } from "./env";
import { createRateLimiter } from "./rateLimit";
import { validateSubscribePayload, subscribeToGreeneWidget } from "./mailerlite";

// Public but rate-limited: 5 requests per IP per 10 minutes. This is the
// only network endpoint the Greene widget calls, and it accepts exactly
// { email, source } — see client/tools/greene-climacteric-scale/main.ts and
// the privacy invariant test in server/greeneWidgetSubscribe.test.ts.
const subscribeRateLimit = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

export function registerMailerliteProxy(app: Express) {
  app.post("/api/greene-widget/subscribe", subscribeRateLimit, async (req, res) => {
    if (!ENV.mailerliteApiKey) {
      console.error("[MailerLite] MAILERLITE_API_KEY is not set — email capture is unavailable.");
      res.status(500).json({ error: "Email capture is not configured." });
      return;
    }

    const validation = validateSubscribePayload(req.body);
    if ("error" in validation) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const outcome = await subscribeToGreeneWidget(validation.email, { apiKey: ENV.mailerliteApiKey });
    if (!outcome.ok) {
      res.status(502).json({ error: "Could not subscribe right now. Please try again." });
      return;
    }

    res.status(200).json({ success: true });
  });
}
