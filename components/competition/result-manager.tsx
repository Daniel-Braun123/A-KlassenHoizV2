"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";

import { ActionMessage } from "@/components/competition/action-message";
import { ClubLogo } from "@/components/competition/club-logo";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { setMatchResultsBatchAction } from "@/features/competition/result-actions";
import {
  berlinDateKey,
  berlinDateLabel,
  berlinTimeLabel,
} from "@/features/competition/schedule-display";
import {
  formatMatchdayOptionLabel,
  nearestMatchdayId,
} from "@/features/competition/matchday-period";
import type { AdminScheduleRow } from "@/features/competition/schedule-service";
import {
  initialCompetitionActionState,
  type CompetitionActionState,
} from "@/features/competition/types";

type MatchWithId = AdminScheduleRow & { match_id: string };

type ResultDraft = Readonly<{
  decision: "official" | "excluded";
  homeGoals: string;
  awayGoals: string;
  reason: string;
}>;

type PendingNavigation =
  | Readonly<{ kind: "href"; href: string }>
  | Readonly<{ kind: "league"; id: string }>
  | Readonly<{ kind: "matchday"; id: string }>;

type MatchDateGroup = Readonly<{
  dateKey: string;
  dateLabel: string;
  matches: MatchWithId[];
}>;

const resultDeadlineFormatter = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function draftFromMatch(match: AdminScheduleRow): ResultDraft {
  return {
    decision: match.decision ?? "official",
    homeGoals: match.home_goals === null ? "" : String(match.home_goals),
    awayGoals: match.away_goals === null ? "" : String(match.away_goals),
    reason: "",
  };
}

function draftsFromSchedule(schedule: AdminScheduleRow[]): Record<string, ResultDraft> {
  return Object.fromEntries(
    schedule.flatMap((match) =>
      match.match_id ? ([[match.match_id, draftFromMatch(match)]] as const) : [],
    ),
  );
}

export function isResultDraftComplete(draft: ResultDraft): boolean {
  if (draft.decision === "excluded") return true;
  return /^\d{1,2}$/.test(draft.homeGoals) && /^\d{1,2}$/.test(draft.awayGoals);
}

function isDirty(match: AdminScheduleRow, draft: ResultDraft): boolean {
  if (!match.decision) {
    return draft.decision === "excluded" || draft.homeGoals !== "" || draft.awayGoals !== "";
  }
  if (draft.decision !== match.decision) return true;
  if (draft.decision === "excluded") return false;
  return (
    draft.homeGoals !== String(match.home_goals ?? "") ||
    draft.awayGoals !== String(match.away_goals ?? "")
  );
}

function resultUnlocked(match: AdminScheduleRow, now: number): boolean {
  if (!match.kickoff_at) return false;
  const kickoff = new Date(match.kickoff_at).getTime();
  return Number.isFinite(kickoff) && now >= kickoff + 90 * 60 * 1000;
}

function matchdayLabel(row: AdminScheduleRow): string {
  const phase = row.phase === "second_leg" ? "Rückrunde" : "Hinrunde";
  return formatMatchdayOptionLabel(
    row.display_name || `${phase} · Spieltag ${row.matchday_number ?? "–"}`,
    row.starts_on,
    row.ends_on,
  );
}

function groupMatchesByDate(matches: MatchWithId[]): MatchDateGroup[] {
  const groups = new Map<string, MatchDateGroup>();

  for (const match of matches) {
    if (!match.kickoff_at) continue;
    const dateKey = berlinDateKey(match.kickoff_at);
    const existing = groups.get(dateKey);
    if (existing) {
      existing.matches.push(match);
    } else {
      groups.set(dateKey, {
        dateKey,
        dateLabel: berlinDateLabel(match.kickoff_at),
        matches: [match],
      });
    }
  }

  return [...groups.values()]
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey))
    .map((group) => ({
      ...group,
      matches: group.matches.toSorted((left, right) =>
        (left.kickoff_at ?? "").localeCompare(right.kickoff_at ?? ""),
      ),
    }));
}

function toPayload(match: MatchWithId, draft: ResultDraft) {
  return {
    matchId: match.match_id,
    expectedMatchVersion: match.match_version!,
    expectedRevision: match.revision_no ?? 0,
    decision: draft.decision,
    homeGoals: draft.decision === "official" ? Number(draft.homeGoals) : undefined,
    awayGoals: draft.decision === "official" ? Number(draft.awayGoals) : undefined,
    reason: draft.reason.trim() || undefined,
  };
}

