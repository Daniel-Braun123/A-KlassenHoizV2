import "server-only";

import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RoundResult } from "./types";

export async function listRoundResults(roundId: string): Promise<RoundResult[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .from("round_results")
    .select("*")
    .eq("round_id", roundId)
    .order("matchday_number")
    .order("kickoff_at");
  if (error)
    throw new ApplicationError(error.code === "42501" ? "FORBIDDEN" : "UNAVAILABLE", error.message);
  return data ?? [];
}
