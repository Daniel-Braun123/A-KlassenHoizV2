import type { Route } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) redirect("/login" as Route);
  return children;
}
