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
  // Three more SEO tool pages are planned — add each here as it ships.
];
