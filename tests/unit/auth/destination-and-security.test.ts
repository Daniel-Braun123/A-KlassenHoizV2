import { describe, expect, it } from "vitest";

import { resolvePostLoginDestination } from "@/features/auth/post-login-destination";
import { mapAuthError } from "@/features/auth/security";

describe("auth destination and neutral security mapping", () => {
  it("prioritizes invitation, then onboarding, one round and last active round", () => {
    expect(resolvePostLoginDestination([], "/invite/token")).toBe("/invite/token");
    expect(resolvePostLoginDestination([])).toBe("/start");
    expect(resolvePostLoginDestination([{ id: "one", wasLastActive: false }])).toBe("/rounds/one");
    expect(
      resolvePostLoginDestination([
        { id: "one", wasLastActive: false },
        { id: "two", wasLastActive: true },
      ]),
    ).toBe("/rounds/two");
  });

  it("maps only rate-limit state specially and exposes no provider detail", () => {
    expect(mapAuthError({ status: 429 })?.code).toBe("RATE_LIMITED");
    expect(mapAuthError({ status: 400, code: "user_already_exists" })?.code).toBe("UNAVAILABLE");
    expect(mapAuthError(null)).toBeNull();
  });
});
