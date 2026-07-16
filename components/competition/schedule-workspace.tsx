"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { ActionMessage } from "@/components/competition/action-message";
import { ClubLogo } from "@/components/competition/club-logo";
import { ClubSelect, type ClubSelectOption } from "@/components/competition/club-select";
import { MatchCenterDisplay } from "@/components/competition/match-center-display";
import { Button } from "@/components/ui/button";
import { DismissibleSettingsScope } from "@/components/ui/dismissible-settings-scope";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createMatchSimpleAction,
  createMatchdayAutoAction,
  deleteMatchSimpleAction,
  deleteMatchdaySimpleAction,
  moveMatchdayPhaseAction,
  updateMatchSimpleAction,
} from "@/features/competition/schedule-actions";
import {
  berlinDateKey,
  berlinDateLabel,
  defaultKickoffInputValue,
} from "@/features/competition/schedule-display";
import type { AdminLeagueRow, AdminScheduleRow } from "@/features/competition/schedule-service";
import { initialCompetitionActionState } from "@/features/competition/types";

type ClubOption = ClubSelectOption;
type MatchdayPhase = AdminScheduleRow["phase"];
type Matchday = {
  id: string;
  displayName: string;
  hasPredictions: boolean;
  matches: AdminScheduleRow[];
  number: number;
  phase: MatchdayPhase;
  status: AdminScheduleRow["matchday_status"];
  version: number;
};

const phaseLabels: Record<MatchdayPhase, string> = {
  first_leg: "Hinrunde",
  second_leg: "Rückrunde",
};

function berlinInput(value: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(value))
    .replace(" ", "T");
}

function toMatchdays(schedule: AdminScheduleRow[]): Matchday[] {
  const grouped = new Map<string, Matchday>();
  for (const row of schedule) {
    const existing = grouped.get(row.matchday_id);
    if (existing) {
      if (row.match_id) existing.matches.push(row);
      continue;
    }
    grouped.set(row.matchday_id, {
      id: row.matchday_id,
      displayName: row.display_name,
      hasPredictions: Boolean(row.matchday_has_predictions),
      matches: row.match_id ? [row] : [],
      number: row.matchday_number,
      phase: row.phase,
      status: row.matchday_status,
      version: row.matchday_version,
    });
  }
  return [...grouped.values()].sort(
    (left, right) =>
      (left.phase === right.phase ? 0 : left.phase === "first_leg" ? -1 : 1) ||
      left.number - right.number,
  );
}

type MatchDateGroup = Readonly<{
  dateKey: string;
  dateLabel: string;
  matches: AdminScheduleRow[];
}>;

