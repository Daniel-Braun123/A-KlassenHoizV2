import type { Route } from "next";

import { Link } from "@/components/ui/link";

export type MatchdayOption = Readonly<{
  id: string;
  number: number;
  label: string;
  incomplete: boolean;
  startsOn: string;
  endsOn: string;
}>;

export function MatchdaySelector({
  roundId,
  options,
  selectedId,
}: {
  roundId: string;
  options: MatchdayOption[];
  selectedId: string;
}) {
  return (
    <nav className="matchday-selector" aria-label="Spieltag auswählen">
      <ul>
        {options.map((option) => (
          <li key={option.id}>
            <Link
              href={`/rounds/${roundId}/predictions?matchday=${option.id}` as Route}
              aria-current={option.id === selectedId ? "page" : undefined}
            >
              {option.label}
              {option.incomplete ? <span className="matchday-selector__open">offen</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
