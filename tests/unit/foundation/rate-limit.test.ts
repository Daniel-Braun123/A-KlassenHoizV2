import { describe, expect, it, vi } from "vitest";

import { enforceRateLimit, type RateLimitStore } from "@/lib/security/rate-limit";

describe("rate-limit contract", () => {
  it("passes only normalized one-way keys and the scoped policy", async () => {
    const consume = vi.fn<RateLimitStore["consume"]>().mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 0,
    });
    const store: RateLimitStore = { consume };

    await enforceRateLimit(store, "auth", "A".repeat(64));

    expect(consume).toHaveBeenCalledWith("auth", "a".repeat(64), {
      limit: 10,
      windowSeconds: 300,
    });
  });

  it("rejects raw identifiers", async () => {
    const store: RateLimitStore = {
      consume: vi.fn<RateLimitStore["consume"]>(),
    };

    await expect(enforceRateLimit(store, "invitation", "friend@example.test")).rejects.toThrow(
      "SHA-256",
    );
  });
});
