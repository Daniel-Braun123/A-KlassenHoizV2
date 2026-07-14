import type { Route } from "next";

import { SessionMenu } from "@/components/auth/session-menu";
import { Link } from "@/components/ui/link";

export function AccountNavigation() {
  return (
    <nav aria-label="Kontonavigation" className="account-navigation">
      <div className="account-navigation__links">
        <Link href={"/start" as Route}>Start</Link>
        <Link href={"/profile" as Route}>Profil</Link>
      </div>
      <SessionMenu />
    </nav>
  );
}
