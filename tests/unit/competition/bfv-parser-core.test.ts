import { describe, expect, it } from "vitest";

import { parseBfvSchedulePages } from "@/features/competition/bfv-parser-core";

const header = `
AKTUELLE TERMINLISTE
A-Klasse Vilshofen / KREIS NIEDERBAYERN OST
LIGANUMMER 312541
SAISON 26/27
Stand: Montag, 31. August 2026
`;

describe("BFV schedule parser", () => {
  it("parses matchdays, kickoff times, results and changed source rows", () => {
    const document = parseBfvSchedulePages(
      [
        `${header}
1. SPIELTAG
312540001 24.07.2026 19:00 SV Hofkirchen 2 - SV Beutelsbach 1:2
312540002 26.07.2026 15:00 (SG) Neustift/Sandbach - ASV Ortenburg
312540003 26.07.2026 SPIELFREI - TSV Muster
2. SPIELTAG
312540004 02.08.2026 15:00 ASV Ortenburg - SV Hofkirchen 2 0:0
`,
      ],
      new Set(["312540002"]),
    );

    expect(document).toMatchObject({
      documentDate: "2026-08-31",
      leagueName: "A-Klasse Vilshofen",
      leagueNumber: "312541",
      pageCount: 1,
      seasonLabel: "26/27",
      sourceMarkedChangedCount: 1,
      sourceResultCount: 2,
      warnings: [],
    });
    expect(document.matchdays).toHaveLength(2);
    expect(document.matchdays[0]).toMatchObject({
      endsOn: "2026-07-26",
      phase: "first_leg",
      phaseNumber: 1,
      sourceNumber: 1,
      startsOn: "2026-07-24",
    });
    expect(document.matchdays[1]).toMatchObject({
      phase: "second_leg",
      phaseNumber: 1,
      sourceNumber: 2,
    });
    expect(document.matchdays[0]?.matches[0]).toMatchObject({
      awayClubName: "SV Beutelsbach",
      homeClubName: "SV Hofkirchen 2",
      kickoffAt: "2026-07-24T17:00:00.000Z",
      result: { awayGoals: 2, homeGoals: 1 },
      sourceMarkedChanged: false,
      sourceMatchNumber: "312540001",
    });
    expect(document.matchdays[0]?.matches[1]?.sourceMarkedChanged).toBe(true);
    expect(document.sourceClubNames).toEqual([
      "(SG) Neustift/Sandbach",
      "ASV Ortenburg",
      "SV Beutelsbach",
      "SV Hofkirchen 2",
    ]);
  });

  it("skips a match without a kickoff time and reports it", () => {
    const document = parseBfvSchedulePages([
      `${header}
1. SPIELTAG
312540001 24.07.2026 SV Hofkirchen 2 - SV Beutelsbach
312540002 26.07.2026 15:00 ASV Ortenburg - TSV Muster
`,
    ]);

    expect(document.matchdays[0]?.matches).toHaveLength(1);
    expect(document.warnings).toEqual([
      "Spiel 312540001 hat keine Uhrzeit und wurde übersprungen.",
    ]);
  });

  it("rejects unrelated PDFs and matchdays without importable games", () => {
    expect(() => parseBfvSchedulePages(["Eine andere PDF"])).toThrow(
      "keine unterstützte BFV-Terminliste",
    );
    expect(() =>
      parseBfvSchedulePages([
        `${header}
1. SPIELTAG
312540001 24.07.2026 SPIELFREI - TSV Muster
`,
      ]),
    ).toThrow("enthält keine importierbaren Spiele");
  });
});
