import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

// Pins the wiring of the password-reset flow: AuthModal's "Forgot password?"
// link requests the email via AuthContext.resetPassword (Supabase
// resetPasswordForEmail), and the /auth/reset page it links to reads the
// resulting session and submits the new password via AuthContext.updatePassword
// (Supabase updateUser). See client/src/lib/passwordReset.ts for the
// unit-tested pure helpers (redirect URL + password validation) this wiring
// depends on.

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(import.meta.dirname, "..", relativePath), "utf-8");
}

describe("AuthContext exposes reset/update methods backed by Supabase", () => {
  const source = readSource("client/src/contexts/AuthContext.tsx");

  it("resetPassword calls supabase.auth.resetPasswordForEmail with a /auth/reset redirect", () => {
    expect(source).toContain("supabase.auth.resetPasswordForEmail(email");
    expect(source).toContain("redirectTo: buildResetRedirectUrl(window.location.origin)");
  });

  it("updatePassword calls supabase.auth.updateUser with the new password", () => {
    expect(source).toContain("supabase.auth.updateUser({ password })");
  });

  it("both methods null-check supabase before calling it, like the rest of the context", () => {
    const resetStart = source.indexOf("const resetPassword = useCallback");
    const updateStart = source.indexOf("const updatePassword = useCallback");
    expect(resetStart, "expected to find resetPassword").toBeGreaterThan(-1);
    expect(updateStart, "expected to find updatePassword").toBeGreaterThan(-1);

    const resetBody = source.slice(resetStart, updateStart);
    expect(resetBody).toContain("if (!supabase) return");

    const nextFn = source.indexOf("const openAuthModal", updateStart);
    const updateBody = source.slice(updateStart, nextFn === -1 ? undefined : nextFn);
    expect(updateBody).toContain("if (!supabase) return");
  });
});

describe("AuthModal offers a Forgot password link that calls resetPassword", () => {
  const source = readSource("client/src/components/AuthModal.tsx");

  it("only shows the link while signing in, not while signing up", () => {
    expect(source).toContain("Forgot password?");
    expect(source).toContain('mode === "signIn" && (');
  });

  it("the forgot-password submit handler calls resetPassword, not signIn/signUp", () => {
    const handlerStart = source.indexOf("const handleForgotPasswordSubmit");
    const nextConst = source.indexOf("const handleBackToCredentials", handlerStart);
    expect(handlerStart, "expected to find handleForgotPasswordSubmit").toBeGreaterThan(-1);
    const handlerBody = source.slice(handlerStart, nextConst === -1 ? undefined : nextConst);

    expect(handlerBody).toContain("await resetPassword(email)");
  });

  it("shows a generic notice on success rather than confirming whether the email exists", () => {
    expect(source).toContain("If an account exists for that email");
  });
});

describe("ResetPassword page submits the new password via updatePassword", () => {
  const source = readSource("client/src/pages/ResetPassword.tsx");

  it("validates the password pair with the shared helper before calling Supabase", () => {
    expect(source).toContain("validateNewPassword(password, confirmPassword)");
  });

  it("submits via AuthContext.updatePassword, not a direct supabase call", () => {
    expect(source).toContain("await updatePassword(password)");
    expect(source).not.toContain("supabase.auth.updateUser");
  });

  it("gates the form on having a session, and shows an invalid-link state otherwise", () => {
    expect(source).toMatch(/if\s*\(!session\)/);
    expect(source).toContain("invalid or has expired");
  });
});

describe("/auth/reset is routed to the ResetPassword page", () => {
  it("main.tsx renders ResetPassword when the pathname is /auth/reset", () => {
    const source = readSource("client/src/main.tsx");
    expect(source).toContain('window.location.pathname === "/auth/reset"');
    expect(source).toContain("<ResetPassword />");
  });
});
