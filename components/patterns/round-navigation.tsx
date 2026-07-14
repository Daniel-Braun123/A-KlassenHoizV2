import type { Route } from "next";
import { Link } from "@/components/ui/link";
export function RoundNavigation({ roundId }: { roundId: string }) {
  const items = [
    { href: `/rounds/${roundId}` as Route, label: "Übersicht" },
    { href: `/rounds/${roundId}/predictions` as Route, label: "Tippen" },
    { href: `/rounds/${roundId}/rankings` as Route, label: "Rangliste" },
    { href: `/rounds/${roundId}/results` as Route, label: "Ergebnisse" },
  ];
  return (
    <nav className="round-navigation" aria-label="Tipprunde">
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
