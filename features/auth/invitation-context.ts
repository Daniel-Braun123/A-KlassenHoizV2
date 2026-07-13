import { normalizeAuthRedirect } from "@/features/auth/schemas";

export function invitationContextFromNext(next: string | null | undefined): string | null {
  const normalized = normalizeAuthRedirect(next);
  return normalized.startsWith("/invite/") ? normalized : null;
}

export function authHrefWithContext(base: "/login" | "/register", next?: string): string {
  const invitation = invitationContextFromNext(next);
  return invitation ? `${base}?next=${encodeURIComponent(invitation)}` : base;
}