function invalidState(message: string): CompetitionActionState {
  return { status: "error", code: "INVALID_INPUT", message };
}

function ResultScoreEditor({
  draft,
  disabled,
  match,
  onChange,
}: Readonly<{
  draft: ResultDraft;
  disabled: boolean;
  match: MatchWithId;
  onChange: (change: Partial<ResultDraft>) => void;
}>) {
  if (draft.decision === "excluded") {
    return <span className="result-score-excluded">Ohne Wertung</span>;
  }

  return (
    <fieldset
      aria-label={`Ergebnis ${match.home_club_name} gegen ${match.away_club_name}`}
      className="result-score-editor"
      disabled={disabled}
    >
      <input
        aria-label={`Tore ${match.home_club_name}`}
        className="result-score-editor__input"
        inputMode="numeric"
        max="99"
        min="0"
        onChange={(event) => onChange({ homeGoals: event.currentTarget.value })}
        placeholder="–"
        type="number"
        value={draft.homeGoals}
      />
      <span aria-hidden="true">:</span>
      <input
        aria-label={`Tore ${match.away_club_name}`}
        className="result-score-editor__input"
        inputMode="numeric"
        max="99"
        min="0"
        onChange={(event) => onChange({ awayGoals: event.currentTarget.value })}
        placeholder="–"
        type="number"
        value={draft.awayGoals}
      />
    </fieldset>
  );
}

function ResultMatchRow({
  draft,
  match,
  now,
  onChange,
  pending,
}: Readonly<{
  draft: ResultDraft;
  match: MatchWithId;
  now: number;
  onChange: (change: Partial<ResultDraft>) => void;
  pending: boolean;
}>) {
  const unlocked = resultUnlocked(match, now);
  const dirty = isDirty(match, draft);
  const complete = isResultDraftComplete(draft);
  const deadline = match.kickoff_at
    ? new Date(new Date(match.kickoff_at).getTime() + 90 * 60 * 1000)
    : null;
  const published = Boolean(match.decision);
  const statusTitle = dirty
    ? complete
      ? "Änderung bereit"
      : "Eingabe unvollständig"
    : published
      ? `Veröffentlicht · Revision ${match.revision_no ?? 1}`
      : unlocked
        ? "Ergebniseingabe möglich"
        : "Eingabe noch gesperrt";
  const statusDetail = unlocked
    ? match.kickoff_at
      ? `Anpfiff ${berlinTimeLabel(match.kickoff_at)}`
      : "Anpfiff fehlt"
    : deadline
      ? `Freigabe ab ${resultDeadlineFormatter.format(deadline)} Uhr`
      : "Anpfiff fehlt";

  return (
    <article
      className="result-match-item"
      data-dirty={dirty ? "true" : undefined}
      data-incomplete={dirty && !complete ? "true" : undefined}
    >
      <div className="result-match-item__scoreboard">
        <span className="match-admin-team match-admin-team--home">
          <strong>{match.home_club_name}</strong>
          <ClubLogo logoUrl={match.home_club_logo_url} name={match.home_club_name} />
        </span>
        <ResultScoreEditor
          disabled={!unlocked || pending}
          draft={draft}
          match={match}
          onChange={onChange}
        />
        <span className="match-admin-team match-admin-team--away">
          <ClubLogo logoUrl={match.away_club_logo_url} name={match.away_club_name} />
          <strong>{match.away_club_name}</strong>
        </span>
      </div>

      <div className="result-match-item__details">
        <div className="result-match-item__status">
          <strong>{statusTitle}</strong>
          <span>{statusDetail}</span>
        </div>
        <Select
          className="result-match-item__decision"
          disabled={!unlocked || pending}
          label="Wertung"
          onChange={(event) => {
            const decision = event.currentTarget.value as ResultDraft["decision"];
            onChange({
              decision,
              ...(decision === "excluded" ? { homeGoals: "", awayGoals: "" } : {}),
            });
          }}
          value={draft.decision}
        >
          <option value="official">Offizielles Ergebnis</option>
          <option value="excluded">Von der Wertung ausschließen</option>
        </Select>
        {(match.revision_no ?? 0) > 0 ? (
          <Input
            className="result-match-item__reason"
            disabled={!unlocked || pending}
            hint="Wird im Änderungsprotokoll festgehalten."
            label="Grund der Korrektur (optional)"
            maxLength={500}
            onChange={(event) => onChange({ reason: event.currentTarget.value })}
            value={draft.reason}
          />
        ) : null}
      </div>
    </article>
  );
}

