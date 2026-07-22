import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  buildCloudflareBeaconTag,
  buildGoogleSiteVerificationTag,
} from "../shared/publicPageHead";
import { PUBLIC_TOOL_PAGES } from "../shared/publicPages";

// The Cloudflare beacon and Google Search Console verification tags are
// injected at build time by the transformIndexHtml plugin in vite.config.ts,
// which replaces these marker comments — or removes them entirely when the
// corresponding env var is unset. These tests check the pure tag builders
// directly, and check that the source HTML files carry the markers (or
// deliberately don't) in the right places.

describe("buildGoogleSiteVerificationTag", () => {
  it("renders no tag when the token is unset", () => {
    expect(buildGoogleSiteVerificationTag(undefined)).toBe("");
    expect(buildGoogleSiteVerificationTag("")).toBe("");
  });

  it("renders the meta tag when a token is provided", () => {
    expect(buildGoogleSiteVerificationTag("abc123")).toBe(
      '<meta name="google-site-verification" content="abc123" />'
    );
  });
});

describe("buildCloudflareBeaconTag", () => {
  it("renders no tag when the token is unset", () => {
    expect(buildCloudflareBeaconTag(undefined)).toBe("");
    expect(buildCloudflareBeaconTag("")).toBe("");
  });

  it("renders a deferred beacon script when a token is provided", () => {
    const tag = buildCloudflareBeaconTag("beacon-token");
    expect(tag).toContain("<script defer");
    expect(tag).toContain(
      "https://static.cloudflareinsights.com/beacon.min.js"
    );
    expect(tag).toContain('data-cf-beacon=\'{"token": "beacon-token"}\'');
  });
});

function readHtml(relativePath: string): string {
  return fs.readFileSync(
    path.resolve(import.meta.dirname, "..", relativePath),
    "utf-8"
  );
}

describe("public page head markers", () => {
  it("every public tool page carries both the beacon and GSC verification markers", () => {
    for (const page of PUBLIC_TOOL_PAGES) {
      const html = readHtml(`client/tools/${page.slug}/index.html`);
      expect(
        html,
        `${page.slug} should have the cloudflare-beacon marker`
      ).toContain("<!-- cloudflare-beacon -->");
      expect(
        html,
        `${page.slug} should have the google-site-verification marker`
      ).toContain("<!-- google-site-verification -->");
    }
  });

  it("the authenticated app's shared shell (client/index.html) never carries the beacon marker", () => {
    const html = readHtml("client/index.html");
    expect(html).not.toContain("<!-- cloudflare-beacon -->");
    expect(html).not.toContain("static.cloudflareinsights.com");
    expect(html).not.toContain("data-cf-beacon");
  });

  it("client/index.html still carries the GSC verification marker (a static tag, not tracking)", () => {
    const html = readHtml("client/index.html");
    expect(html).toContain("<!-- google-site-verification -->");
  });

  it("removes the old, unconditional analytics scaffolding from the shared app shell", () => {
    const html = readHtml("client/index.html");
    expect(html).not.toContain("umami");
    expect(html).not.toContain("VITE_ANALYTICS_ENDPOINT");
    expect(html).not.toContain("VITE_ANALYTICS_WEBSITE_ID");
  });
});
