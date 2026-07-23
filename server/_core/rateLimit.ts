import type { Request, Response, NextFunction } from "express";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

// Minimal in-memory, single-process rate limiter. No existing rate-limit
// pattern to reuse in this codebase (see the Phase 0 audit for the Greene
// widget email capture work) — this is the simplest defensible option for a
// single Railway instance. A multi-instance deployment would need a shared
// store (e.g. Redis) instead of the in-memory Map below.
export function createRateLimiter({ windowMs, max }: RateLimitOptions) {
  const hits = new Map<string, number[]>();

  // Opportunistic cleanup so IPs that hit once and never return don't sit in
  // memory forever. Not load-bearing for correctness — just housekeeping.
  const sweepInterval = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    hits.forEach((timestamps, key) => {
      const fresh = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    });
  }, windowMs);
  sweepInterval.unref?.();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const cutoff = now - windowMs;
    const timestamps = (hits.get(key) ?? []).filter((t) => t > cutoff);

    if (timestamps.length >= max) {
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }

    timestamps.push(now);
    hits.set(key, timestamps);
    next();
  };
}
