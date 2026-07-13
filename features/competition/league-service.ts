import "server-only";

import {
  leagueSchema,
  leagueSeasonSchema,
  leagueSeasonTransitionSchema,
  seasonSchema,
  updateLeagueSchema,
  updateSeasonSchema,
} from "./schemas";
import { appAdminClientOrNull, requireAppAdmin, throwCompetitionError } from "./server";
import type { CompetitionCatalogRow, LeagueCatalogRow, SeasonCatalogRow } from "./types";

export async function listCompetitionCatalog(): Promise<CompetitionCatalogRow[]> {
  const supabase = await appAdminClientOrNull();
  if (!supabase) return [];
  const { data, error } = await supabase
    .schema("api")
    .from("competition_catalog")
    .select("*")
    .order("season_label", { ascending: false });
  throwCompetitionError(error);
  return data ?? [];
}
export async function listLeagues(): Promise<LeagueCatalogRow[]> {
  const supabase = await appAdminClientOrNull();
  if (!supabase) return [];
  const { data, error } = await supabase
    .schema("api")
    .from("league_catalog")
    .select("*")
    .order("name");
  throwCompetitionError(error);
  return data ?? [];
}
export async function listSeasons(): Promise<SeasonCatalogRow[]> {
  const supabase = await appAdminClientOrNull();
  if (!supabase) return [];
  const { data, error } = await supabase
    .schema("api")
    .from("season_catalog")
    .select("*")
    .order("starts_on", { ascending: false });
  throwCompetitionError(error);
  return data ?? [];
}
export async function createLeague(input: unknown): Promise<string> {
  const value = leagueSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("create_league", {
    p_name: value.name,
    ...(value.shortName ? { p_short_name: value.shortName } : {}),
  });
  throwCompetitionError(error);
  return data!;
}
export async function createSeason(input: unknown): Promise<string> {
  const value = seasonSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("create_season", {
    p_label: value.label,
    p_starts_on: value.startsOn,
    p_ends_on: value.endsOn,
  });
  throwCompetitionError(error);
  return data!;
}
export async function createLeagueSeason(input: unknown): Promise<string> {
  const value = leagueSeasonSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase
    .schema("api")
    .rpc("create_league_season", { p_league_id: value.leagueId, p_season_id: value.seasonId });
  throwCompetitionError(error);
  return data!;
}
export async function updateLeague(input: unknown): Promise<number> {
  const value = updateLeagueSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("update_league", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_name: value.name,
    p_short_name: value.shortName ?? "",
    p_status: value.status,
  });
  throwCompetitionError(error);
  return data!;
}
export async function updateSeason(input: unknown): Promise<number> {
  const value = updateSeasonSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("update_season", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_label: value.label,
    p_starts_on: value.startsOn,
    p_ends_on: value.endsOn,
    p_status: value.status,
  });
  throwCompetitionError(error);
  return data!;
}
export async function transitionLeagueSeason(input: unknown): Promise<number> {
  const value = leagueSeasonTransitionSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("transition_league_season", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_status: value.status,
  });
  throwCompetitionError(error);
  return data!;
}
