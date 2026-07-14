import type { Route } from "next";

import { SessionMenu } from "@/components/auth/session-menu";
import { Link } from "@/components/ui/link";

export function AccountNavigation({ isAppAdmin }: Readonly<{ isAppAdmin: boolean }>) {
  return (
    <nav aria-label="Kontonavigation" className="account-navigation">
      <div className="account-navigation__links">
        <Link href={"/start" as Route}>Start</Link>
        {isAppAdmin ? <Link href={"/admin/competitions" as Route}>Verwaltung</Link> : null}
        <Link href={"/profile" as Route}>Profil</Link>
      </div>
      <SessionMenu />
    </nav>
  );
}
