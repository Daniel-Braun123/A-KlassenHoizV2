"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

import { PredictionList, type PredictionDraft } from "@/components/predictions/prediction-list";
import type { MatchdayOption } from "@/components/predictions/matchday-selector";
import { ActionMessage, type ActionFeedbackState } from "@/components/ui/action-message";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { savePredictionsBatchAction } from "@/features/predictions/actions";
import type { PredictionSheetRow, VisiblePrediction } from "@/features/predictions/types";

type PendingNavigation =
  Readonly<{ kind: "href"; href: string }> | Readonly<{ kind: "matchday"; id: string }>;

const idleState: ActionFeedbackState = { status: "idle" };

function draftsFromMatches(matches: PredictionSheetRow[]): Record<string, PredictionDraft> {
  return Object.fromEntries(
    matches.flatMap((match) =>
      match.match_id
        ? [
            [
              match.match_id,
              {
                homeGoals:
                  match.predicted_home_goals === null ? "" : String(match.predicted_home_goals),
                awayGoals:
                  match.predicted_away_goals === null ? "" : String(match.predicted_away_goals),
              },
            ] as const,
          ]
        : [],
    ),
  );
}

function draftsDiffer(current: PredictionDraft, saved: PredictionDraft): boolean {
  return current.homeGoals !== saved.homeGoals || current.awayGoals !== saved.awayGoals;
}

function isComplete(draft: PredictionDraft): boolean {
  return [draft.homeGoals, draft.awayGoals].every((value) => {
    if (!/^\d{1,2}$/.test(value)) return false;
    const goals = Number(value);
    return Number.isInteger(goals) && goals >= 0 && goals <= 99;
  });
}

