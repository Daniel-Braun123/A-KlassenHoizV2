import "server-only";
import { z } from "zod";
import { requireAppAdmin, throwCompetitionError } from "./server";
import type { SeasonCompletion } from "./season-completion";

export async function getSeasonCompletion(id: string): Promise<SeasonCompletion> {
  const supabase = await requireAppAdmin();
  const { data, error } = await supabase
    .schema("api")
    .from("admin_season_completion")
    .select("*")
    .eq("id", z.uuid().parse(id))
    .single();
  throwCompetitionError(error);
  return data!;
}

export async function setSeasonCompletion(input: unknown): Promise<void> {
  const value = z
    .object({
      id: z.uuid(),
      expectedVersion: z.coerce.number().int().positive(),
      completed: z.boolean(),
    })
    .parse(input);
  const supabase = await requireAppAdmin();
  const { error } = await supabase.schema("api").rpc("transition_league_season", {
    p_id: value.id,
    p_expected_version: value.expectedVersion,
    p_status: value.completed ? "completed" : "published",
  });
  throwCompetitionError(error);
}
