import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApplicationError } from "@/lib/actions/errors";
import { listOverallRanking } from "@/features/rankings/service";
import { buildSeasonReview, type SeasonReview } from "./season-review";

export async function getSeasonReview(roundId: string): Promise<SeasonReview | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .from("round_season_state")
    .select("status")
    .eq("round_id", roundId)
    .maybeSingle();
  if (error) throw new ApplicationError("UNAVAILABLE");
  if (data?.status !== "completed" && data?.status !== "archived") return null;
  return buildSeasonReview(await listOverallRanking(roundId));
}
