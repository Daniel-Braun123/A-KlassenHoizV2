import "server-only";

import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublishedLeagueSeason } from "./types";

export async function listPublishedLeagueSeasons(): Promise<PublishedLeagueSeason[]> {
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) throw new ApplicationError("UNAUTHENTICATED");
  const { data, error } = await supabase
    .schema("api")
    .from("published_league_seasons")
    .select("*")
    .order("season_label", { ascending: false });
  if (error)
    throw new ApplicationError("UNAVAILABLE", "Published competitions could not be read", {
      cause: error,
    });
  return data ?? [];
}
