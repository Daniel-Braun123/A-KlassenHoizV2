import "server-only";
import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createRoundSchema, roundIdSchema, updateRoundSchema } from "./schemas";
import type { MyRound, RoundMember } from "./types";

function map(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === "42501") throw new ApplicationError("FORBIDDEN", error.message);
  if (error.code === "P0001" || error.code === "23505")
    throw new ApplicationError("CONFLICT", error.message);
  if (error.code === "22023" || error.code === "23514")
    throw new ApplicationError("INVALID_INPUT", error.message);
  throw new ApplicationError("UNAVAILABLE", "Round operation failed", { cause: error });
}
export async function listMyRounds(): Promise<MyRound[]> {
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) return [];
  const { data, error } = await supabase
    .schema("api")
    .from("my_rounds")
    .select("*")
    .order("created_at", { ascending: false });
  map(error);
  return data ?? [];
}
export async function getMyRound(id: string): Promise<MyRound> {
  const roundId = roundIdSchema.parse(id);
  const rounds = await listMyRounds();
  const round = rounds.find((x) => x.id === roundId);
  if (!round) throw new ApplicationError("NOT_FOUND");
  return round;
}
export async function listRoundMembers(id: string): Promise<RoundMember[]> {
  const roundId = roundIdSchema.parse(id);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .from("round_members")
    .select("*")
    .eq("round_id", roundId)
    .order("joined_at");
  map(error);
  return data ?? [];
}
export async function createRound(input: unknown): Promise<string> {
  const value = createRoundSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("api").rpc("create_round", {
    p_name: value.name,
    p_league_season_id: value.leagueSeasonId,
    p_nickname: value.nickname,
    p_idempotency_key: value.idempotencyKey,
  });
  map(error);
  return data!;
}
export async function updateRound(input: unknown): Promise<number> {
  const value = updateRoundSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("api").rpc("update_round", {
    p_round_id: value.roundId,
    p_expected_version: value.expectedVersion,
    p_name: value.name,
    p_league_season_id: value.leagueSeasonId,
  });
  map(error);
  return data!;
}
