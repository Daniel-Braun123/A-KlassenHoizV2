"use client";

import type { Route } from "next";
import { usePathname } from "next/navigation";

import { Link } from "@/components/ui/link";
import { NavigationPendingIndicator } from "@/components/ui/navigation-pending-indicator";

const items = [
  ["", "Übersicht"],
  ["/schedule", "Spielplan"],
  ["/results", "Ergebnisse"],
] as const;

export function LeagueAdminNavigation({ leagueId }: Readonly<{ leagueId: string }>) {
  const pathname = usePathname();
  const basePath = `/admin/competitions/${leagueId}`;

  return (
    <nav aria-label="Ligaverwaltung" className="league-admin-navigation">
      <ul>
        {items.map(([suffix, label]) => {
          const href = `${basePath}${suffix}`;
          const active = suffix ? pathname.startsWith(href) : pathname === basePath;
          return (
            <li key={suffix || "overview"}>
              <Link aria-current={active ? "page" : undefined} href={href as Route}>
                {label}
                <NavigationPendingIndicator />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
