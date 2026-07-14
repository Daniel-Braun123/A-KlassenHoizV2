"use client";

import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Link } from "@/components/ui/link";

const items = [
  ["/admin/competitions", "Ligen & Saisons"],
  ["/admin/clubs", "Vereine"],
  ["/admin/schedule", "Spielplan"],
  ["/admin/results", "Ergebnisse"],
  ["/admin/support", "Support"],
] as const;

export function AdminNavigation() {
  const pathname = usePathname();
  const activeItem = useRef<HTMLLIElement>(null);

  useEffect(() => {
    activeItem.current?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav aria-label="Globale Verwaltung" className="admin-navigation">
      <ul>
        {items.map(([href, label]) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} ref={active ? activeItem : undefined}>
              <Link aria-current={active ? "page" : undefined} href={href as Route}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
