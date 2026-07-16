import "server-only";

import { cache } from "react";
import { z } from "zod";

import { adminLeagueSchema, publishAdminLeagueSchema, updateAdminLeagueSchema } from "./schemas";
import { appAdminClientOrNull, requireAppAdmin, throwCompetitionError } from "./server";
import type { AdminLeagueRow, CompetitionCatalogRow } from "./types";

export async function listAdminLeagues(): Promise<AdminLeagueRow[]> {
  const supabase = await appAdminClientOrNull();
  if (!supabase) return [];

  const { data, error } = await supabase
    .schema("api")
    .from("admin_leagues")
    .select("*")
    .order("year_label", { ascending: false })
    .order("name");

  throwCompetitionError(error);
  return data ?? [];
}

export const getAdminLeague = cache(async function getAdminLeague(
  id: string,
): Promise<AdminLeagueRow | null> {
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return null;
  const supabase = await appAdminClientOrNull();
  if (!supabase) return null;

  const { data, error } = await supabase
    .schema("api")
    .from("admin_leagues")
    .select("*")
    .eq("id", parsedId.data)
    .maybeSingle();

  throwCompetitionError(error);
  return data;
});

// Kept as a compatibility boundary while schedule and prediction-round reads
// move to the simplified admin_leagues view.
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

export async function createAdminLeague(input: unknown): Promise<string> {
  const value = adminLeagueSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("create_admin_league", {
    p_name: value.name,
    p_year_label: value.yearLabel,
    p_club_ids: value.clubIds,
  });

  throwCompetitionError(error);
  return data!;
}

export async function updateAdminLeague(input: unknown): Promise<number> {
  const value = updateAdminLeagueSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("update_admin_league", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_name: value.name,
    p_year_label: value.yearLabel,
    p_club_ids: value.clubIds,
    ...(value.reason ? { p_reason: value.reason } : {}),
  });

  throwCompetitionError(error);
  return data!;
}

export async function publishAdminLeague(input: unknown): Promise<number> {
  const value = publishAdminLeagueSchema.parse(input);
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase.schema("api").rpc("publish_admin_league", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
  });

  throwCompetitionError(error);
  return data!;
}
