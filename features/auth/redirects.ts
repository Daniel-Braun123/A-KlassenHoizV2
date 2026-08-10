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
