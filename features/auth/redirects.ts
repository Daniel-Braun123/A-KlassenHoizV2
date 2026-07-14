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
