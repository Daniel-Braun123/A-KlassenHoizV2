"use client";

import {
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { ClubLogo } from "@/components/competition/club-logo";
import { ClubSelect, type ClubSelectOption } from "@/components/competition/club-select";
import { Button } from "@/components/ui/button";
import { DismissibleSettingsScope } from "@/components/ui/dismissible-settings-scope";
import { Icon } from "@/components/ui/icon";
import {
  importBfvScheduleAction,
  previewBfvScheduleAction,
} from "@/features/competition/bfv-import-actions";
import { buildBfvImportPlan } from "@/features/competition/bfv-import-plan";
import type {
  BfvClubMapping,
  BfvImportActionState,
  BfvImportMatchAction,
  BfvImportPlannedMatch,
  BfvPreviewActionState,
} from "@/features/competition/bfv-import-types";
import type { AdminScheduleRow } from "@/features/competition/schedule-service";

const actionLabels: Record<BfvImportMatchAction, string> = {
  blocked: "Gesperrt",
  create: "Neu",
  unchanged: "Unverändert",
  unmapped: "Zuordnen",
  update: "Änderung",
};

function dateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function dateRange(startsOn: string, endsOn: string): string {
  return startsOn === endsOn
    ? dateLabel(startsOn)
    : `${dateLabel(startsOn)} bis ${dateLabel(endsOn)}`;
}

function fileSizeLabel(size: number): string {
  return size < 1_000_000
    ? `${Math.max(1, Math.round(size / 1_000))} KB`
    : `${(size / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;
}

function SummaryCard({ label, value }: Readonly<{ label: string; value: number | string }>) {
  return (
    <div className="bfv-import-summary-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

type PreviewDateGroup = Readonly<{
  dateKey: string;
  dateLabel: string;
  matches: BfvImportPlannedMatch[];
}>;

function groupPreviewMatchesByMatchday(
  matches: BfvImportPlannedMatch[],
): Map<number, PreviewDateGroup[]> {
  const matchdays = new Map<number, Map<string, BfvImportPlannedMatch[]>>();

  for (const match of matches) {
    const dates = matchdays.get(match.sourceMatchdayNumber) ?? new Map();
    dates.set(match.date, [...(dates.get(match.date) ?? []), match]);
    matchdays.set(match.sourceMatchdayNumber, dates);
  }

  return new Map(
    [...matchdays].map(([matchdayNumber, dates]) => [
      matchdayNumber,
      [...dates]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([dateKey, dateMatches]) => ({
          dateKey,
          dateLabel: dateLabel(dateKey),
          matches: dateMatches.toSorted((left, right) =>
            left.kickoffAt.localeCompare(right.kickoffAt),
          ),
        })),
    ]),
  );
}

export function BfvScheduleImport({
  clubs,
  leagueId,
  schedule,
  yearLabel,
}: Readonly<{
  clubs: ClubSelectOption[];
  leagueId: string;
  schedule: AdminScheduleRow[];
  yearLabel: string;
}>) {
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BfvPreviewActionState | null>(null);
  const [mappings, setMappings] = useState<BfvClubMapping>({});
  const [importState, setImportState] = useState<BfvImportActionState | null>(null);
  const [previewPending, startPreviewTransition] = useTransition();
  const [importPending, startImportTransition] = useTransition();
  const successfulPreview = preview?.status === "success" ? preview : null;
  const plan = useMemo(
    () =>
      successfulPreview ? buildBfvImportPlan(successfulPreview.document, schedule, mappings) : null,
    [mappings, schedule, successfulPreview],
  );
  const clubsById = useMemo(() => new Map(clubs.map((club) => [club.id, club])), [clubs]);
  const previewMatchesByMatchday = useMemo(
    () =>
      plan ? groupPreviewMatchesByMatchday(plan.matches) : new Map<number, PreviewDateGroup[]>(),
    [plan],
  );
  const importSucceeded = importState?.status === "success";
  const scheduleAlreadyCurrent = Boolean(
    plan &&
    plan.blockedCount === 0 &&
    plan.unmappedCount === 0 &&
    plan.createCount === 0 &&
    plan.updateCount === 0,
  );

  function resetPreview() {
    setPreview(null);
    setMappings({});
    setImportState(null);
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.currentTarget.files?.[0] ?? null;
    setFile(selectedFile);
    resetPreview();
  }

  function removeFile() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFile(null);
    resetPreview();
  }

  function previewFile(formData: FormData) {
    const selectedFile = formData.get("file");
    if (!(selectedFile instanceof File) || !selectedFile.size) return;
    setFile(selectedFile);
    setImportState(null);
    startPreviewTransition(async () => {
      const nextPreview = await previewBfvScheduleAction(formData);
      setPreview(nextPreview);
      if (nextPreview.status === "success") setMappings(nextPreview.initialMappings);
    });
  }

  function submitPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (file) formData.set("file", file);
    previewFile(formData);
  }

  function importSchedule() {
    if (
      !file ||
      !plan?.canImport ||
      !successfulPreview?.seasonMatches ||
      scheduleAlreadyCurrent ||
      importSucceeded
    )
      return;
    const formData = new FormData();
    formData.set("file", file);
    formData.set("leagueId", leagueId);
    formData.set("mappings", JSON.stringify(mappings));
    startImportTransition(async () => {
      const nextState = await importBfvScheduleAction(formData);
      setImportState(nextState);
      if (nextState.status === "success") router.refresh();
    });
  }

  return (
    <DismissibleSettingsScope>
      <details className="bfv-import-panel" data-dismissible-settings>
        <summary>
          <span className="bfv-import-panel__icon">
            <Icon name="calendar" />
          </span>
          <span>
            <strong>BFV-Spielplan importieren</strong>
            <small>Spieltage und Spiele sicher aus einer Terminlisten-PDF übernehmen</small>
          </span>
          <Icon className="bfv-import-panel__chevron" name="chevron-right" />
        </summary>
        <div className="bfv-import-panel__content">
          <form className="bfv-import-upload" onSubmit={submitPreview}>
            <div className="field bfv-import-file-field">
              <span className="field__label" id={`${fileInputId}-label`}>
                BFV-Spielplan-PDF <span aria-hidden="true">*</span>
              </span>
              <p className="field__hint" id={`${fileInputId}-hint`}>
                BFV: Aktuelle Terminliste als PDF, maximal 5 MB.
              </p>
              <input
                ref={fileInputRef}
                accept="application/pdf,.pdf"
                aria-describedby={`${fileInputId}-hint`}
                aria-labelledby={`${fileInputId}-label`}
                className="visually-hidden"
                disabled={previewPending}
                id={fileInputId}
                name="file"
                onChange={selectFile}
                required
                type="file"
              />
              {file ? (
                <div className="bfv-import-file-selected">
                  <span className="bfv-import-file-selected__type" aria-hidden="true">
                    PDF
                  </span>
                  <span className="bfv-import-file-selected__details">
                    <strong title={file.name}>{file.name}</strong>
                    <small>{fileSizeLabel(file.size)} · bereit zur Prüfung</small>
                  </span>
                  <span className="bfv-import-file-selected__actions">
                    <Button
                      disabled={previewPending}
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                      variant="ghost"
                    >
                      Ändern
                    </Button>
                    <Button
                      disabled={previewPending}
                      onClick={removeFile}
                      type="button"
                      variant="ghost"
                    >
                      Entfernen
                    </Button>
                  </span>
                </div>
              ) : (
                <Button
                  className="bfv-import-file-picker"
                  disabled={previewPending}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  variant="secondary"
                >
                  PDF auswählen
                </Button>
              )}
            </div>
            <input name="leagueId" type="hidden" value={leagueId} />
            <Button disabled={previewPending || !file} type="submit" variant="secondary">
              {previewPending ? "PDF wird geprüft …" : "PDF prüfen und Vorschau erstellen"}
            </Button>
          </form>

          {preview?.status === "error" ? (
            <p className="admin-form__message admin-form__message--error" role="alert">
              {preview.message}
            </p>
          ) : null}

          {successfulPreview && plan ? (
            <div className="bfv-import-preview">
              <div className="bfv-import-preview__header">
                <div>
                  <span className="bfv-import-preview__eyebrow">Erkannte Terminliste</span>
                  <h4>{successfulPreview.document.leagueName}</h4>
                  <p>
                    BFV-Liganummer {successfulPreview.document.leagueNumber} · Saison{" "}
                    {successfulPreview.document.seasonLabel}
                    {successfulPreview.document.documentDate
                      ? ` · Stand ${dateLabel(successfulPreview.document.documentDate)}`
                      : ""}
                  </p>
                </div>
                <span className="bfv-import-status" data-status="ready">
                  <Icon name="check-circle" /> Gelesen
                </span>
              </div>

              <div className="bfv-import-summary-grid">
                <SummaryCard
                  label="Spieltage"
                  value={successfulPreview.document.matchdays.length}
                />
                <SummaryCard label="Spiele" value={plan.matches.length} />
                <SummaryCard label="Neu" value={plan.createCount} />
                <SummaryCard label="Änderungen" value={plan.updateCount} />
                <SummaryCard label="Unverändert" value={plan.unchangedCount} />
              </div>

              {!successfulPreview.seasonMatches ? (
                <p className="admin-form__warning" role="alert">
                  Die PDF gehört zur Saison {successfulPreview.document.seasonLabel}. Für diese Liga
                  ist {yearLabel} ausgewählt.
                </p>
              ) : null}
              {successfulPreview.document.warnings.map((warning) => (
                <p className="admin-form__warning" key={warning}>
                  {warning}
                </p>
              ))}
              {plan.blockedCount ? (
                <p className="admin-form__warning" role="alert">
                  {plan.blockedCount} {plan.blockedCount === 1 ? "Änderung ist" : "Änderungen sind"}{" "}
                  durch vorhandene Tipps oder Ergebnisse gesperrt. Diese Daten werden nicht
                  überschrieben.
                </p>
              ) : null}
              {plan.unmatchedExistingCount ? (
                <p className="bfv-import-note">
                  {plan.unmatchedExistingCount} bereits vorhandene{" "}
                  {plan.unmatchedExistingCount === 1 ? "Partie ist" : "Partien sind"} nicht in der
                  PDF enthalten und bleiben unverändert.
                </p>
              ) : null}
              {successfulPreview.document.sourceResultCount ? (
                <p className="bfv-import-note">
                  {successfulPreview.document.sourceResultCount} vorhandene BFV-Ergebnisse wurden
                  erkannt. Der Import verändert ausschließlich den Spielplan; Ergebnisse bleiben im
                  Ergebnisbereich geschützt.
                </p>
              ) : null}

              <section className="bfv-import-mapping" aria-labelledby="bfv-club-mapping-heading">
                <div>
                  <h4 id="bfv-club-mapping-heading">Vereine zuordnen</h4>
                  <p>Prüfe einmal, ob jeder Name aus der PDF zum richtigen Verein gehört.</p>
                </div>
                <div className="bfv-import-mapping__grid">
                  {successfulPreview.document.sourceClubNames.map((sourceName) => {
                    const usedByOtherMappings = new Set(
                      Object.entries(mappings).flatMap(([name, clubId]) =>
                        name !== sourceName && clubId ? [clubId] : [],
                      ),
                    );
                    return (
                      <ClubSelect
                        clubs={clubs}
                        disabledIds={usedByOtherMappings}
                        key={sourceName}
                        label={sourceName}
                        name={`mapping-${sourceName}`}
                        onChange={(clubId) => {
                          setImportState(null);
                          setMappings((current) => ({ ...current, [sourceName]: clubId }));
                        }}
                        value={mappings[sourceName] ?? ""}
                      />
                    );
                  })}
                </div>
              </section>

              <section className="bfv-import-matchdays" aria-labelledby="bfv-preview-heading">
                <div>
                  <h4 id="bfv-preview-heading">Importvorschau</h4>
                  <p>„BFV geändert“ kennzeichnet in der PDF kursiv markierte Partien.</p>
                </div>
                {successfulPreview.document.matchdays.map((matchday) => {
                  const dateGroups = previewMatchesByMatchday.get(matchday.sourceNumber) ?? [];
                  const matchCount = dateGroups.reduce(
                    (count, group) => count + group.matches.length,
                    0,
                  );
                  return (
                    <details className="bfv-import-matchday" key={matchday.sourceNumber}>
                      <summary>
                        <span>
                          <strong>Spieltag {matchday.sourceNumber}</strong>
                          <small>{dateRange(matchday.startsOn, matchday.endsOn)}</small>
                        </span>
                        <span className="bfv-import-matchday__meta">
                          <span>{matchCount} Spiele</span>
                          <Icon className="bfv-import-matchday__chevron" name="chevron-right" />
                        </span>
                      </summary>
                      <div className="bfv-import-match-date-groups">
                        {dateGroups.map((group) => (
                          <section
                            aria-labelledby={`bfv-matchday-${matchday.sourceNumber}-${group.dateKey}`}
                            className="bfv-import-match-date-group"
                            key={group.dateKey}
                          >
                            <h5 id={`bfv-matchday-${matchday.sourceNumber}-${group.dateKey}`}>
                              <time dateTime={group.dateKey}>{group.dateLabel}</time>
                            </h5>
                            <div className="bfv-import-match-list">
                              {group.matches.map((match) => {
                                const homeClub = match.homeClubId
                                  ? clubsById.get(match.homeClubId)
                                  : null;
                                const awayClub = match.awayClubId
                                  ? clubsById.get(match.awayClubId)
                                  : null;
                                return (
                                  <div className="bfv-import-match" key={match.sourceMatchNumber}>
                                    <time dateTime={match.kickoffAt}>{match.time}</time>
                                    <span className="bfv-import-match__teams">
                                      <span className="bfv-import-match__team bfv-import-match__team--home">
                                        <strong title={match.homeClubName}>
                                          {match.homeClubName}
                                        </strong>
                                        <ClubLogo
                                          className="bfv-import-match__logo"
                                          logoUrl={homeClub?.logoUrl ?? null}
                                          name={match.homeClubName}
                                          size={28}
                                        />
                                      </span>
                                      <span aria-hidden="true">–</span>
                                      <span className="bfv-import-match__team bfv-import-match__team--away">
                                        <ClubLogo
                                          className="bfv-import-match__logo"
                                          logoUrl={awayClub?.logoUrl ?? null}
                                          name={match.awayClubName}
                                          size={28}
                                        />
                                        <strong title={match.awayClubName}>
                                          {match.awayClubName}
                                        </strong>
                                      </span>
                                    </span>
                                    <span className="bfv-import-match__badges">
                                      {match.sourceMarkedChanged ? (
                                        <span
                                          className="bfv-import-status"
                                          data-status="source-changed"
                                        >
                                          BFV geändert
                                        </span>
                                      ) : null}
                                      <span
                                        className="bfv-import-status"
                                        data-status={match.action}
                                      >
                                        {actionLabels[match.action]}
                                      </span>
                                    </span>
                                    {match.changes.length ? (
                                      <small>Ändert: {match.changes.join(", ")}</small>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </section>

              {importState ? (
                <p
                  className={`admin-form__message${importState.status === "error" ? " admin-form__message--error" : ""}`}
                  role={importState.status === "error" ? "alert" : "status"}
                >
                  {importState.message}
                </p>
              ) : null}

              <div className="bfv-import-actions">
                <p>
                  Der Import löscht keine vorhandenen Spiele und versendet keine
                  Sammel-Benachrichtigungen.
                </p>
                <Button
                  className={
                    importSucceeded || scheduleAlreadyCurrent
                      ? "bfv-import-actions__complete"
                      : undefined
                  }
                  disabled={
                    importPending ||
                    !plan.canImport ||
                    !successfulPreview.seasonMatches ||
                    scheduleAlreadyCurrent ||
                    importSucceeded
                  }
                  onClick={importSchedule}
                  type="button"
                  variant={importSucceeded || scheduleAlreadyCurrent ? "secondary" : "primary"}
                >
                  {importPending ? (
                    "Spielplan wird importiert …"
                  ) : importSucceeded ? (
                    <>
                      <Icon name="check-circle" /> Spielplan importiert
                    </>
                  ) : scheduleAlreadyCurrent ? (
                    <>
                      <Icon name="check-circle" /> Spielplan bereits aktuell
                    </>
                  ) : (
                    "Spielplan jetzt importieren"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </details>
    </DismissibleSettingsScope>
  );
}
