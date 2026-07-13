import "server-only";
import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hardDeleteRoundSchema,
  membershipMutationSchema,
  roundLifecycleSchema,
  transferOwnershipSchema,
  updateNicknameSchema,
} from "./management-schemas";

function map(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === "42501") throw new ApplicationError("FORBIDDEN", error.message);
  if (error.code === "P0001" || error.code === "23505")
    throw new ApplicationError("CONFLICT", error.message);
  if (error.code === "22023") throw new ApplicationError("INVALID_INPUT", error.message);
  throw new ApplicationError("UNAVAILABLE", "Round management failed", { cause: error });
}
export async function updateMyRoundNickname(input: unknown) {
  const value = updateNicknameSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .schema("api")
    .rpc("update_my_round_nickname", { p_round_id: value.roundId, p_nickname: value.nickname });
  map(error);
}
export async function transferRoundOwnership(input: unknown) {
  const value = transferOwnershipSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("api").rpc("transfer_round_ownership", {
    p_round_id: value.roundId,
    p_target_membership_id: value.targetMembershipId,
    p_expected_version: value.expectedVersion,
  });
  map(error);
  return data!;
}
export async function removeRoundMember(input: unknown) {
  const value = membershipMutationSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .schema("api")
    .rpc("remove_round_member", { p_round_id: value.roundId, p_membership_id: value.membershipId });
  map(error);
}
export async function leaveRound(roundId: string) {
  const value = roundLifecycleSchema.pick({ roundId: true }).parse({ roundId });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("api").rpc("leave_round", { p_round_id: value.roundId });
  map(error);
}
export async function setRoundArchived(input: unknown, archived: boolean) {
  const value = roundLifecycleSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = archived
    ? await supabase.schema("api").rpc("archive_round", {
        p_round_id: value.roundId,
        p_expected_version: value.expectedVersion,
      })
    : await supabase.schema("api").rpc("reactivate_round", {
        p_round_id: value.roundId,
        p_expected_version: value.expectedVersion,
      });
  map(error);
  return data!;
}
export async function hardDeleteRound(input: unknown) {
  const value = hardDeleteRoundSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("api").rpc("hard_delete_round", {
    p_round_id: value.roundId,
    p_expected_version: value.expectedVersion,
    p_confirmation_name: value.confirmationName,
  });
  map(error);
}
