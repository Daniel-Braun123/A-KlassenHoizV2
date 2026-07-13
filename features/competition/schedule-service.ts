import "server-only";

import { matchdaySchema, matchSchema, updateMatchdaySchema, updateMatchSchema } from "./schemas";
import { appAdminClientOrNull, requireAppAdmin, throwCompetitionError } from "./server";
import type { ScheduleRow } from "./types";

export async function listSchedule(): Promise<ScheduleRow[]> {
  const supabase = await appAdminClientOrNull();
  if (!supabase) return [];
  const { data, error } = await supabase
    .schema("api")
    .from("schedule")
    .select("*")
    .order("kickoff_at");
  throwCompetitionError(error);
  return data ?? [];
}
export async function createMatchday(input: unknown): Promise<string> {
  const value = matchdaySchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("create_matchday", {
    p_league_season_id: value.leagueSeasonId,
    p_number: value.number,
    ...(value.displayName ? { p_display_name: value.displayName } : {}),
  });
  throwCompetitionError(error);
  return data!;
}
export async function createMatch(input: unknown): Promise<string> {
  const value = matchSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("create_match", {
    p_matchday_id: value.matchdayId,
    p_home_club_id: value.homeClubId,
    p_away_club_id: value.awayClubId,
    p_kickoff_at: value.kickoffAt,
  });
  throwCompetitionError(error);
  return data!;
}
export async function updateMatchday(input: unknown): Promise<number> {
  const value = updateMatchdaySchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("update_matchday", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_number: value.number,
    p_display_name: value.displayName ?? "",
    p_status: value.status,
  });
  throwCompetitionError(error);
  return data!;
}
export async function updateMatch(input: unknown): Promise<number> {
  const value = updateMatchSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("update_match", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_matchday_id: value.matchdayId,
    p_home_club_id: value.homeClubId,
    p_away_club_id: value.awayClubId,
    p_kickoff_at: value.kickoffAt,
    p_status: value.status,
  });
  throwCompetitionError(error);
  return data!;
}
