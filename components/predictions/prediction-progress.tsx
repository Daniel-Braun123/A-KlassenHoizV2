import { Button } from "@/components/ui/button";
import type { AutosaveState } from "@/features/predictions/autosave-state";

const labels = {
  incomplete: "Tipp unvollständig",
  saving: "Wird gespeichert …",
  saved: "Gespeichert",
  error: "Noch nicht gespeichert",
  locked: "Tipp geschlossen",
} as const;

export function PredictionProgress({
  state,
  onRetry,
}: {
  state: AutosaveState;
  onRetry: () => void;
}) {
  return (
    <div
      className={`prediction-save prediction-save--${state.status}`}
      role="status"
      aria-live="polite"
    >
      <span>{labels[state.status]}</span>
      {state.message ? <span>{state.message}</span> : null}
      {state.status === "error" ? (
        <Button variant="secondary" onClick={onRetry}>
          Erneut versuchen
        </Button>
      ) : null}
    </div>
  );
}
