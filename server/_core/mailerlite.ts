// ─── MailerLite integration — the one small, swappable module ─────────────────
// Keeps the provider call behind a narrow surface so a future switch (e.g. to
// ConvertKit) only touches this file. The API key never reaches the client —
// only server/_core/mailerliteProxy.ts calls this module, from a server route.

export const GREENE_WIDGET_SOURCE = "greene-widget";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAILERLITE_API_BASE = "https://connect.mailerlite.com/api";

export type SubscribePayloadValidation = { email: string } | { error: string };

// Pure validation — no network, no Express. The client is only ever supposed
// to send { email, source: "greene-widget" }; this both shapes-checks that
// and rejects any other source value, since this endpoint exists for this
// one widget and shouldn't double as a general-purpose subscribe proxy.
export function validateSubscribePayload(body: unknown): SubscribePayloadValidation {
  if (typeof body !== "object" || body === null) return { error: "Invalid request body." };
  const { email, source } = body as Record<string, unknown>;
  if (source !== GREENE_WIDGET_SOURCE) return { error: "Invalid source." };
  if (typeof email !== "string" || email.length === 0 || email.length > 320 || !EMAIL_RE.test(email)) {
    return { error: "Invalid email address." };
  }
  return { email };
}

export interface MailerliteDeps {
  apiKey: string;
  fetchImpl?: typeof fetch;
}

// Resolved once per process and cached — group IDs don't change once a group
// exists, and this avoids a lookup call on every signup. Module-level rather
// than per-deps so it's shared across requests; tests reset it explicitly.
let cachedGroupId: string | null = null;

export function __resetGroupIdCacheForTests(): void {
  cachedGroupId = null;
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

async function resolveGroupId(deps: MailerliteDeps): Promise<string | null> {
  if (cachedGroupId) return cachedGroupId;
  const doFetch = deps.fetchImpl ?? fetch;
  try {
    const resp = await doFetch(
      `${MAILERLITE_API_BASE}/groups?filter[name]=${encodeURIComponent(GREENE_WIDGET_SOURCE)}`,
      { headers: authHeaders(deps.apiKey) }
    );
    if (!resp.ok) return null;
    const body = (await resp.json()) as { data?: Array<{ id: string; name: string }> };
    const match = body.data?.find((g) => g.name === GREENE_WIDGET_SOURCE);
    if (!match) return null;
    cachedGroupId = match.id;
    return cachedGroupId;
  } catch (error) {
    console.error("[MailerLite] Failed to resolve group id:", error);
    return null;
  }
}

export interface SubscribeOutcome {
  ok: boolean;
  status: number;
}

// Subscribes (or non-destructively updates) an email, tagged with the
// greene-widget group when the group lookup succeeds. If the group can't be
// resolved, the subscriber is still captured — a segmentation hiccup
// shouldn't turn into a signup failure for the visitor.
export async function subscribeToGreeneWidget(email: string, deps: MailerliteDeps): Promise<SubscribeOutcome> {
  const doFetch = deps.fetchImpl ?? fetch;
  const groupId = await resolveGroupId(deps);

  const payload: Record<string, unknown> = { email };
  if (groupId) payload.groups = [groupId];
  else console.error(`[MailerLite] Could not resolve the "${GREENE_WIDGET_SOURCE}" group — subscribing without a group tag.`);

  try {
    const resp = await doFetch(`${MAILERLITE_API_BASE}/subscribers`, {
      method: "POST",
      headers: authHeaders(deps.apiKey),
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(`[MailerLite] subscribe failed: ${resp.status} ${body}`);
    }
    return { ok: resp.ok, status: resp.status };
  } catch (error) {
    console.error("[MailerLite] subscribe error:", error);
    return { ok: false, status: 502 };
  }
}
