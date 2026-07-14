import "server-only";

import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MyProfile = Database["api"]["Views"]["my_profile"]["Row"];

export async function getMyProfile(): Promise<MyProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) return null;

  const { data, error } = await supabase.schema("api").from("my_profile").select("*").single();
  if (error) throw error;
  return data;
}
