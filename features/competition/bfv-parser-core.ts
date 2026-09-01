import { berlinDateTimeLocalToIso } from "./berlin-time";
import type {
  BfvScheduleDocument,
  BfvSourceMatch,
  BfvSourceMatchday,
  BfvSourceResult,
} from "./bfv-import-types";

const MATCHDAY_PATTERN = /^(\d+)\s*\.\s*SPIELTAG$/i;
const MATCH_PATTERN = /^(\d{3,})\s+(\d{2}\.\d{2}\.\d{4})\s+(?:(\d{2}:\d{2})\s+)?(.+)$/;
const RESULT_PATTERN = /\s+(\d+):(\d+)$/;
const LEAGUE_NUMBER_PATTERN = /\bLIGANUMMER\s+(\d+)\b/i;
const SEASON_PATTERN = /\bSAISON\s+(\d{2}\/\d{2})\b/i;

const germanMonths: Record<string, number> = {
  januar: 1,
  februar: 2,
  märz: 3,
  april: 4,
  mai: 5,
  juni: 6,
  juli: 7,
  august: 8,
  september: 9,
  oktober: 10,
  november: 11,
  dezember: 12,
};

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isoDate(value: string): string {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) throw new Error(`Ungültiges BFV-Datum: ${value}`);
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseDocumentDate(text: string): string | null {
  const match = /Stand:\s*[^,\n]*,?\s*(\d{1,2})\.\s+([A-Za-zÄÖÜäöüß]+)\s+(\d{4})/i.exec(text);
  if (!match) return null;
  const month = germanMonths[match[2]!.toLocaleLowerCase("de-DE")];
  if (!month) return null;
  return `${match[3]}-${String(month).padStart(2, "0")}-${match[1]!.padStart(2, "0")}`;
}

function parseLeagueName(lines: string[]): string {
  const line = lines.find(
    (candidate) =>
      candidate.includes(" / KREIS ") &&
      !candidate.toLocaleUpperCase("de-DE").startsWith("MEISTERSCHAFTEN"),
  );
  return compact(line?.split(" / KREIS ")[0] ?? "BFV-Liga");
}

function parseResult(party: string): { party: string; result: BfvSourceResult | null } {
  const match = RESULT_PATTERN.exec(party);
  if (!match) return { party, result: null };
  return {
    party: party.slice(0, match.index).trim(),
    result: { homeGoals: Number(match[1]), awayGoals: Number(match[2]) },
  };
}

type MutableMatchday = {
  sourceNumber: number;
  matches: BfvSourceMatch[];
};

export function parseBfvSchedulePages(
  pages: string[],
  sourceMarkedChangedIds: ReadonlySet<string> = new Set<string>(),
): BfvScheduleDocument {
  const text = pages.join("\n");
  const lines = text.split(/\r?\n/).map(compact).filter(Boolean);
  const leagueNumber = LEAGUE_NUMBER_PATTERN.exec(text)?.[1];
  const seasonLabel = SEASON_PATTERN.exec(text)?.[1];
  if (!leagueNumber || !seasonLabel || !/AKTUELLE TERMINLISTE/i.test(text)) {
    throw new Error("Die Datei ist keine unterstützte BFV-Terminliste.");
  }

  const mutableMatchdays: MutableMatchday[] = [];
  const warnings: string[] = [];
  let currentMatchday: MutableMatchday | null = null;

  for (const line of lines) {
    const matchdayMatch = MATCHDAY_PATTERN.exec(line);
    if (matchdayMatch) {
      currentMatchday = { sourceNumber: Number(matchdayMatch[1]), matches: [] };
      mutableMatchdays.push(currentMatchday);
      continue;
    }

    const match = MATCH_PATTERN.exec(line);
    if (!match || !currentMatchday) continue;
    const sourceMatchNumber = match[1]!;
    const sourceDate = match[2]!;
    const sourceTime = match[3];
    const rawParty = match[4]!;
    const { party, result } = parseResult(rawParty);
    const separatorIndex = party.indexOf(" - ");
    if (separatorIndex < 0) {
      warnings.push(`Spiel ${sourceMatchNumber} konnte nicht eindeutig getrennt werden.`);
      continue;
    }
    const homeClubName = compact(party.slice(0, separatorIndex));
    const awayClubName = compact(party.slice(separatorIndex + 3));
    if (homeClubName === "SPIELFREI" || awayClubName === "SPIELFREI") continue;
    if (!sourceTime) {
      warnings.push(`Spiel ${sourceMatchNumber} hat keine Uhrzeit und wurde übersprungen.`);
      continue;
    }
    const date = isoDate(sourceDate);
    currentMatchday.matches.push({
      awayClubName,
      date,
      homeClubName,
      kickoffAt: berlinDateTimeLocalToIso(`${date}T${sourceTime}`),
      result,
      sourceMarkedChanged: sourceMarkedChangedIds.has(sourceMatchNumber),
      sourceMatchNumber,
      sourceMatchdayNumber: currentMatchday.sourceNumber,
      time: sourceTime,
    });
  }

  if (!mutableMatchdays.length) throw new Error("In der BFV-Datei wurden keine Spieltage erkannt.");
  const orderedMatchdays = mutableMatchdays.toSorted(
    (left, right) => left.sourceNumber - right.sourceNumber,
  );
  const phaseBreak = Math.ceil(orderedMatchdays.length / 2);
  const matchdays: BfvSourceMatchday[] = orderedMatchdays.map((matchday, index) => {
    if (!matchday.matches.length) {
      throw new Error(`Spieltag ${matchday.sourceNumber} enthält keine importierbaren Spiele.`);
    }
    const dates = matchday.matches.map((match) => match.date).toSorted();
    const firstLeg = index < phaseBreak;
    return {
      endsOn: dates.at(-1)!,
      matches: matchday.matches,
      phase: firstLeg ? "first_leg" : "second_leg",
      phaseNumber: firstLeg ? index + 1 : index - phaseBreak + 1,
      sourceNumber: matchday.sourceNumber,
      startsOn: dates[0]!,
    };
  });
  const allMatches = matchdays.flatMap((matchday) => matchday.matches);
  const sourceClubNames = [
    ...new Set(allMatches.flatMap((match) => [match.homeClubName, match.awayClubName])),
  ].toSorted((left, right) => left.localeCompare(right, "de"));

  return {
    documentDate: parseDocumentDate(text),
    leagueName: parseLeagueName(lines),
    leagueNumber,
    matchdays,
    pageCount: pages.length,
    seasonLabel,
    sourceClubNames,
    sourceMarkedChangedCount: allMatches.filter((match) => match.sourceMarkedChanged).length,
    sourceResultCount: allMatches.filter((match) => match.result).length,
    warnings,
  };
}
