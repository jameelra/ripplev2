// The SPA at "/" (client/index.html) is a single build entry shared between
// the pre-vault onboarding experience and the fully authenticated app — same
// bundle, same URL, gated by client-side vault state rather than a route
// change (see AppRouter in ../App.tsx). The Cloudflare beacon tag itself is
// therefore never baked into this entry's HTML (only the 7 static tool pages
// get it — see the vite.config.ts head-injection plugin). This gate gives the
// SPA a narrow, JS-level opt-in: fire the beacon only for the pre-vault
// visitor, and never once a vault has ever been configured on this device.
export function shouldLoadPublicAnalytics(isVaultConfigured: boolean): boolean {
  return !isVaultConfigured;
}

let beaconMounted = false;

export function loadCloudflareBeacon(token: string): void {
  if (beaconMounted || !token) return;
  beaconMounted = true;
  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.setAttribute("data-cf-beacon", JSON.stringify({ token }));
  document.head.appendChild(script);
}
