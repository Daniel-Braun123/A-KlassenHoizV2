import "server-only";

import { logoSchema } from "./schemas";
import { requireAppAdmin, throwCompetitionError } from "./server";

const extensionFor = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;

export async function uploadClubLogo(formData: FormData): Promise<string> {
  const file = formData.get("logo");
  if (!(file instanceof File)) throw new Error("Logo file missing");
  const value = logoSchema.parse({
    clubId: String(formData.get("clubId") ?? ""),
    expectedVersion: formData.get("expectedVersion"),
    version: formData.get("version"),
    mimeType: file.type,
    size: file.size,
  });
  const supabase = await requireAppAdmin();
  const path = `clubs/${value.clubId}/v${value.version}.${extensionFor[value.mimeType]}`;
  const { error: uploadError } = await supabase.storage
    .from("club-logos")
    .upload(path, file, { contentType: value.mimeType, upsert: false });
  throwCompetitionError(uploadError);
  const { error } = await supabase.schema("api").rpc("set_club_logo_path", {
    p_id: value.clubId,
    p_expected_version: value.expectedVersion,
    p_logo_path: path,
  });
  if (error) await supabase.storage.from("club-logos").remove([path]);
  throwCompetitionError(error);
  return path;
}
