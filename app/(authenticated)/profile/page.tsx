import type { Route } from "next";
import { redirect } from "next/navigation";

import { Link } from "@/components/ui/link";
import { InstallApp } from "@/components/patterns/install-app";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login?next=/profile" as Route);

  const { data: profile } = await supabase.schema("api").from("my_profile").select("*").single();
  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <p className="product-mark">Profil</p>
      <h1 id="profile-title">{profile?.display_name ?? "Dein Profil"}</h1>
      <p>Hier verwaltest du später Anzeigename, Konto und Datenschutz.</p>
      <Link href={"/profile/delete-account" as Route}>Konto und Datenschutz</Link>
      <InstallApp />
    </section>
  );
}
