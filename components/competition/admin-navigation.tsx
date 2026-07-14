import type { Route } from "next";
import { Link } from "@/components/ui/link";

const items = [
  ["/admin/competitions", "Ligen & Saisons"],
  ["/admin/clubs", "Vereine"],
  ["/admin/schedule", "Spielplan"],
  ["/admin/results", "Ergebnisse"],
  ["/admin/support", "Support"],
] as const;

export function AdminNavigation() {
  return (
    <nav aria-label="Globale Verwaltung" className="admin-navigation">
      <ul>
        {items.map(([href, label]) => (
          <li key={href}>
            <Link href={href as Route}>{label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
