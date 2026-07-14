import { expect, test } from "@playwright/test";
import { loginAsLocalAppAdmin } from "../../helpers/admin";

test.describe("mobile global competition administration", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("creates and publishes the central competition through a result revision", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await loginAsLocalAppAdmin(page);
    const suffix = crypto.randomUUID().slice(0, 7);
    const leagueName = `A-Klasse ${suffix}`;
    const seasonLabel = `S-${suffix}`;
    const leagueForm = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Neue Liga" }) });
    await leagueForm.locator('input[name="name"]').fill(leagueName);
    await leagueForm.getByLabel("Kurzname").fill(`AK${suffix}`);
    await leagueForm.getByRole("button", { name: "Liga anlegen" }).click();
    await expect(leagueForm.getByRole("status")).toContainText("Liga wurde angelegt");

    const seasonForm = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Neue Saison" }) });
    await seasonForm.getByLabel("Bezeichnung").fill(seasonLabel);
    await seasonForm.getByLabel("Startdatum").fill("2026-07-01");
    await seasonForm.getByLabel("Enddatum").fill("2027-06-30");
    await seasonForm.getByRole("button", { name: "Saison anlegen" }).click();
    await expect(seasonForm.getByRole("status")).toContainText("Saison wurde angelegt");

    const connectForm = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Liga-Saison verbinden" }) });
    await connectForm.getByLabel("Liga").selectOption({ label: leagueName });
    await connectForm.getByLabel("Saison").selectOption({ label: seasonLabel });
    await connectForm.getByRole("button", { name: "Verbinden" }).click();
    await expect(connectForm.getByRole("status")).toContainText("Liga-Saison wurde verbunden");

    const transitionForm = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Status fortschreiben" }) });
    await transitionForm
      .getByLabel("Liga-Saison")
      .selectOption({ label: `${leagueName} · ${seasonLabel} (draft)` });
    await transitionForm.getByLabel("Gelesene Version").fill("1");
    await transitionForm.getByRole("button", { name: "Status ändern" }).click();
    await expect(transitionForm.getByRole("status")).toContainText("Status wurde sicher geändert");

    await page.getByRole("link", { name: "Vereine" }).click();
    for (const [name, shortName] of [
      [`Heim ${suffix}`, `H${suffix}`],
      [`Gast ${suffix}`, `G${suffix}`],
    ] as const) {
      const createClub = page
        .locator("form")
        .filter({ has: page.getByRole("heading", { name: "Neuer Verein" }) });
      await createClub.getByLabel("Vereinsname").fill(name);
      await createClub.getByLabel("Kurzname").fill(shortName);
      await createClub.getByRole("button", { name: "Verein anlegen" }).click();
      await expect(createClub.getByRole("status")).toContainText("Verein wurde angelegt");
    }
    const assign = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Verein zuordnen" }) });
    for (const name of [`Heim ${suffix}`, `Gast ${suffix}`]) {
      await assign
        .getByLabel("Liga-Saison")
        .selectOption({ label: `${leagueName} · ${seasonLabel}` });
      await assign.getByLabel("Verein").selectOption({ label: name });
      await assign.getByRole("button", { name: "Zuordnen" }).click();
      await expect(assign.getByRole("status")).toContainText("Verein wurde zugeordnet");
    }

    await page.getByRole("link", { name: "Spielplan" }).click();
    const matchday = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Spieltag anlegen" }) });
    await matchday
      .getByLabel("Liga-Saison")
      .selectOption({ label: `${leagueName} · ${seasonLabel}` });
    await matchday.getByLabel("Nummer").fill("1");
    await matchday.getByLabel("Anzeigename").fill(`Auftakt ${suffix}`);
    await matchday.getByRole("button", { name: "Spieltag anlegen" }).click();
    await expect(
      page
        .locator(".inline-editor")
        .filter({ has: page.locator(`input[value="Auftakt ${suffix}"]`) }),
    ).toBeVisible();

    const match = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Spiel anlegen" }) });
    await match.getByLabel("Spieltag").selectOption({ label: `Auftakt ${suffix}` });
    await match.getByLabel("Heimverein").selectOption({ label: `Heim ${suffix}` });
    await match.getByLabel("Auswärtsverein").selectOption({ label: `Gast ${suffix}` });
    await match.getByLabel("Anpfiff").fill("2026-08-01T15:00");
    await match.getByRole("button", { name: "Spiel anlegen" }).click();
    await expect(page.getByText(`Heim ${suffix} – Gast ${suffix}`, { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Ergebnisse" }).click();
    const result = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Ergebnis oder Korrektur" }) });
    await result
      .locator('select[name="matchId"]')
      .selectOption({ label: `Heim ${suffix} – Gast ${suffix}` });
    await result.getByLabel("Gelesene Spielversion").fill("1");
    await result.getByLabel(/Gelesene Ergebnisrevision/).fill("0");
    await result.getByLabel("Tore Heim").fill("2");
    await result.getByLabel("Tore Auswärts").fill("1");
    await result.getByRole("button", { name: "Ergebnis und Neuberechnung bestätigen" }).click();
    await expect(
      page.getByText(`Heim ${suffix} 2 : 1 Gast ${suffix}`, { exact: true }),
    ).toBeVisible();
  });
});
