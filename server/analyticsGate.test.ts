import { describe, expect, it } from "vitest";
import { shouldLoadPublicAnalytics } from "../client/src/lib/analytics";

// client/index.html is a single build entry shared between the pre-vault
// visitor and the fully authenticated app (see client/src/App.tsx —
// AppRouter renders Onboarding, VaultGate, or AppShell from the same
// bundle/URL based on client-side vault state, not a route change). This is
// the gate that keeps the Cloudflare beacon out of the authenticated app:
// once a vault has ever been configured on the device, analytics must never
// load, full stop.
describe("shouldLoadPublicAnalytics", () => {
  it("allows analytics before any vault has been configured (the pre-signup, marketing-like state)", () => {
    expect(shouldLoadPublicAnalytics(false)).toBe(true);
  });

  it("blocks analytics once a vault has been configured — this is the authenticated app, not a marketing visitor", () => {
    expect(shouldLoadPublicAnalytics(true)).toBe(false);
  });
});