function groupMatchesByDate(matches: AdminScheduleRow[]): MatchDateGroup[] {
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

function CreateMatchdayForm({
  leagueId,
  phase,
}: Readonly<{ leagueId: string; phase: MatchdayPhase }>) {
  const [state, action, pending] = useActionState(
    createMatchdayAutoAction,
    initialCompetitionActionState,
  );
  return (
    <form action={action}>
      <input name="leagueId" type="hidden" value={leagueId} />
      <input name="phase" type="hidden" value={phase} />
      <Button disabled={pending} fullWidth type="submit" variant="secondary">
        {pending ? "Wird angelegt …" : "Spieltag hinzufügen"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

function PhaseOverview({
  basePath,
  leagueId,
  matchdays,
  phase,
  selectedMatchdayId,
}: Readonly<{
  basePath: string;
  leagueId: string;
  matchdays: Matchday[];
  phase: MatchdayPhase;
  selectedMatchdayId: string | undefined;
}>) {
  const router = useRouter();
  const days = matchdays.filter((day) => day.phase === phase);
  const selectedValue = days.some((day) => day.id === selectedMatchdayId) ? selectedMatchdayId : "";

  return (
    <section className="admin-form schedule-phase-picker" aria-labelledby={`${phase}-heading`}>
      <h4 id={`${phase}-heading`}>{phaseLabels[phase]}</h4>
      <Select
        disabled={!days.length}
        label="Spieltag auswählen"
        onChange={(event) => {
          const matchdayId = event.currentTarget.value;
          if (!matchdayId) return;
          router.push(
            `${basePath}?matchday=${encodeURIComponent(matchdayId)}#selected-matchday-heading` as Route,
          );
        }}
        value={selectedValue}
      >
        {days.length ? (
          <option disabled hidden value="">
            Spieltag auswählen
          </option>
        ) : (
          <option value="">Noch kein Spieltag</option>
        )}
        {days.map((day) => (
          <option key={day.id} value={day.id}>
            {day.displayName}
          </option>
        ))}
      </Select>
      <CreateMatchdayForm leagueId={leagueId} phase={phase} />
    </section>
  );
}

function MatchdayActions({ day }: Readonly<{ day: Matchday }>) {
  const [moveState, moveAction, movePending] = useActionState(
    moveMatchdayPhaseAction,
    initialCompetitionActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteMatchdaySimpleAction,
    initialCompetitionActionState,
  );
  const targetPhase: MatchdayPhase = day.phase === "first_leg" ? "second_leg" : "first_leg";

  return (
    <details className="matchday-settings" data-dismissible-settings>
      <summary aria-label="Spieltag verwalten">
        <Icon name="settings" />
      </summary>
      <div className="matchday-settings__panel">
        <div>
          <strong>Spieltag verwalten</strong>
        </div>
        {day.hasPredictions ? (
          <p className="admin-form__warning">
            Für diesen Spieltag liegen bereits Tipps vor. Verschieben und Löschen sind deshalb
            gesperrt.
          </p>
        ) : (
          <div className="admin-form-grid">
            <form action={moveAction} className="admin-form">
              <input name="id" type="hidden" value={day.id} />
              <input name="expectedVersion" type="hidden" value={day.version} />
              <input name="phase" type="hidden" value={targetPhase} />
              <p>
                In die {phaseLabels[targetPhase]} verschieben. Dort erhält der Spieltag automatisch
                die nächste freie Nummer.
              </p>
              <Button disabled={movePending} type="submit" variant="secondary">
                {movePending
                  ? "Wird verschoben …"
                  : `In die ${phaseLabels[targetPhase]} verschieben`}
              </Button>
              <ActionMessage state={moveState} />
            </form>
            <form action={deleteAction} className="admin-form">
              <input name="id" type="hidden" value={day.id} />
              <input name="expectedVersion" type="hidden" value={day.version} />
              <p>Entfernt den Spieltag einschließlich seiner Spiele dauerhaft.</p>
              <Button disabled={deletePending} type="submit" variant="danger">
                {deletePending ? "Wird gelöscht …" : "Spieltag löschen"}
              </Button>
              <ActionMessage state={deleteState} />
            </form>
          </div>
        )}
      </div>
    </details>
  );
}

function CreateMatchForm({ clubs, day }: Readonly<{ clubs: ClubOption[]; day: Matchday }>) {
  const [state, action, pending] = useActionState(
    createMatchSimpleAction,
    initialCompetitionActionState,
  );
  const [homeClubId, setHomeClubId] = useState("");
  const [awayClubId, setAwayClubId] = useState("");
  const usedClubIds = new Set(
    day.matches
      .flatMap((match) => [match.home_club_id, match.away_club_id])
      .filter((clubId): clubId is string => Boolean(clubId)),
  );
  const disabledHomeClubIds = new Set(usedClubIds);
  const disabledAwayClubIds = new Set(usedClubIds);
  if (awayClubId) disabledHomeClubIds.add(awayClubId);
  if (homeClubId) disabledAwayClubIds.add(homeClubId);
  const availableClubCount = clubs.filter((club) => !usedClubIds.has(club.id)).length;
  const unavailable = day.hasPredictions || availableClubCount < 2;
  return (
    <form action={action} className="admin-form">
      <div>
        <h3>Spiel hinzufügen</h3>
      </div>
      <input name="matchdayId" type="hidden" value={day.id} />
      <ClubSelect
        clubs={clubs}
        disabled={unavailable}
        disabledIds={disabledHomeClubIds}
        label="Heimverein"
        name="homeClubId"
        onChange={(value) => {
          setHomeClubId(value);
          if (awayClubId === value) setAwayClubId("");
        }}
        value={homeClubId}
      />
      <ClubSelect
        clubs={clubs}
        disabled={unavailable}
        disabledIds={disabledAwayClubIds}
        label="Auswärtsverein"
        name="awayClubId"
        onChange={(value) => {
          setAwayClubId(value);
          if (homeClubId === value) setHomeClubId("");
        }}
        value={awayClubId}
      />
      <Input
        defaultValue={defaultKickoffInputValue()}
        disabled={unavailable}
        label="Anpfiff"
        name="kickoffAt"
        type="datetime-local"
        required
      />
      <Button disabled={pending || unavailable || !homeClubId || !awayClubId} type="submit">
        {pending ? "Wird angelegt …" : "Spiel anlegen"}
      </Button>
      {availableClubCount < 2 ? (
        <p className="admin-form__warning">
          {clubs.length < 2
            ? "Ordne der Liga zuerst mindestens zwei Vereine zu."
            : "Für diesen Spieltag sind keine zwei freien Vereine mehr verfügbar."}
        </p>
      ) : null}
      {day.hasPredictions ? (
        <p className="admin-form__warning">
          Neue Spiele sind gesperrt, weil für diesen Spieltag bereits Tipps vorliegen.
        </p>
      ) : null}
      <ActionMessage state={state} />
    </form>
  );
}

function ExistingMatchForm({
  clubs,
  now,
  reservedClubIds,
  row,
}: Readonly<{
  clubs: ClubOption[];
  now: number;
  reservedClubIds: Set<string>;
  row: AdminScheduleRow;
}>) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateMatchSimpleAction,
    initialCompetitionActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteMatchSimpleAction,
    initialCompetitionActionState,
  );
  const [homeClubId, setHomeClubId] = useState(row.home_club_id ?? "");
  const [awayClubId, setAwayClubId] = useState(row.away_club_id ?? "");
  if (!row.match_id || !row.kickoff_at || !row.match_status || row.match_version === null)
    return null;
  const locked = Boolean(row.match_has_predictions || row.decision);
  const disabledHomeClubIds = new Set(reservedClubIds);
  const disabledAwayClubIds = new Set(reservedClubIds);
  if (awayClubId) disabledHomeClubIds.add(awayClubId);
  if (homeClubId) disabledAwayClubIds.add(homeClubId);

  return (
    <details className="match-admin-item" data-dismissible-settings>
      <summary className="match-admin-item__summary">
        <span className="match-admin-team match-admin-team--home">
          <strong>{row.home_club_name}</strong>
          <ClubLogo logoUrl={row.home_club_logo_url} name={row.home_club_name} />
        </span>
        <MatchCenterDisplay now={now} row={row} />
        <span className="match-admin-team match-admin-team--away">
          <ClubLogo logoUrl={row.away_club_logo_url} name={row.away_club_name} />
          <strong>{row.away_club_name}</strong>
        </span>
        <span className="match-admin-item__settings" aria-hidden="true" title="Spiel verwalten">
          <Icon name="settings" />
        </span>
        <span className="visually-hidden">
          Spiel verwalten: {row.home_club_name} gegen {row.away_club_name}
        </span>
      </summary>
      <div className="match-admin-item__panel">
        {locked ? (
          <p className="admin-form__warning">
            {row.decision
              ? "Für dieses Spiel liegt bereits ein Ergebnis vor. Korrekturen erfolgen im Ergebnisbereich."
              : "Für dieses Spiel liegen Tipps vor. Spielpaarung, Anpfiff und Löschen sind gesperrt."}
          </p>
        ) : (
          <>
            <form action={updateAction} className="admin-form-grid match-admin-item__edit">
              <input name="id" type="hidden" value={row.match_id} />
              <input name="expectedVersion" type="hidden" value={row.match_version} />
              <ClubSelect
                clubs={clubs}
                disabledIds={disabledHomeClubIds}
                label="Heimverein"
                name="homeClubId"
                onChange={(value) => {
                  setHomeClubId(value);
                  if (awayClubId === value) setAwayClubId("");
                }}
                value={homeClubId}
              />
              <ClubSelect
                clubs={clubs}
                disabledIds={disabledAwayClubIds}
                label="Auswärtsverein"
                name="awayClubId"
                onChange={(value) => {
                  setAwayClubId(value);
                  if (homeClubId === value) setHomeClubId("");
                }}
                value={awayClubId}
              />
              <Input
                defaultValue={berlinInput(row.kickoff_at)}
                label="Anpfiff"
                name="kickoffAt"
                type="datetime-local"
                required
              />
              <Select defaultValue={row.match_status} label="Spielstatus" name="status" required>
                <option value={row.matchday_status === "published" ? "published" : "draft"}>
                  Geplant
                </option>
                <option value="postponed">Verschoben</option>
                <option value="cancelled">Abgesagt</option>
                <option value="abandoned">Abgebrochen</option>
              </Select>
              <Button
                disabled={updatePending || !homeClubId || !awayClubId}
                type="submit"
                variant="secondary"
              >
                {updatePending ? "Wird gespeichert …" : "Änderungen speichern"}
              </Button>
              <ActionMessage state={updateState} />
            </form>
            <form action={deleteAction} className="match-admin-item__delete">
              <div>
                <strong>Spiel löschen</strong>
                <p>Das Spiel wird dauerhaft aus diesem Spieltag entfernt.</p>
              </div>
              <input name="id" type="hidden" value={row.match_id} />
              <input name="expectedVersion" type="hidden" value={row.match_version} />
              <Button disabled={deletePending} type="submit" variant="danger">
                {deletePending ? "Wird gelöscht …" : "Spiel endgültig löschen"}
              </Button>
              <ActionMessage state={deleteState} />
            </form>
          </>
        )}
      </div>
    </details>
  );
}

export function ScheduleWorkspace({
  basePath,
  clubs,
  schedule,
  selectedLeague,
  selectedMatchdayId,
}: Readonly<{
  basePath: string;
  clubs: ClubOption[];
  schedule: AdminScheduleRow[];
  selectedLeague: AdminLeagueRow;
  selectedMatchdayId: string | undefined;
}>) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const matchdays = toMatchdays(schedule);
  const selectedDay = matchdays.find((day) => day.id === selectedMatchdayId) ?? matchdays.at(0);
  const matchDateGroups = selectedDay ? groupMatchesByDate(selectedDay.matches) : [];

  return (
    <>
      <DismissibleSettingsScope className="schedule-admin-layout">
        <aside className="schedule-matchday-navigation" aria-label="Spieltage">
          <PhaseOverview
            basePath={basePath}
            leagueId={selectedLeague.id}
            matchdays={matchdays}
            phase="first_leg"
            selectedMatchdayId={selectedDay?.id}
          />
          <PhaseOverview
            basePath={basePath}
            leagueId={selectedLeague.id}
            matchdays={matchdays}
            phase="second_leg"
            selectedMatchdayId={selectedDay?.id}
          />
        </aside>

        {selectedDay ? (
          <section
            className="editor-list schedule-matchday-workspace"
            aria-labelledby="selected-matchday-heading"
          >
            <div className="round-list__header">
              <div>
                <h4 id="selected-matchday-heading">{selectedDay.displayName}</h4>
                <p>
                  {selectedDay.matches.length}{" "}
                  {selectedDay.matches.length === 1 ? "Spiel" : "Spiele"}
                </p>
              </div>
              <MatchdayActions day={selectedDay} />
            </div>
            <CreateMatchForm clubs={clubs} day={selectedDay} />
            <div className="editor-list">
              <h3>Angelegte Spiele</h3>
              {matchDateGroups.length ? (
                matchDateGroups.map((group) => (
                  <section
                    className="match-date-group"
                    key={group.dateKey}
                    aria-labelledby={`match-date-${group.dateKey}`}
                  >
                    <h4 className="match-date-group__heading" id={`match-date-${group.dateKey}`}>
                      <time dateTime={group.dateKey}>{group.dateLabel}</time>
                    </h4>
                    <div className="match-date-group__matches">
                      {group.matches.map((row) => {
                        const reservedClubIds = new Set(
                          selectedDay.matches
                            .filter((match) => match.match_id !== row.match_id)
                            .flatMap((match) => [match.home_club_id, match.away_club_id])
                            .filter((clubId): clubId is string => Boolean(clubId)),
                        );
                        return (
                          <ExistingMatchForm
                            clubs={clubs}
                            key={row.match_id}
                            now={now}
                            reservedClubIds={reservedClubIds}
                            row={row}
                          />
                        );
                      })}
                    </div>
                  </section>
                ))
              ) : (
                <div className="round-list__empty">
                  <strong>Noch keine Spiele</strong>
                  <p>Lege oben die erste Paarung für diesen Spieltag an.</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <div className="round-list__empty schedule-matchday-workspace">
            <strong>Noch kein Spieltag</strong>
            <p>Lege in der Hin- oder Rückrunde den ersten Spieltag an.</p>
          </div>
        )}
      </DismissibleSettingsScope>
    </>
  );
}
