import "server-only";

import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchdayRankingRow, OverallRankingRow } from "./types";

function map(error: { code?: string; message?: string } | null) {
  if (error)
    throw new ApplicationError(error.code === "42501" ? "FORBIDDEN" : "UNAVAILABLE", error.message);
}
export async function listOverallRanking(roundId: string): Promise<OverallRankingRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .from("overall_ranking")
    .select("*")
    .eq("round_id", roundId)
    .order("rank")
    .order("nickname");
  map(error);
  return data ?? [];
}
export async function listMatchdayRanking(roundId: string): Promise<MatchdayRankingRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .from("matchday_ranking")
    .select("*")
    .eq("round_id", roundId)
    .order("matchday_number")
    .order("rank")
    .order("nickname");
  map(error);
  return data ?? [];
}
