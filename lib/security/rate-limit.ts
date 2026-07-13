export type RateLimitScope = "auth" | "invitation" | "prediction_autosave" | "support";

export type RateLimitPolicy = Readonly<{
  limit: number;
  windowSeconds: number;
}>;

export type RateLimitDecision = Readonly<{
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}>;

export interface RateLimitStore {
  consume(
    scope: RateLimitScope,
    keyHash: string,
    policy: RateLimitPolicy,
  ): Promise<RateLimitDecision>;
}

export const rateLimitPolicies: Readonly<Record<RateLimitScope, RateLimitPolicy>> = {
  auth: { limit: 10, windowSeconds: 300 },
  invitation: { limit: 30, windowSeconds: 300 },
  prediction_autosave: { limit: 120, windowSeconds: 60 },
  support: { limit: 20, windowSeconds: 900 },
};

export async function enforceRateLimit(
  store: RateLimitStore,
  scope: RateLimitScope,
  keyHash: string,
): Promise<RateLimitDecision> {
  if (!/^[a-f0-9]{64}$/i.test(keyHash)) {
    throw new TypeError("Rate-limit keys must be one-way SHA-256 hashes.");
  }

  return store.consume(scope, keyHash.toLowerCase(), rateLimitPolicies[scope]);
}
