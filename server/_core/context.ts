import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { verifySupabaseToken } from "./supabase";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function extractBearerToken(
  req: CreateExpressContextOptions["req"]
): string | null {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const token = extractBearerToken(opts.req);
    if (token) {
      const identity = await verifySupabaseToken(token);
      if (identity) {
        // `openId` stores the Supabase user id — kept as-is rather than
        // renamed, since it's already the join key for stripeCustomers,
        // subscriptions, vaultBlobs, etc.
        await db.upsertUser({
          openId: identity.id,
          email: identity.email,
          loginMethod: identity.provider,
          lastSignedIn: new Date(),
        });
        user = (await db.getUserByOpenId(identity.id)) ?? null;
      }
    }
  } catch (error) {
    console.error("[Auth] Failed to resolve user from Supabase token:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
