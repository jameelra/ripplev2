// ─── Public, unauthenticated SEO tool pages ─────────────────────────────────
// Single source of truth for the standalone static pages that live outside
// the authenticated SPA (client/tools/<slug>/index.html). Adding a new page
// here wires it into: the build's Vite entries, the Express clean-URL routes,
// the dev-server routing, and sitemap.xml generation — nothing else to touch.

export interface PublicToolPage {
  slug: string; // URL path segment under /tools/, e.g. "greene-climacteric-scale"
  changefreq: "monthly" | "yearly";
  priority: number; // 0.0–1.0, relative to the homepage (1.0)
}

export const PUBLIC_TOOL_PAGES: PublicToolPage[] = [
  { slug: "greene-climacteric-scale", changefreq: "monthly", priority: 0.9 },
  { slug: "dismissal-tracker", changefreq: "monthly", priority: 0.9 },
  { slug: "evidence-engine", changefreq: "monthly", priority: 0.9 },
  { slug: "appointment-prep", changefreq: "monthly", priority: 0.9 },
  { slug: "hrt-tracker", changefreq: "monthly", priority: 0.9 },
  { slug: "balance-alternative", changefreq: "monthly", priority: 0.9 },
  { slug: "ripple-vs-balance", changefreq: "monthly", priority: 0.9 },
  { slug: "cycle-changes", changefreq: "monthly", priority: 0.9 },
];

// Hand-authored locale twins of a PUBLIC_TOOL_PAGES entry that live outside
// /tools/ (e.g. French-Canadian pages under /fr/). There's no i18n framework
// here — each locale page is its own static HTML + main.ts, wired in
// separately from the English original.
export interface PublicLocalePage {
  urlPath: string; // full path segment under the site root, e.g. "fr/outils/changements-du-cycle"
  dir: string; // path under client/, e.g. "fr/outils/changements-du-cycle"
  changefreq: "monthly" | "yearly";
  priority: number;
}

// Populated once each locale page's HTML actually exists — see
// client/fr/outils/changements-du-cycle/ (added alongside the French draft).
export const PUBLIC_LOCALE_PAGES: PublicLocalePage[] = [];
