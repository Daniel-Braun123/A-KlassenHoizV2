import "server-only";

import { ApplicationError } from "@/lib/actions/errors";
import { clubWithMediaSchema, updateClubWithMediaSchema } from "./schemas";
import { requireAppAdmin, throwCompetitionError } from "./server";

const MAX_LOGO_BYTES = 2_097_152;
const extensionFor = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

type SupportedLogoMimeType = keyof typeof extensionFor;

function logoFile(entry: FormDataEntryValue | null): File | null {
  return entry instanceof File && entry.size > 0 ? entry : null;
}

function isSupportedMimeType(value: string): value is SupportedLogoMimeType {
  return Object.hasOwn(extensionFor, value);
}

async function validateLogoFile(file: File): Promise<SupportedLogoMimeType> {
  if (!isSupportedMimeType(file.type) || file.size > MAX_LOGO_BYTES) {
    throw new ApplicationError("INVALID_INPUT", "Unsupported club logo file");
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";

  if (
    (file.type === "image/png" && !isPng) ||
    (file.type === "image/jpeg" && !isJpeg) ||
    (file.type === "image/webp" && !isWebp)
  ) {
    throw new ApplicationError("INVALID_INPUT", "Club logo content does not match MIME type");
  }

  return file.type;
}

async function uploadLogo(
  supabase: Awaited<ReturnType<typeof requireAppAdmin>>,
  clubId: string,
  version: number,
  file: File,
): Promise<string> {
  const mimeType = await validateLogoFile(file);
  const path = `clubs/${clubId}/v${version}.${extensionFor[mimeType]}`;
  const { error } = await supabase.storage.from("club-logos").upload(path, file, {
    cacheControl: "31536000",
    contentType: mimeType,
    upsert: false,
  });
  throwCompetitionError(error);
  return path;
}

async function removeLogo(
  supabase: Awaited<ReturnType<typeof requireAppAdmin>>,
  path: string | null,
): Promise<void> {
  if (path) await supabase.storage.from("club-logos").remove([path]);
}

export async function createClubWithMedia(
  input: unknown,
  logoEntry: FormDataEntryValue | null,
): Promise<string> {
  const value = clubWithMediaSchema.parse(input);
  const file = value.logoMode === "upload" ? logoFile(logoEntry) : null;
  const supabase = await requireAppAdmin();
  const clubId = crypto.randomUUID();
  let uploadedPath: string | null = null;

  if (file) uploadedPath = await uploadLogo(supabase, clubId, 1, file);

  const { data, error } = await supabase.schema("api").rpc("create_club_with_media", {
    p_id: clubId,
    p_name: value.name,
    ...(value.logoMode === "url" && value.logoUrl ? { p_logo_url: value.logoUrl } : {}),
    ...(uploadedPath ? { p_logo_path: uploadedPath } : {}),
  });

  if (error) await removeLogo(supabase, uploadedPath);
  throwCompetitionError(error);
  return data!;
}

export async function updateClubWithMedia(
  input: unknown,
  logoEntry: FormDataEntryValue | null,
): Promise<number> {
  const value = updateClubWithMediaSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data: current, error: readError } = await supabase
    .schema("api")
    .from("club_catalog")
    .select("id,logo_path,logo_url,version")
    .eq("id", value.id)
    .maybeSingle();
  throwCompetitionError(readError);
  if (!current) throw new ApplicationError("NOT_FOUND");
  if (current.version !== value.expectedVersion) throw new ApplicationError("CONFLICT");

  const file = value.logoMode === "upload" ? logoFile(logoEntry) : null;
  let nextPath = current.logo_path;
  let nextUrl = current.logo_url;
  let uploadedPath: string | null = null;

  if (value.logoMode === "none") {
    nextPath = null;
    nextUrl = null;
  } else if (value.logoMode === "url") {
    nextPath = null;
    nextUrl = value.logoUrl ?? null;
  } else if (file) {
    uploadedPath = await uploadLogo(supabase, value.id, value.expectedVersion + 1, file);
    nextPath = uploadedPath;
    nextUrl = null;
  }

  const { data, error } = await supabase.schema("api").rpc("update_club_with_media", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_name: value.name,
    ...(nextUrl ? { p_logo_url: nextUrl } : {}),
    ...(nextPath ? { p_logo_path: nextPath } : {}),
  });

  if (error) await removeLogo(supabase, uploadedPath);
  throwCompetitionError(error);

  if (current.logo_path && current.logo_path !== nextPath) {
    await removeLogo(supabase, current.logo_path);
  }

  return data!;
}
