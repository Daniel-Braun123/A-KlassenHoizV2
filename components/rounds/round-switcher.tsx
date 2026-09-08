import type { Route } from "next";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { SortableRoundList } from "@/components/rounds/sortable-round-list";
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
        <SortableRoundList rounds={rounds} />
      ) : (
        <div className="round-list__empty">
          <strong>Noch keine Tipprunde</strong>
          <p>Erstelle deine erste Runde oder öffne den Einladungslink eines Freundes.</p>
        </div>
      )}
    </section>
  );
}
