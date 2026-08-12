import { describe, expect, it } from "vitest";

import { completePasswordResetSchema, registerSchema, signInSchema } from "@/features/auth/schemas";
import {
  buildAuthCallbackUrl,
  buildOAuthCallbackUrl,
  normalizeAuthRedirect,
} from "@/features/auth/redirects";

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

  it("builds a same-site auth callback with a normalized internal destination", () => {
    expect(buildAuthCallbackUrl("https://a-klassenhoiz.de", "/invite/abc?from=register")).toBe(
      "https://a-klassenhoiz.de/auth/callback?next=%2Finvite%2Fabc%3Ffrom%3Dregister",
    );
    expect(buildAuthCallbackUrl("https://a-klassenhoiz.de", "https://evil.example/phish")).toBe(
      "https://a-klassenhoiz.de/auth/callback?next=%2Fstart",
    );
  });

  it("preserves the OAuth entry point without accepting an external destination", () => {
    expect(buildOAuthCallbackUrl("https://a-klassenhoiz.de", "/invite/abc", "register")).toBe(
      "https://a-klassenhoiz.de/auth/callback?next=%2Finvite%2Fabc&source=register",
    );
    expect(buildOAuthCallbackUrl("https://a-klassenhoiz.de", "https://evil.example", "login")).toBe(
      "https://a-klassenhoiz.de/auth/callback?next=%2Fstart&source=login",
    );
  });
});
