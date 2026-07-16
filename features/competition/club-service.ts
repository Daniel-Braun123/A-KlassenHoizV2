import "server-only";

import { clubSchema, updateClubSchema } from "./schemas";
import { appAdminClientOrNull, requireAppAdmin, throwCompetitionError } from "./server";
import type { ClubCatalogRow } from "./types";

export async function listClubs(): Promise<ClubCatalogRow[]> {
  const supabase = await appAdminClientOrNull();
  if (!supabase) return [];

  const { data, error } = await supabase
    .schema("api")
    .from("club_catalog")
    .select("*")
    .order("name");

  throwCompetitionError(error);
  return data ?? [];
}

export async function createClub(input: unknown): Promise<string> {
  const value = clubSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("create_club_simple", {
    p_name: value.name,
    ...(value.logoUrl ? { p_logo_url: value.logoUrl } : {}),
  });

  throwCompetitionError(error);
  return data!;
}

export async function updateClub(input: unknown): Promise<number> {
  const value = updateClubSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("update_club_simple", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_name: value.name,
    ...(value.logoUrl ? { p_logo_url: value.logoUrl } : {}),
  });

  throwCompetitionError(error);
  return data!;
}
