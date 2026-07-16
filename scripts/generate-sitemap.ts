import fs from "node:fs";
import path from "node:path";
import { PUBLIC_TOOL_PAGES } from "../shared/publicPages";

// Regenerated on every `npm run build` from shared/publicPages.ts — add a new
// public tool page there and it appears here automatically. Never hand-edit
// the generated files in client/public/.

const SITE_URL = "https://ripplehealth.app";
const OUTPUT_DIR = path.resolve(import.meta.dirname, "..", "client", "public");

interface SitemapUrl {
  loc: string;
  changefreq: "daily" | "monthly" | "yearly";
  priority: number;
}

const urls: SitemapUrl[] = [
  { loc: `${SITE_URL}/`, changefreq: "monthly", priority: 1.0 },
  ...PUBLIC_TOOL_PAGES.map(page => ({
    loc: `${SITE_URL}/tools/${page.slug}/`,
    changefreq: page.changefreq,
    priority: page.priority,
  })),
];

function buildSitemapXml(entries: SitemapUrl[]): string {
  const urlEntries = entries
    .map(
      u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

function buildRobotsTxt(): string {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_DIR, "sitemap.xml"), buildSitemapXml(urls));
fs.writeFileSync(path.join(OUTPUT_DIR, "robots.txt"), buildRobotsTxt());

console.log(`Generated sitemap.xml with ${urls.length} URL(s) and robots.txt in ${OUTPUT_DIR}`);
