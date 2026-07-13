import "server-only";
import { Buffer } from "node:buffer";
import { ApplicationError } from "@/lib/actions/errors";
import { readServerEnvironment } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { invitationTokenSchema, joinRoundSchema, rotateInvitationSchema } from "./schemas";
import type { InvitationPreview } from "./types";

function bytea(bytes: Uint8Array) {
  return `\\x${Buffer.from(bytes).toString("hex")}`;
}
async function tokenHash(token: string) {
  const raw = Buffer.from(invitationTokenSchema.parse(token), "base64url");
  return bytea(new Uint8Array(await crypto.subtle.digest("SHA-256", raw)));
}
function map(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === "42501") throw new ApplicationError("FORBIDDEN", error.message);
  if (error.code === "P0002") throw new ApplicationError("NOT_FOUND", error.message);
  if (error.code === "23505") throw new ApplicationError("CONFLICT", error.message);
  if (error.code === "22023") throw new ApplicationError("INVALID_INPUT", error.message);
  throw new ApplicationError("UNAVAILABLE", "Invitation operation failed", { cause: error });
}
export async function rotateInvitation(input: unknown) {
  const value = rotateInvitationSchema.parse(input);
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const token = Buffer.from(raw).toString("base64url");
  const hash = bytea(new Uint8Array(await crypto.subtle.digest("SHA-256", raw)));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .rpc("rotate_round_invitation", { p_round_id: value.roundId, p_token_hash: hash });
  map(error);
  const row = data?.[0];
  if (!row) throw new ApplicationError("UNAVAILABLE");
  const url = new URL(`/invite/${token}`, readServerEnvironment().NEXT_PUBLIC_SITE_URL).toString();
  return { url, expiresAt: row.expires_at };
}
export async function revokeInvitation(roundId: string) {
  const value = rotateInvitationSchema.parse({ roundId });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .schema("api")
    .rpc("revoke_round_invitation", { p_round_id: value.roundId });
  map(error);
}
export async function getInvitationPreview(token: string): Promise<InvitationPreview> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .rpc("get_invitation_preview", { p_token_hash: await tokenHash(token) });
  map(error);
  const row = data?.[0];
  if (!row) throw new ApplicationError("NOT_FOUND");
  return {
    roundName: row.round_name,
    leagueName: row.league_name,
    seasonLabel: row.season_label,
    expiresAt: row.expires_at,
  };
}
export async function joinRound(input: unknown): Promise<string> {
  const value = joinRoundSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("api").rpc("join_round", {
    p_token_hash: await tokenHash(value.token),
    p_nickname: value.nickname,
    p_idempotency_key: value.idempotencyKey,
  });
  map(error);
  return data!;
}
