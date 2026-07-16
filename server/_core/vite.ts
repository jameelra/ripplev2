import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { PUBLIC_TOOL_PAGES } from "../../shared/publicPages";

// Public static tool pages (e.g. /tools/greene-climacteric-scale) are separate
// Vite build entries, not part of the SPA. Match a request path to the source
// HTML file that should be transformed and served for it, so dev mode mirrors
// the production multi-entry build instead of always falling back to the SPA.
function resolvePublicToolTemplatePath(urlPath: string): string | undefined {
  const match = PUBLIC_TOOL_PAGES.find(
    page => urlPath === `/tools/${page.slug}` || urlPath === `/tools/${page.slug}/`
  );
  if (!match) return undefined;
  return path.resolve(import.meta.dirname, "../..", "client", "tools", match.slug, "index.html");
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    const urlPath = url.split("?")[0];

    try {
      const publicToolTemplate = resolvePublicToolTemplatePath(urlPath);
      const clientTemplate =
        publicToolTemplate ??
        path.resolve(import.meta.dirname, "../..", "client", "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      if (!publicToolTemplate) {
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`
        );
      }
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
