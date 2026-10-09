"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { MatchdaySelect } from "@/components/ui/matchday-select";
import { compareMatchdays } from "@/features/competition/matchday-period";

export type RankingScopeOption = Readonly<{
  id: string;
  label: string;
  number: number;
  phase: "first_leg" | "second_leg";
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
      <MatchdaySelect
        busy={pending}
        disabled={pending}
        label="Rangliste"
        onSelect={(value) => {
          const href =
            value === "overall"
              ? `/rounds/${roundId}/rankings`
              : `/rounds/${roundId}/rankings?matchday=${encodeURIComponent(value)}`;
          startTransition(() => router.push(href as Route));
        }}
        options={[{ id: "overall", label: "Gesamt" }, ...options.toSorted(compareMatchdays)]}
        selectedId={selected}
      />
    </div>
  );
}
