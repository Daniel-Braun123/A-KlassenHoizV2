import "server-only";

import { clubAssignmentSchema, clubSchema, updateClubSchema } from "./schemas";
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
  const { data, error } = await supabase
    .schema("api")
    .rpc("create_club", { p_name: value.name, p_short_name: value.shortName });
  throwCompetitionError(error);
  return data!;
}
export async function assignClub(input: unknown): Promise<void> {
  const value = clubAssignmentSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { error } = await supabase.schema("api").rpc("assign_club", {
    p_league_season_id: value.leagueSeasonId,
    p_club_id: value.clubId,
    p_status: "active",
  });
  throwCompetitionError(error);
}
export async function updateClub(input: unknown): Promise<number> {
  const value = updateClubSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("update_club", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_name: value.name,
    p_short_name: value.shortName,
    p_status: value.status,
  });
  throwCompetitionError(error);
  return data!;
}
