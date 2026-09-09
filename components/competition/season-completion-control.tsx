"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { setSeasonCompletionAction } from "@/features/competition/season-completion-actions";
import {
  seasonCompletionBlockers,
  type SeasonCompletion,
} from "@/features/competition/season-completion";
import { initialCompetitionActionState } from "@/features/competition/types";
import { ActionMessage } from "./action-message";
import "@/styles/season-completion.css";

export function SeasonCompletionControl({ season }: { season: SeasonCompletion }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (previous: typeof initialCompetitionActionState, form: FormData) => {
      const result = await setSeasonCompletionAction(previous, form);
      if (result.status === "success") setOpen(false);
      return result;
    },
    initialCompetitionActionState,
  );
  const completed = season.status === "completed";
  const blockers = seasonCompletionBlockers(season);
  return (
    <section className="season-control" aria-labelledby="season-control-title">
      <div className="season-control__heading">
        <div>
          <h3 id="season-control-title">Saisonabschluss</h3>
          <p id="season-control-hint">
            {completed
              ? "Die Saison-Auswertung ist in allen zugehörigen Tipprunden sichtbar. Für Korrekturen öffnest du die Saison wieder."
              : "Schließe die Saison ab, sobald der vollständige Spielplan ausgewertet ist."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={completed}
          aria-label="Saison abgeschlossen"
          aria-describedby="season-control-hint season-control-status"
          className="season-control__switch"
          disabled={pending || (!completed && blockers.length > 0)}
          onClick={() => setOpen(true)}
        >
          <span />
        </button>
      </div>
      <div id="season-control-status">
        {completed ? (
          <p>Saison abgeschlossen</p>
        ) : blockers.length ? (
          <ul>
            {blockers.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p>
            Alle {season.total_matches} Spiele sind ausgewertet. Die Saison kann abgeschlossen
            werden.
          </p>
        )}
      </div>
      {!open ? <ActionMessage state={state} /> : null}
      <Dialog
        open={open}
        onClose={() => {
          if (!pending) setOpen(false);
        }}
        title={completed ? "Saison wieder öffnen?" : "Saison abschließen?"}
        description={
          completed
            ? "Die normale Spieltagsübersicht wird wieder angezeigt. Alle Tipps und Ergebnisse bleiben erhalten."
            : "Bestätige, dass der vollständige Saisonspielplan hinterlegt ist. In allen zugehörigen Tipprunden erscheint anschließend die Saison-Auswertung."
        }
      >
        <form action={action} className="season-control__confirmation">
          <input type="hidden" name="id" value={season.id!} />
          <input type="hidden" name="expectedVersion" value={season.version!} />
          <input type="hidden" name="completed" value={String(!completed)} />
          <ActionMessage state={state} />
          <div className="page-actions">
            <Button variant="secondary" disabled={pending} onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Wird gespeichert …"
                : completed
                  ? "Saison wieder öffnen"
                  : "Saison abschließen"}
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
}
