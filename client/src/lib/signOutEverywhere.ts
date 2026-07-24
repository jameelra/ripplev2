// "Log Out" spans two independent systems: the optional Supabase account
// (cloud sign-in, used for AI features/billing) and the local vault (the
// encrypted-at-rest health data, unlocked into memory as plain JS state).
// Signing out of Supabase alone — the old behavior — left a vault-unlocked
// user's decrypted data sitting in memory and on screen. This orchestrates
// both, plus a hard navigation, so nothing sensitive survives: the redirect
// forces a full reload, which discards the entire JS heap (in-memory vault
// state, the React Query cache, any other module-level state) rather than
// relying on component state merely being cleared.
//
// Takes its dependencies as arguments rather than importing the real
// supabase client or the vaultStore singleton, so it's a small pure function
// testable without a browser environment — see naming convention in
// client/src/lib/analytics.ts for the same pattern.

export interface SignOutDeps {
  supabaseSignOut: () => Promise<void>;
  lockVault: () => void;
  navigate?: () => void;
}

const defaultNavigate = () => {
  window.location.href = "/";
};

export async function signOutEverywhere({ supabaseSignOut, lockVault, navigate }: SignOutDeps): Promise<void> {
  try {
    await supabaseSignOut();
  } catch {
    // A failed network call to Supabase must not block clearing the local,
    // decrypted vault state — leaving it on screen because the sign-out
    // request couldn't reach the server is worse than a stale server-side
    // session that expires or gets revoked on its own.
  }
  lockVault();
  (navigate ?? defaultNavigate)();
}
