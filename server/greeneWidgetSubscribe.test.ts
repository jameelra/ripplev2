import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  validateSubscribePayload,
  subscribeToGreeneWidget,
  GREENE_WIDGET_SOURCE,
  __resetGroupIdCacheForTests,
} from "./_core/mailerlite";

describe("validateSubscribePayload — the only thing the client is allowed to send", () => {
  it("accepts a well-formed { email, source } payload", () => {
    const result = validateSubscribePayload({ email: "jane@example.com", source: GREENE_WIDGET_SOURCE });
    expect(result).toEqual({ email: "jane@example.com" });
  });

  it("rejects any source other than the exact greene-widget tag", () => {
    expect(validateSubscribePayload({ email: "jane@example.com", source: "other-widget" })).toEqual({ error: "Invalid source." });
    expect(validateSubscribePayload({ email: "jane@example.com" })).toEqual({ error: "Invalid source." });
    expect(validateSubscribePayload({ email: "jane@example.com", source: "" })).toEqual({ error: "Invalid source." });
  });

  it("rejects malformed, missing, or oversized email addresses", () => {
    expect(validateSubscribePayload({ email: "not-an-email", source: GREENE_WIDGET_SOURCE })).toEqual({ error: "Invalid email address." });
    expect(validateSubscribePayload({ email: "", source: GREENE_WIDGET_SOURCE })).toEqual({ error: "Invalid email address." });
    expect(validateSubscribePayload({ source: GREENE_WIDGET_SOURCE })).toEqual({ error: "Invalid email address." });
    expect(validateSubscribePayload({ email: `${"a".repeat(315)}@x.com`, source: GREENE_WIDGET_SOURCE })).toEqual({ error: "Invalid email address." });
  });

  it("rejects a non-object body without throwing", () => {
    expect(validateSubscribePayload(null)).toEqual({ error: "Invalid request body." });
    expect(validateSubscribePayload("email@example.com")).toEqual({ error: "Invalid request body." });
    expect(validateSubscribePayload(undefined)).toEqual({ error: "Invalid request body." });
  });

  it("ignores extra fields rather than rejecting them (the client-side privacy guarantee lives in what the widget sends, not server-side shape strictness)", () => {
    const result = validateSubscribePayload({ email: "jane@example.com", source: GREENE_WIDGET_SOURCE, total: 42, responses: { 1: 3 } });
    expect(result).toEqual({ email: "jane@example.com" });
  });
});

describe("subscribeToGreeneWidget — MailerLite call shape", () => {
  beforeEach(() => {
    __resetGroupIdCacheForTests();
  });

  it("resolves the greene-widget group id and tags the subscriber with it", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.includes("/groups")) {
        return new Response(JSON.stringify({ data: [{ id: "999888777", name: GREENE_WIDGET_SOURCE }] }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { id: "1", email: "jane@example.com" } }), { status: 200 });
    }) as unknown as typeof fetch;

    const outcome = await subscribeToGreeneWidget("jane@example.com", { apiKey: "test-key", fetchImpl });

    expect(outcome).toEqual({ ok: true, status: 200 });
    expect(calls).toHaveLength(2);
    expect(calls[0].url).toContain("/groups?filter[name]=greene-widget");
    expect(calls[1].url).toBe("https://connect.mailerlite.com/api/subscribers");

    const headers = calls[1].init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-key");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers.Accept).toBe("application/json");

    const body = JSON.parse(calls[1].init?.body as string);
    expect(body).toEqual({ email: "jane@example.com", groups: ["999888777"] });
  });

  it("caches the resolved group id — a second subscribe call doesn't re-fetch groups", async () => {
    const groupsCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("/groups")) {
        groupsCalls.push(url);
        return new Response(JSON.stringify({ data: [{ id: "42", name: GREENE_WIDGET_SOURCE }] }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    }) as unknown as typeof fetch;

    await subscribeToGreeneWidget("a@example.com", { apiKey: "k", fetchImpl });
    await subscribeToGreeneWidget("b@example.com", { apiKey: "k", fetchImpl });

    expect(groupsCalls).toHaveLength(1);
  });

  it("still subscribes the email even if the group can't be resolved — a segmentation hiccup shouldn't fail the signup", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("/groups")) return new Response(JSON.stringify({ data: [] }), { status: 200 });
      return new Response(JSON.stringify({ data: { id: "1" } }), { status: 200 });
    }) as unknown as typeof fetch;

    const outcome = await subscribeToGreeneWidget("jane@example.com", { apiKey: "test-key", fetchImpl });

    expect(outcome).toEqual({ ok: true, status: 200 });
  });

  it("reports failure when MailerLite rejects the subscribe call", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("/groups")) return new Response(JSON.stringify({ data: [] }), { status: 200 });
      return new Response("rate limited", { status: 429 });
    }) as unknown as typeof fetch;

    const outcome = await subscribeToGreeneWidget("jane@example.com", { apiKey: "test-key", fetchImpl });

    expect(outcome).toEqual({ ok: false, status: 429 });
  });

  it("reports failure without throwing when the network call itself fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;

    const outcome = await subscribeToGreeneWidget("jane@example.com", { apiKey: "test-key", fetchImpl });

    expect(outcome).toEqual({ ok: false, status: 502 });
  });
});
