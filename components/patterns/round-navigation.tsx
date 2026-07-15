"use client";

import type { Route } from "next";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";

export function RoundNavigation({ roundId }: { roundId: string }) {
  const pathname = usePathname();
  const base = `/rounds/${roundId}`;
  const items: ReadonlyArray<{ href: Route; label: string; icon: IconName }> = [
    { href: base as Route, label: "Übersicht", icon: "overview" },
    { href: `${base}/predictions` as Route, label: "Tippen", icon: "predictions" },
    { href: `${base}/rankings` as Route, label: "Rangliste", icon: "rankings" },
    { href: `${base}/results` as Route, label: "Ergebnisse", icon: "results" },
  ];
  return (
    <nav className="round-navigation" aria-label="Tipprunde">
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              aria-current={
                item.href === base
                  ? pathname === base
                    ? "page"
                    : undefined
                  : pathname.startsWith(item.href)
                    ? "page"
                    : undefined
              }
              href={item.href}
            >
              <Icon className="round-navigation__icon" name={item.icon} />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
