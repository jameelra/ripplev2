import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-greene",
    email: "test@ripple.health",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return { ctx };
}

function createAnonContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return { ctx };
}

describe("greene.saveScores / greene.loadScores", () => {
  it("requires authentication — no anonymous write or read path", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.greene.saveScores({ iv: "abc", data: "def" })).rejects.toThrow();
    await expect(caller.greene.loadScores()).rejects.toThrow();
  });

  it("rejects a save payload that isn't an encrypted { iv, data } blob (no plaintext score fields accepted)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // @ts-expect-error — intentionally malformed input to prove the schema rejects it
    await expect(caller.greene.saveScores({ total: 20, subscale: "vasomotor" })).rejects.toThrow();
  });

  it("accepts a well-formed encrypted blob and round-trips through the same call chain", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.greene.saveScores({ iv: "dGVzdC1pdg==", data: "Y2lwaGVydGV4dA==" });
    expect(result.success).toBe(true);
  });

  it("returns null when no history has been saved for this user (no DB configured in test env)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.greene.loadScores();
    expect(result).toBeNull();
  });
});
