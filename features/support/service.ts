import "server-only";
import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supportGrantIdSchema, supportGrantSchema } from "./schemas";
export type SupportMetadata = Readonly<{
  object_id: string;
  round_status: string;
  league_season_id: string;
  created_at: string;
  member_count: number;
  active_member_count: number;
  active_invitation: boolean;
  has_prediction_activity: boolean;
  expires_at: string;
}>;
function map(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === "42501") throw new ApplicationError("FORBIDDEN", error.message);
  if (error.code === "22023") throw new ApplicationError("INVALID_INPUT", error.message);
  if (error.code === "P0002") throw new ApplicationError("NOT_FOUND", error.message);
  throw new ApplicationError("UNAVAILABLE", "Support operation failed", { cause: error });
}
export async function createAndReadSupportMetadata(
  input: unknown,
): Promise<{ grantId: string; metadata: SupportMetadata }> {
  const value = supportGrantSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const grant = await supabase.schema("api").rpc("create_support_access", {
    p_round_id: value.roundId,
    p_case_reference: value.caseReference,
    p_reason: value.reason,
    p_duration_minutes: value.durationMinutes,
  });
  map(grant.error);
  const row = grant.data?.[0];
  if (!row) throw new ApplicationError("UNAVAILABLE");
  const read = await supabase
    .schema("api")
    .rpc("get_support_metadata", { p_grant_id: row.grant_id });
  map(read.error);
  const metadata = read.data?.[0];
  if (!metadata) throw new ApplicationError("NOT_FOUND");
  return { grantId: row.grant_id, metadata: metadata as SupportMetadata };
}
export async function revokeSupportMetadata(grantId: string): Promise<void> {
  const id = supportGrantIdSchema.parse(grantId);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("api").rpc("revoke_support_access", { p_grant_id: id });
  map(error);
}
