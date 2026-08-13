import "server-only";

import { ApplicationError } from "@/lib/actions/errors";

type AuthLikeError = Readonly<{
  status?: number | undefined;
  code?: string | undefined;
}>;

const existingRegistrationCodes = new Set(["email_exists", "user_already_exists"]);

/**
 * Supabase may either return an obfuscated success or one of these conflict codes for an
 * existing identity, depending on the Auth deployment and confirmation settings. Callers must
 * handle both paths identically so the registration endpoint cannot be used for user discovery.
 */
export function isExistingRegistration(error: AuthLikeError | null): boolean {
  return Boolean(error?.code && existingRegistrationCodes.has(error.code));
}

export function mapAuthError(error: AuthLikeError | null): ApplicationError | null {
  if (!error) return null;
  if (error.status === 429 || error.code === "over_request_rate_limit") {
    return new ApplicationError("RATE_LIMITED", "Supabase Auth rate limit reached");
  }
  return new ApplicationError("UNAVAILABLE", "Supabase Auth request failed");
}
