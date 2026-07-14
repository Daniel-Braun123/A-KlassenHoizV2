import type { Route } from "next";
import { redirect } from "next/navigation";

import { Link } from "@/components/ui/link";
import { InstallApp } from "@/components/patterns/install-app";
import { getMyProfile } from "@/features/profile/service";

export default async function ProfilePage() {
  const profile = await getMyProfile();
  if (!profile || profile.status !== "active") redirect("/login?next=/profile" as Route);

  return (
    <section className="content-page profile-page" aria-labelledby="profile-title">
      <div className="content-page__intro">
        <p className="product-mark">Dein Konto</p>
        <h1 id="profile-title">{profile.display_name ?? "Dein Profil"}</h1>
        <p>Installiere die App auf deinem Gerät oder verwalte deine privaten Kontodaten.</p>
      </div>
      <div className="profile-page__sections">
        <InstallApp />
        <section className="account-panel">
          <div>
            <h2>Konto & Datenschutz</h2>
            <p>Hier findest du die unwiderrufliche Kontolöschung und ihre Voraussetzungen.</p>
          </div>
          <Link href={"/profile/delete-account" as Route}>Kontoeinstellungen öffnen</Link>
        </section>
      </div>
    </section>
  );
}
