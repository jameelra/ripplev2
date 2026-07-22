// ─── Env-gated <head> tags for the public pages ─────────────────────────────
// Pure string builders so the empty-env-means-no-tag behavior is unit
// testable without spinning up Vite. Wired into the build via the
// transformIndexHtml plugin in vite.config.ts, which replaces the
// `<!-- google-site-verification -->` and `<!-- cloudflare-beacon -->`
// marker comments in each public page's head with the output of these.

export function buildGoogleSiteVerificationTag(
  token: string | undefined
): string {
  if (!token) return "";
  return `<meta name="google-site-verification" content="${token}" />`;
}

export function buildCloudflareBeaconTag(token: string | undefined): string {
  if (!token) return "";
  return `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${token}"}'></script>`;
}
