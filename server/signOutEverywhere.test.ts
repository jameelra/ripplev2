import { describe, expect, it, vi } from "vitest";
import { signOutEverywhere } from "../client/src/lib/signOutEverywhere";

// "Log Out" spans two independent systems (the optional Supabase account and
// the local encrypted vault, unlocked into plain JS memory) — see the
// comment in client/src/lib/signOutEverywhere.ts. These tests pin the
// orchestration order and, critically, that the local vault always gets
// cleared even if the Supabase call fails, since leaving decrypted health
// data in memory because a network request failed would be worse than a
// stale server-side session.

describe("signOutEverywhere", () => {
  it("signs out of Supabase, locks the vault, then navigates, in that order", async () => {
    const calls: string[] = [];
    const supabaseSignOut = vi.fn(async () => {
      calls.push("supabaseSignOut");
    });
    const lockVault = vi.fn(() => {
      calls.push("lockVault");
    });
    const navigate = vi.fn(() => {
      calls.push("navigate");
    });

    await signOutEverywhere({ supabaseSignOut, lockVault, navigate });

    expect(calls).toEqual(["supabaseSignOut", "lockVault", "navigate"]);
  });

  it("still locks the vault and navigates even if the Supabase call rejects", async () => {
    const supabaseSignOut = vi.fn(async () => {
      throw new Error("network error");
    });
    const lockVault = vi.fn();
    const navigate = vi.fn();

    await expect(signOutEverywhere({ supabaseSignOut, lockVault, navigate })).resolves.toBeUndefined();

    expect(lockVault).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledOnce();
  });

  it("never touches the vault or navigates before Supabase sign-out settles", async () => {
    let supabaseSignOutResolved = false;
    const supabaseSignOut = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      supabaseSignOutResolved = true;
    });
    const lockVault = vi.fn(() => {
      expect(supabaseSignOutResolved).toBe(true);
    });
    const navigate = vi.fn();

    await signOutEverywhere({ supabaseSignOut, lockVault, navigate });

    expect(lockVault).toHaveBeenCalledOnce();
  });
});
