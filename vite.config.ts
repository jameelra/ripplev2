import "dotenv/config";
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import { PUBLIC_TOOL_PAGES } from "./shared/publicPages";
import { buildCloudflareBeaconTag, buildGoogleSiteVerificationTag } from "./shared/publicPageHead";

// Replaces the `<!-- google-site-verification -->` and `<!-- cloudflare-beacon -->`
// marker comments present in the public pages' <head> with the real tags, or
// with nothing when the corresponding env var is unset — see
// shared/publicPageHead.ts for the empty-env-means-no-tag logic.
function publicPageHeadInjections(): Plugin {
  return {
    name: "public-page-head-injections",
    transformIndexHtml(html) {
      return html
        .replace(
          "<!-- google-site-verification -->",
          buildGoogleSiteVerificationTag(process.env.VITE_GOOGLE_SITE_VERIFICATION)
        )
        .replace(
          "<!-- cloudflare-beacon -->",
          buildCloudflareBeaconTag(process.env.VITE_CF_BEACON_TOKEN)
        );
    },
  };
}

const plugins = [react(), tailwindcss(), jsxLocPlugin(), publicPageHeadInjections()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "client", "index.html"),
        ...Object.fromEntries(
          PUBLIC_TOOL_PAGES.map(page => [
            page.slug,
            path.resolve(import.meta.dirname, "client", "tools", page.slug, "index.html"),
          ])
        ),
      },
    },
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
