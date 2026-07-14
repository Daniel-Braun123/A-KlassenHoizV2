import "server-only";

import { ApplicationError } from "@/lib/actions/errors";

type AuthLikeError = Readonly<{
  status?: number | undefined;
  code?: string | undefined;
}>;

export function mapAuthError(error: AuthLikeError | null): ApplicationError | null {
  if (!error) return null;
  if (error.status === 429 || error.code === "over_request_rate_limit") {
    return new ApplicationError("RATE_LIMITED", "Supabase Auth rate limit reached");
  }
  return new ApplicationError("UNAVAILABLE", "Supabase Auth request failed");
}
