const CLUB_LOGO_BUCKET_PATH = "/storage/v1/object/public/club-logos/";

function encodedStoragePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function clubLogoUrl(
  logoPath: string | null | undefined,
  logoUrl: string | null | undefined,
): string | null {
  const path = logoPath?.trim();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (path && base) return `${base}${CLUB_LOGO_BUCKET_PATH}${encodedStoragePath(path)}`;
  return logoUrl?.trim() || null;
}
