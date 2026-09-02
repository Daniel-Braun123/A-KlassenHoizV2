import "server-only";

import { matchdaySchema, matchSchema, updateMatchdaySchema, updateMatchSchema } from "./schemas";
import {
  createMatchdayAutoSchema,
  createSimpleMatchSchema,
  deleteScheduleItemSchema,
  moveMatchdayPhaseSchema,
  updateMatchdayPeriodSchema,
  updateSimpleMatchSchema,
} from "./schedule-schemas";
import { appAdminClientOrNull, requireAppAdmin, throwCompetitionError } from "./server";
import type { ScheduleRow } from "./types";
import type { Database } from "@/lib/supabase/database.types";
import { clubLogoUrl } from "./club-logo-url";

type RawAdminLeagueRow = Database["api"]["Views"]["admin_leagues"]["Row"];
type RawAdminScheduleRow = Database["api"]["Views"]["admin_schedule"]["Row"];

export type AdminLeagueRow = Omit<
  RawAdminLeagueRow,
  "club_ids" | "club_names" | "id" | "name" | "status" | "version" | "year_label"
> & {
  club_ids: string[];
  club_names: string[];
  id: string;
  name: string;
  status: NonNullable<RawAdminLeagueRow["status"]>;
  version: number;
  year_label: string;
};

export type AdminScheduleRow = Omit<
  RawAdminScheduleRow,
  | "display_name"
  | "league_id"
  | "league_name"
  | "matchday_id"
  | "matchday_number"
  | "matchday_status"
  | "matchday_version"
  | "phase"
  | "starts_on"
  | "ends_on"
  | "year_label"
> & {
  display_name: string;
  league_id: string;
  league_name: string;
  matchday_id: string;
  matchday_number: number;
  matchday_status: NonNullable<RawAdminScheduleRow["matchday_status"]>;
  matchday_version: number;
  phase: NonNullable<RawAdminScheduleRow["phase"]>;
  starts_on: string;
  ends_on: string;
  year_label: string;
};

export async function listAdminLeagues(): Promise<AdminLeagueRow[]> {
  const supabase = await appAdminClientOrNull();
  if (!supabase) return [];
  const { data, error } = await supabase
    .schema("api")
    .from("admin_leagues")
    .select("*")
    .order("name")
    .order("year_label", { ascending: false });
  throwCompetitionError(error);
  return (data ?? [])
    .filter(
      (
        row,
      ): row is RawAdminLeagueRow & {
        id: string;
        name: string;
        status: NonNullable<RawAdminLeagueRow["status"]>;
        version: number;
        year_label: string;
      } => Boolean(row.id && row.name && row.status && row.version !== null && row.year_label),
    )
    .map((row) => ({
      ...row,
      club_ids: row.club_ids ?? [],
      club_names: row.club_names ?? [],
    }));
}

export async function listAdminSchedule(leagueId: string): Promise<AdminScheduleRow[]> {
  const supabase = await appAdminClientOrNull();
  if (!supabase) return [];
  const { data, error } = await supabase
    .schema("api")
    .from("admin_schedule")
    .select("*")
    .eq("league_id", leagueId)
    .order("matchday_number")
    .order("kickoff_at");
  throwCompetitionError(error);
  const rows = (data ?? [])
    .filter(
      (
        row,
      ): row is RawAdminScheduleRow & {
        league_id: string;
        league_name: string;
        matchday_id: string;
        matchday_number: number;
        matchday_status: NonNullable<RawAdminScheduleRow["matchday_status"]>;
        matchday_version: number;
        phase: NonNullable<RawAdminScheduleRow["phase"]>;
        starts_on: string;
        ends_on: string;
        year_label: string;
      } =>
        Boolean(
          row.league_id &&
          row.league_name &&
          row.matchday_id &&
          row.matchday_number !== null &&
          row.matchday_status &&
          row.matchday_version !== null &&
          row.phase &&
          row.starts_on &&
          row.ends_on &&
          row.year_label,
        ),
    )
    .map((row) => ({
      ...row,
      display_name:
        row.display_name ??
        `${row.phase === "first_leg" ? "Hinrunde" : "Rückrunde"} · Spieltag ${row.matchday_number}`,
    }));

  const clubIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.home_club_id, row.away_club_id])
        .filter((id): id is string => Boolean(id)),
    ),
  );
  if (!clubIds.length) return rows;

  const { data: clubs, error: clubError } = await supabase
    .schema("api")
    .from("club_catalog")
    .select("id,logo_path,logo_url")
    .in("id", clubIds);
  throwCompetitionError(clubError);
  const logosByClubId = new Map(
    (clubs ?? []).flatMap((club) =>
      club.id ? [[club.id, clubLogoUrl(club.logo_path, club.logo_url)] as const] : [],
    ),
  );

  return rows.map((row) => ({
    ...row,
    away_club_logo_url:
      (row.away_club_id ? logosByClubId.get(row.away_club_id) : null) ?? row.away_club_logo_url,
    home_club_logo_url:
      (row.home_club_id ? logosByClubId.get(row.home_club_id) : null) ?? row.home_club_logo_url,
  }));
}

export async function createMatchdayAuto(input: unknown): Promise<string> {
  const value = createMatchdayAutoSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("create_matchday_auto", {
    p_league_id: value.leagueId,
    p_phase: value.phase,
    p_starts_on: value.startsOn,
    p_ends_on: value.endsOn,
  });
  throwCompetitionError(error);
  return data!;
}

export async function updateMatchdayPeriod(input: unknown): Promise<number> {
  const value = updateMatchdayPeriodSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("update_matchday_period", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_starts_on: value.startsOn,
    p_ends_on: value.endsOn,
  });
  throwCompetitionError(error);
  return data!;
}

export async function moveMatchdayPhase(input: unknown): Promise<number> {
  const value = moveMatchdayPhaseSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("move_matchday_phase", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_phase: value.phase,
  });
  throwCompetitionError(error);
  return data!;
}

export async function deleteMatchdaySimple(input: unknown): Promise<void> {
  const value = deleteScheduleItemSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { error } = await supabase.schema("api").rpc("delete_matchday_simple", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
  });
  throwCompetitionError(error);
}

export async function createMatchSimple(input: unknown): Promise<string> {
  const value = createSimpleMatchSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("create_match_simple", {
    p_matchday_id: value.matchdayId,
    p_home_club_id: value.homeClubId,
    p_away_club_id: value.awayClubId,
    p_kickoff_at: value.kickoffAt,
  });
  throwCompetitionError(error);
  return data!;
}

export async function updateMatchSimple(input: unknown): Promise<number> {
  const value = updateSimpleMatchSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("update_match_simple", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_home_club_id: value.homeClubId,
    p_away_club_id: value.awayClubId,
    p_kickoff_at: value.kickoffAt,
    p_status: value.status,
  });
  throwCompetitionError(error);
  return data!;
}

export async function deleteMatchSimple(input: unknown): Promise<void> {
  const value = deleteScheduleItemSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { error } = await supabase.schema("api").rpc("delete_match_simple", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
  });
  throwCompetitionError(error);
}

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
