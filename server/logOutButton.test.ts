import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

// A "Log Out" button already existed on the Settings page, but it only
// called supabase.auth.signOut() — the local vault (decrypted health data
// held in memory) was left unlocked. This pins that:
//   1. the Sidebar (shared between the desktop nav and the mobile drawer —
//      see AppShell in App.tsx) has its own always-visible "Log Out" button
//   2. both surfaces route through the shared signOutEverywhere() helper,
//      not a bare supabase.auth.signOut() call

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(import.meta.dirname, "..", relativePath), "utf-8");
}

describe("Log Out is reachable from every authenticated page", () => {
  it("the Sidebar component renders a Log Out button wired to signOutEverywhere", () => {
    const source = readSource("client/src/App.tsx");
    const sidebarStart = source.indexOf("function Sidebar(");
    expect(sidebarStart, "expected to find the Sidebar component").toBeGreaterThan(-1);
    // Sidebar is the next top-level function after this one in the file,
    // so slice up to the next "function " at column 0 to scope the check.
    const nextFn = source.indexOf("\nfunction ", sidebarStart + 1);
    const sidebarSource = source.slice(sidebarStart, nextFn === -1 ? undefined : nextFn);

    expect(sidebarSource).toContain("signOutEverywhere");
    expect(sidebarSource).toContain("Log Out");
    expect(sidebarSource).toContain("<LogOut");
  });

  it("Sidebar is rendered both in the desktop aside and the mobile drawer", () => {
    const source = readSource("client/src/App.tsx");
    expect(source.match(/<Sidebar\b/g)?.length).toBe(2);
  });

  it("the Settings page's Log Out row uses signOutEverywhere, not a bare supabase signOut", () => {
    const source = readSource("client/src/pages/Settings.tsx");
    expect(source).toContain("signOutEverywhere({ supabaseSignOut: signOut, lockVault })");
    expect(source).not.toMatch(/handleSignOut = async \(\) => \{\s*await signOut\(\);/);
  });
});
