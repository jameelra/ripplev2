import { describe, expect, it } from "vitest";
import { buildResetRedirectUrl, validateNewPassword } from "../client/src/lib/passwordReset";

describe("buildResetRedirectUrl", () => {
  it("points at /auth/reset under the given origin", () => {
    expect(buildResetRedirectUrl("https://ripplehealth.app")).toBe(
      "https://ripplehealth.app/auth/reset"
    );
  });

  it("works for local/dev origins too", () => {
    expect(buildResetRedirectUrl("http://localhost:5173")).toBe("http://localhost:5173/auth/reset");
  });
});

describe("validateNewPassword", () => {
  it("rejects passwords shorter than 6 characters", () => {
    expect(validateNewPassword("abc12", "abc12")).toBe("Password must be at least 6 characters.");
  });

  it("rejects a confirmation that doesn't match, even if both are individually valid", () => {
    expect(validateNewPassword("abcdef", "abcdeg")).toBe("Passwords do not match.");
  });

  it("checks length before match, so a short mismatched pair gets the length error", () => {
    expect(validateNewPassword("abc", "xyz")).toBe("Password must be at least 6 characters.");
  });

  it("accepts a valid, matching password pair", () => {
    expect(validateNewPassword("abcdef", "abcdef")).toBeNull();
  });
});