export function PredictionWorkspace({
  matches,
  options,
  roundId,
  selectedId,
  visible,
}: Readonly<{
  matches: PredictionSheetRow[];
  options: MatchdayOption[];
  roundId: string;
  selectedId: string;
  visible: VisiblePrediction[];
}>) {
  const router = useRouter();
  const bypassNavigationGuard = useRef(false);
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState(() => draftsFromMatches(matches));
  const [savedDrafts, setSavedDrafts] = useState(() => draftsFromMatches(matches));
  const [state, setState] = useState<ActionFeedbackState>(idleState);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

  const changedMatches = matches.filter((match) => {
    if (!match.match_id) return false;
    const current = drafts[match.match_id];
    const saved = savedDrafts[match.match_id];
    return Boolean(current && saved && draftsDiffer(current, saved));
  });
  const hasUnsavedChanges = changedMatches.length > 0;

  useEffect(() => {
    if (!hasUnsavedChanges || pending) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (bypassNavigationGuard.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        bypassNavigationGuard.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.href === window.location.href) return;

      event.preventDefault();
      setPendingNavigation({ kind: "href", href: destination.href });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [hasUnsavedChanges, pending]);

  useEffect(() => {
    const refreshSettledResults = () => {
      if (document.visibilityState === "visible" && !hasUnsavedChanges && !pending) {
        router.refresh();
      }
    };

    window.addEventListener("focus", refreshSettledResults);
    document.addEventListener("visibilitychange", refreshSettledResults);
    return () => {
      window.removeEventListener("focus", refreshSettledResults);
      document.removeEventListener("visibilitychange", refreshSettledResults);
    };
  }, [hasUnsavedChanges, pending, router]);

  function updateDraft(matchId: string, change: Partial<PredictionDraft>): void {
    setDrafts((current) => ({
      ...current,
      [matchId]: { ...(current[matchId] ?? { homeGoals: "", awayGoals: "" }), ...change },
    }));
    setState(idleState);
  }

  function performNavigation(navigation: PendingNavigation): void {
    if (navigation.kind === "matchday") {
      router.push(
        `/rounds/${roundId}/predictions?matchday=${encodeURIComponent(navigation.id)}` as Route,
      );
      return;
    }

    const destination = new URL(navigation.href, window.location.href);
    if (destination.origin === window.location.origin) {
      router.push(`${destination.pathname}${destination.search}${destination.hash}` as Route);
    } else {
      window.location.assign(destination.href);
    }
  }

  function requestNavigation(navigation: PendingNavigation): void {
    if (hasUnsavedChanges) {
      setPendingNavigation(navigation);
      return;
    }
    performNavigation(navigation);
  }

  function discardAndContinue(): void {
    const navigation = pendingNavigation;
    if (!navigation) return;
    bypassNavigationGuard.current = true;
    setDrafts(savedDrafts);
    setPendingNavigation(null);
    performNavigation(navigation);
    window.setTimeout(() => {
      bypassNavigationGuard.current = false;
    }, 0);
  }

  function savePredictions(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setState(idleState);

    const incompleteCount = changedMatches.filter((match) => {
      const draft = match.match_id ? drafts[match.match_id] : undefined;
      return !draft || !isComplete(draft);
    }).length;
    if (incompleteCount > 0) {
      setState({
        status: "error",
        message:
          incompleteCount === 1
            ? "Bitte vervollständige den geänderten Tipp."
            : "Bitte vervollständige alle geänderten Tipps.",
      });
      return;
    }

    const predictions = changedMatches.flatMap((match) => {
      if (!match.match_id) return [];
      const draft = drafts[match.match_id];
      if (!draft) return [];
      return [
        {
          matchId: match.match_id,
          homeGoals: Number(draft.homeGoals),
          awayGoals: Number(draft.awayGoals),
          idempotencyKey: crypto.randomUUID(),
        },
      ];
    });
    if (predictions.length === 0) return;

    startTransition(async () => {
      let result;
      try {
        result = await savePredictionsBatchAction({ roundId, predictions });
      } catch {
        setState({
          status: "error",
          message: "Das hat gerade nicht funktioniert. Bitte probiere es erneut.",
        });
        return;
      }
      if (!result.ok) {
        setState({ status: "error", message: result.error.message });
        return;
      }

      setSavedDrafts(drafts);
      setState({
        status: "success",
        message:
          result.data.savedCount === 1
            ? "Der Tipp wurde gespeichert."
            : `${result.data.savedCount} Tipps wurden gespeichert.`,
      });
      const selectedRoute =
        `/rounds/${roundId}/predictions?matchday=${encodeURIComponent(selectedId)}` as Route;
      const currentMatchday = new URLSearchParams(window.location.search).get("matchday");
      if (currentMatchday === selectedId) {
        router.refresh();
      } else {
        router.replace(selectedRoute);
      }
    });
  }

  return (
    <div className="prediction-workspace">
      <Select
        className="matchday-selector__select"
        label="Spieltag"
        onChange={(event) => requestNavigation({ kind: "matchday", id: event.currentTarget.value })}
        value={selectedId}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.incomplete ? " · offen" : ""}
          </option>
        ))}
      </Select>

      <form className="prediction-form" onSubmit={savePredictions}>
        <PredictionList
          drafts={drafts}
          matches={matches}
          onDraftChange={updateDraft}
          pending={pending}
          visible={visible}
        />
        <footer className="prediction-save-bar">
          <p className="prediction-save-bar__summary">
            {hasUnsavedChanges
              ? `${changedMatches.length} ${changedMatches.length === 1 ? "Änderung" : "Änderungen"} noch nicht gespeichert`
              : "Alle eingegebenen Tipps sind gespeichert"}
          </p>
          <Button disabled={!hasUnsavedChanges || pending} fullWidth type="submit">
            {pending ? "Tipps werden gespeichert …" : "Tipps speichern"}
          </Button>
          <ActionMessage state={state} />
        </footer>
      </form>

      <Dialog
        description="Wenn du jetzt wechselst, gehen deine noch nicht gespeicherten Tipps verloren."
        onClose={() => setPendingNavigation(null)}
        open={pendingNavigation !== null}
        title="Ungespeicherte Tipps"
      >
        <div className="dialog-actions">
          <Button onClick={() => setPendingNavigation(null)} variant="secondary">
            Weiter tippen
          </Button>
          <Button onClick={discardAndContinue} variant="danger">
            Änderungen verwerfen
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
