import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { GREENE_WIDGET_SOURCE } from "./_core/mailerlite";

const htmlPath = path.resolve(import.meta.dirname, "../client/tools/greene-climacteric-scale/index.html");
const html = fs.readFileSync(htmlPath, "utf-8");

const mainTsPath = path.resolve(import.meta.dirname, "../client/tools/greene-climacteric-scale/main.ts");
const mainTs = fs.readFileSync(mainTsPath, "utf-8");

describe("Greene widget — email capture markup", () => {
  it("places the email form below the score card and above the product CTA, both no-print siblings of the print-only summary", () => {
    const scoreCardEnd = html.indexOf('id="greene-print-summary"');
    const emailFormStart = html.indexOf('id="greene-email-form"');
    const ctaStart = html.indexOf("Ripple tracks this score over time");

    expect(scoreCardEnd, "expected to find the print-only summary marker").toBeGreaterThan(-1);
    expect(emailFormStart, "expected to find the email form").toBeGreaterThan(-1);
    expect(ctaStart, "expected to find the product CTA").toBeGreaterThan(-1);
    expect(emailFormStart).toBeGreaterThan(scoreCardEnd);
    expect(emailFormStart).toBeLessThan(ctaStart);
  });

  it("has an email input, a submit button, and no fieldset/legend (known border-overlap bug)", () => {
    expect(html).toContain('type="email"');
    expect(html).toContain('id="greene-email-submit"');
    expect(html).not.toMatch(/<fieldset/);
    expect(html).not.toMatch(/<legend/);
  });

  it("has a honeypot field that is hidden from sighted users, not focusable by keyboard, and not autofilled", () => {
    const honeypotSection = html.slice(html.indexOf("Honeypot"), html.indexOf('id="greene-email-submit"'));
    expect(honeypotSection).toContain('id="greene-email-website"');
    expect(honeypotSection).toContain('tabindex="-1"');
    expect(honeypotSection).toContain('autocomplete="off"');
    expect(honeypotSection).toContain('aria-hidden="true"');
  });

  it("states what the subscriber receives and that they can unsubscribe, with no pre-checked boxes", () => {
    const formStart = html.indexOf('id="greene-email-form"');
    const formSection = html.slice(formStart, html.indexOf("</form>", formStart));
    expect(formSection.toLowerCase()).toContain("unsubscribe");
    expect(formSection).not.toContain("checked");
    expect(formSection).not.toMatch(/<input[^>]*type="checkbox"/);
  });

  it("does not offer a CAPTCHA", () => {
    expect(html.toLowerCase()).not.toContain("captcha");
  });
});

describe("Greene widget — email capture network privacy invariant", () => {
  it("makes exactly one network call from this page, and it targets the subscribe proxy", () => {
    const fetchCalls = [...mainTs.matchAll(/\bfetch\(/g)];
    expect(fetchCalls).toHaveLength(1);
    expect(mainTs).toContain('fetch("/api/greene-widget/subscribe"');
    // No other network primitives anywhere on this page.
    expect(mainTs).not.toContain("XMLHttpRequest");
    expect(mainTs).not.toContain("sendBeacon");
  });

  it("sends a request body containing exactly { email, source } — no score, subscale, or item response data", () => {
    const match = mainTs.match(/body:\s*JSON\.stringify\(\{([^}]*)\}\)/);
    expect(match, "expected to find the JSON.stringify(...) call passed as the fetch body").not.toBeNull();

    const objectLiteral = match![1];
    // Handles both shorthand properties (`{ email }`) and `key: value` pairs.
    const keys = objectLiteral
      .split(",")
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => segment.split(":")[0].trim())
      .sort();
    expect(keys).toEqual(["email", "source"]);

    // None of the scoring module's vocabulary appears anywhere near the payload construction.
    const forbidden = ["score", "responses", "total", "subscale", "psychological", "somatic", "vasomotor", "sexual"];
    for (const word of forbidden) {
      expect(objectLiteral.toLowerCase()).not.toContain(word);
    }
  });

  it("hardcodes the source tag to the exact value the server allowlists — not user-controllable", () => {
    expect(mainTs).toContain(`source: "${GREENE_WIDGET_SOURCE}"`);
  });

  it("never sends the honeypot field's value over the network", () => {
    // The honeypot variable is read only for its own if-check, never interpolated into the fetch body.
    const bodyCallIndex = mainTs.indexOf("JSON.stringify({");
    const bodyCallLine = mainTs.slice(bodyCallIndex, mainTs.indexOf("})", bodyCallIndex));
    expect(bodyCallLine).not.toContain("Honeypot");
    expect(bodyCallLine).not.toContain("honeypot");
  });
});
