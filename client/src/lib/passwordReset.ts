// Small pure helpers pulled out of AuthModal/ResetPassword so the
// redirect-URL construction and password validation are testable without a
// browser environment — see the same convention in signOutEverywhere.ts.

export function buildResetRedirectUrl(origin: string): string {
  return `${origin}/auth/reset`;
}

export function validateNewPassword(password: string, confirmPassword: string): string | null {
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
}