export function ResultManager({ schedule }: Readonly<{ schedule: AdminScheduleRow[] }>) {
  const router = useRouter();
  const bypassNavigationGuard = useRef(false);
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const [state, setState] = useState<CompetitionActionState>(initialCompetitionActionState);
  const [drafts, setDrafts] = useState(() => draftsFromSchedule(schedule));
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

  const leagues = useMemo(() => {
    const values = new Map<string, { id: string; label: string }>();
    for (const row of schedule) {
      if (row.league_id && !values.has(row.league_id)) {
        values.set(row.league_id, {
          id: row.league_id,
          label: `${row.league_name ?? "Liga"} · ${row.year_label ?? "Jahr offen"}`,
        });
      }
    }
    return [...values.values()];
  }, [schedule]);

  const [selectedLeague, setSelectedLeague] = useState(() => leagues[0]?.id ?? "");
  const matchdays = useMemo(() => {
    const values = new Map<
      string,
      { id: string; label: string; startsOn: string; endsOn: string }
    >();
    for (const row of schedule) {
      if (row.league_id === selectedLeague && row.matchday_id && !values.has(row.matchday_id)) {
        values.set(row.matchday_id, {
          id: row.matchday_id,
          label: matchdayLabel(row),
          startsOn: row.starts_on,
          endsOn: row.ends_on,
        });
      }
    }
    return [...values.values()];
  }, [schedule, selectedLeague]);
  const [selectedMatchday, setSelectedMatchday] = useState(() => {
    const firstLeagueId = leagues[0]?.id;
    const leagueMatchdays = schedule
      .filter((row) => row.league_id === firstLeagueId)
      .flatMap((row) =>
        row.matchday_id
          ? [
              {
                id: row.matchday_id,
                startsOn: row.starts_on,
                endsOn: row.ends_on,
              },
            ]
          : [],
      );
    return nearestMatchdayId(leagueMatchdays) ?? "";
  });

  const matches = useMemo(
    () =>
      schedule.filter(
        (row): row is MatchWithId => row.matchday_id === selectedMatchday && Boolean(row.match_id),
      ),
    [schedule, selectedMatchday],
  );
  const matchGroups = useMemo(() => groupMatchesByDate(matches), [matches]);
  const changedMatches = matches.filter((match) => {
    const draft = drafts[match.match_id];
    return draft ? isDirty(match, draft) : false;
  });
  const saveableMatches = changedMatches.filter((match) => {
    const draft = drafts[match.match_id];
    return draft && resultUnlocked(match, now) && isResultDraftComplete(draft);
  });
  const incompleteCount = changedMatches.length - saveableMatches.length;
  const hasUnsavedChanges = changedMatches.length > 0;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

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

  function updateDraft(matchId: string, change: Partial<ResultDraft>): void {
    setDrafts((current) => ({
      ...current,
      [matchId]: {
        ...(current[matchId] ??
          draftFromMatch(schedule.find((match) => match.match_id === matchId)!)),
        ...change,
      },
    }));
    setState(initialCompetitionActionState);
  }

  function selectLeague(leagueId: string): void {
    setSelectedLeague(leagueId);
    const leagueMatchdays = schedule
      .filter((row) => row.league_id === leagueId)
      .flatMap((row) =>
        row.matchday_id
          ? [{ id: row.matchday_id, startsOn: row.starts_on, endsOn: row.ends_on }]
          : [],
      );
    setSelectedMatchday(nearestMatchdayId(leagueMatchdays) ?? "");
    setState(initialCompetitionActionState);
  }

  function requestNavigation(navigation: PendingNavigation): void {
    if (hasUnsavedChanges) {
      setPendingNavigation(navigation);
      return;
    }
    performNavigation(navigation);
  }

  function performNavigation(navigation: PendingNavigation): void {
    if (navigation.kind === "league") {
      selectLeague(navigation.id);
      return;
    }
    if (navigation.kind === "matchday") {
      setSelectedMatchday(navigation.id);
      setState(initialCompetitionActionState);
      return;
    }

    const destination = new URL(navigation.href, window.location.href);
    if (destination.origin === window.location.origin) {
      router.push(`${destination.pathname}${destination.search}${destination.hash}` as Route);
    } else {
      window.location.assign(destination.href);
    }
  }

  function discardAndContinue(): void {
    const navigation = pendingNavigation;
    if (!navigation) return;
    bypassNavigationGuard.current = true;
    setDrafts(draftsFromSchedule(schedule));
    setPendingNavigation(null);
    performNavigation(navigation);
    window.setTimeout(() => {
      bypassNavigationGuard.current = false;
    }, 0);
  }

  function saveResults(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setState(initialCompetitionActionState);
    if (saveableMatches.length === 0) {
      setState(
        invalidState(
          "Vervollständige mindestens ein Ergebnis. Pro Spiel werden beide Torzahlen benötigt.",
        ),
      );
      return;
    }

    const corrections = saveableMatches.filter((match) => (match.revision_no ?? 0) > 0).length;
    if (
      corrections > 0 &&
      !window.confirm(
        `${corrections} bereits veröffentlichte ${corrections === 1 ? "Ergebnis wird" : "Ergebnisse werden"} korrigiert. Alle betroffenen Punkte werden neu berechnet. Fortfahren?`,
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set(
      "results",
      JSON.stringify(saveableMatches.map((match) => toPayload(match, drafts[match.match_id]!))),
    );
    startTransition(async () => {
      const nextState = await setMatchResultsBatchAction(initialCompetitionActionState, formData);
      setState(nextState);
      if (nextState.status === "success") router.refresh();
    });
  }

  if (leagues.length === 0) {
    return (
      <div className="data-list">
        <p>Noch keine Spieltage vorhanden. Lege zuerst im Spielplan eine Liga und Spiele an.</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div
        aria-label="Spieltag auswählen"
        className={leagues.length > 1 ? "admin-form-grid" : "admin-filter-row"}
      >
        {leagues.length > 1 ? (
          <Select
            label="Liga"
            onChange={(event) =>
              requestNavigation({ kind: "league", id: event.currentTarget.value })
            }
            value={selectedLeague}
          >
            {leagues.map((league) => (
              <option key={league.id} value={league.id}>
                {league.label}
              </option>
            ))}
          </Select>
        ) : null}
        <Select
          label="Spieltag"
          onChange={(event) =>
            requestNavigation({ kind: "matchday", id: event.currentTarget.value })
          }
          value={selectedMatchday}
        >
          {matchdays.map((matchday) => (
            <option key={matchday.id} value={matchday.id}>
              {matchday.label}
            </option>
          ))}
        </Select>
      </div>

      {matches.length === 0 ? (
        <div className="data-list">
          <p>Dieser Spieltag enthält noch keine Spiele.</p>
        </div>
      ) : (
        <form className="admin-section result-manager" onSubmit={saveResults}>
          <div className="editor-list">
            {matchGroups.map((group) => (
              <section
                aria-labelledby={`result-date-${group.dateKey}`}
                className="match-date-group"
                key={group.dateKey}
              >
                <h4 className="match-date-group__heading" id={`result-date-${group.dateKey}`}>
                  <time dateTime={group.dateKey}>{group.dateLabel}</time>
                </h4>
                <div className="match-date-group__matches">
                  {group.matches.map((match) => {
                    const draft = drafts[match.match_id] ?? draftFromMatch(match);
                    return (
                      <ResultMatchRow
                        draft={draft}
                        key={match.match_id}
                        match={match}
                        now={now}
                        onChange={(change) => updateDraft(match.match_id, change)}
                        pending={pending}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <footer className="result-save-footer">
            <p>
              {saveableMatches.length === 0
                ? incompleteCount > 0
                  ? "Noch kein vollständiges Ergebnis zum Speichern."
                  : "Noch keine Änderungen."
                : `${saveableMatches.length} ${saveableMatches.length === 1 ? "Ergebnis" : "Ergebnisse"} bereit.`}
              {incompleteCount > 0
                ? ` ${incompleteCount} ${incompleteCount === 1 ? "unvollständige Eingabe wird" : "unvollständige Eingaben werden"} nicht gespeichert.`
                : ""}
            </p>
            <Button disabled={pending || saveableMatches.length === 0} fullWidth type="submit">
              {pending ? "Wird gespeichert …" : "Ergebnisse speichern"}
            </Button>
            <ActionMessage state={state} />
          </footer>
        </form>
      )}

      <Dialog
        description="Wenn du die Seite jetzt verlässt, gehen deine noch nicht gespeicherten Ergebniseingaben verloren."
        onClose={() => setPendingNavigation(null)}
        open={pendingNavigation !== null}
        title="Ungespeicherte Änderungen"
      >
        <div className="dialog-actions">
          <Button onClick={() => setPendingNavigation(null)} variant="secondary">
            Weiter bearbeiten
          </Button>
          <Button onClick={discardAndContinue} variant="danger">
            Änderungen verwerfen
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
