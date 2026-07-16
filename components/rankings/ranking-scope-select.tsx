"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Select } from "@/components/ui/select";

export type RankingScopeOption = Readonly<{
  id: string;
  label: string;
}>;

export function RankingScopeSelect({
  options,
  roundId,
  selected,
}: Readonly<{
  options: RankingScopeOption[];
  roundId: string;
  selected: "overall" | string;
}>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="ranking-toolbar">
      <Select
        aria-busy={pending}
        className="ranking-toolbar__select"
        disabled={pending}
        label="Rangliste"
        onChange={(event) => {
          const value = event.currentTarget.value;
          const href =
            value === "overall"
              ? `/rounds/${roundId}/rankings`
              : `/rounds/${roundId}/rankings?matchday=${encodeURIComponent(value)}`;
          startTransition(() => router.push(href as Route));
        }}
        value={selected}
      >
        <option value="overall">Gesamt</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
