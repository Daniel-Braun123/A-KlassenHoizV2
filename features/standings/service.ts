import "server-only";

import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateLeagueTable } from "./calculate";
import type { LeagueTableClub, LeagueTableRow } from "./types";

function mapReadError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  throw new ApplicationError(error.code === "42501" ? "FORBIDDEN" : "UNAVAILABLE", error.message);
}

export async function listLeagueTable(
  roundId: string,
  leagueSeasonId: string,
): Promise<LeagueTableRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: league, error: leagueError } = await supabase
    .schema("api")
    .from("admin_leagues")
    .select("club_ids,club_names")
    .eq("id", leagueSeasonId)
    .maybeSingle();

  mapReadError(leagueError);
  if (!league) throw new ApplicationError("NOT_FOUND");

  const clubIds = league.club_ids ?? [];
  const clubNames = league.club_names ?? [];
  const [clubResponse, resultResponse] = await Promise.all([
    clubIds.length
      ? supabase.schema("api").from("club_catalog").select("id,name,logo_url").in("id", clubIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .schema("api")
      .from("round_results")
      .select("home_club_name,away_club_name,home_goals,away_goals,decision")
      .eq("round_id", roundId)
      .eq("decision", "official"),
  ]);

  mapReadError(clubResponse.error);
  mapReadError(resultResponse.error);

  const catalogById = new Map((clubResponse.data ?? []).map((club) => [club.id, club]));
  const clubs: LeagueTableClub[] = clubIds.flatMap((clubId, index) => {
    const catalogClub = catalogById.get(clubId);
    const name = catalogClub?.name ?? clubNames[index];
    return name ? [{ id: clubId, name, logoUrl: catalogClub?.logo_url ?? null }] : [];
  });

  return calculateLeagueTable(clubs, resultResponse.data ?? []);
}
