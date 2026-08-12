export function normalizeAuthRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/start";
  }

  try {
    const parsed = new URL(value, "https://a-klassenhoiz.invalid");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/start";
  }
}

export function buildAuthCallbackUrl(siteUrl: string, next: string): string {
  const callback = new URL("/auth/callback", siteUrl);
  callback.searchParams.set("next", normalizeAuthRedirect(next));
  return callback.toString();
}

export function buildOAuthCallbackUrl(
  siteUrl: string,
  next: string,
  entryPoint: OAuthEntryPoint,
): string {
  const callback = new URL(buildAuthCallbackUrl(siteUrl, next));
  callback.searchParams.set("source", entryPoint);
  return callback.toString();
}
import type { OAuthEntryPoint } from "@/features/auth/types";
