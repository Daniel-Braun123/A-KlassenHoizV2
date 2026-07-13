import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
export type SupportAuditRow = Database["api"]["Views"]["my_support_audit"]["Row"];
export async function listMySupportAudit(): Promise<SupportAuditRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("api")
    .from("my_support_audit")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(20);
  if (error) return [];
  return data ?? [];
}
