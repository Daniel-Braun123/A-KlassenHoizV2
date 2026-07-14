import type { Route } from "next";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import type { MyRound } from "@/features/rounds/types";
export function RoundSwitcher({ rounds }: { rounds: MyRound[] }) {
  return (
    <section className="round-list" aria-labelledby="round-list-title">
      <div className="round-list__header">
        <h2 id="round-list-title">Deine Tipprunden</h2>
        <Link href={"/rounds/new" as Route} variant="button">
          <Icon className="icon" name="plus" />
          Neue Tipprunde
        </Link>
      </div>
      {rounds.length ? (
        <ul>
          {rounds.map((x) => (
            <li key={x.id!}>
              <Link href={`/rounds/${x.id}` as Route}>
                <span className="round-list__copy">
                  <strong>{x.name}</strong>
                  <span>
                    {x.league_name} · {x.season_label} ·{" "}
                    {x.role === "owner" ? "Besitzer" : "Mitglied"}
                  </span>
                </span>
                <Icon className="round-list__chevron" name="chevron-right" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="round-list__empty">
          <strong>Noch keine Tipprunde</strong>
          <p>Erstelle deine erste Runde oder öffne den Einladungslink eines Freundes.</p>
        </div>
      )}
    </section>
  );
}
