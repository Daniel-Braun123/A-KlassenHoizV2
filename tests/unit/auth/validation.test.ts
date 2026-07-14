import { describe, expect, it } from "vitest";

import { completePasswordResetSchema, registerSchema, signInSchema } from "@/features/auth/schemas";
import { normalizeAuthRedirect } from "@/features/auth/redirects";

describe("auth validation", () => {
  it("normalizes registration data without weakening passwords", () => {
    expect(
      registerSchema.parse({
        displayName: "  Daniel  ",
        email: " DANIEL@EXAMPLE.TEST ",
        password: "FreundeSindStark42!",
      }),
    ).toEqual({
      displayName: "Daniel",
      email: "daniel@example.test",
      password: "FreundeSindStark42!",
    });
  });

  it("rejects oversized, malformed and weak auth fields", () => {
    expect(() =>
      registerSchema.parse({ displayName: "", email: "x", password: "short" }),
    ).toThrow();
    expect(() =>
      signInSchema.parse({ email: "a@example.test", password: "x".repeat(129) }),
    ).toThrow();
  });

  it("requires matching replacement passwords", () => {
    expect(() =>
      completePasswordResetSchema.parse({
        password: "FreundeSindStark42!",
        passwordConfirmation: "NichtDasselbe42!",
      }),
    ).toThrow();
  });

  it("allows only local application redirect paths", () => {
    expect(normalizeAuthRedirect("/invite/abc?from=login")).toBe("/invite/abc?from=login");
    expect(normalizeAuthRedirect("https://evil.example/phish")).toBe("/start");
    expect(normalizeAuthRedirect("//evil.example/phish")).toBe("/start");
    expect(normalizeAuthRedirect(null)).toBe("/start");
  });
});
