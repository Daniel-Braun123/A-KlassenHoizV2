import "server-only";
import { z } from "zod";
import { ApplicationError } from "@/lib/actions/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const orderSchema = z
  .array(z.uuid())
  .min(1)
  .max(500)
  .refine((ids) => new Set(ids).size === ids.length);

export async function getRoundOrder(): Promise<unknown> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new ApplicationError("UNAVAILABLE", "Could not read round order");
  return data.user?.user_metadata.round_order ?? [];
}

export async function saveRoundOrder(input: unknown): Promise<void> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) throw new ApplicationError("INVALID_INPUT");
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new ApplicationError("UNAUTHENTICATED");

  const { data: rounds, error } = await supabase.schema("api").from("my_rounds").select("id");
  if (error) throw new ApplicationError("UNAVAILABLE", "Could not validate round order");
  const available = new Set((rounds ?? []).map((round) => round.id));
  if (parsed.data.some((id) => !available.has(id))) throw new ApplicationError("CONFLICT");

  // Auth merges these fields with existing metadata. Never store roles or permissions here.
  const { error: saveError } = await supabase.auth.updateUser({
    data: { round_order: parsed.data },
  });
  if (saveError) throw new ApplicationError("UNAVAILABLE", "Could not save round order");
}
