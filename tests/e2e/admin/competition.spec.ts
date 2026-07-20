import { expect, test } from "@playwright/test";

import { loginAsLocalAppAdmin } from "../../helpers/admin";

function pastKickoffInput(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Berlin",
    year: "numeric",
  })
    .format(new Date(Date.now() - 2 * 60 * 60 * 1_000))
    .replace(" ", "T");
}

test.describe("mobile global competition administration", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("creates clubs, a league, a matchday, a match and its result", async ({ page }) => {
    test.setTimeout(180_000);
    await loginAsLocalAppAdmin(page);
    const suffix = crypto.randomUUID().slice(0, 7);
    const leagueName = `A-Klasse ${suffix}`;
    const homeName = `Heim ${suffix}`;
    const awayName = `Gast ${suffix}`;
    const kickoff = pastKickoffInput();
    const matchdayDate = kickoff.slice(0, 10);

    await page.getByRole("link", { name: "Vereine", exact: true }).click();
    const clubForm = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Neuer Verein" }) });
    for (const name of [homeName, awayName]) {
      await clubForm.getByLabel("Vereinsname").fill(name);
      await clubForm.getByRole("button", { name: "Verein anlegen" }).click();
      await expect(clubForm.getByRole("status")).toContainText("Verein wurde angelegt");
    }

    await page.getByRole("link", { name: "Ligen", exact: true }).click();
    await page.getByText("Neue Liga anlegen", { exact: true }).click();
    const leagueForm = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Ligadaten" }) });
    await leagueForm.getByLabel("Liganame").fill(leagueName);
    await leagueForm.getByLabel("Jahr").fill("26/27");
    await leagueForm.getByRole("checkbox", { name: homeName }).check();
    await leagueForm.getByRole("checkbox", { name: awayName }).check();
    await leagueForm.getByRole("button", { name: "Liga als Entwurf anlegen" }).click();
    await expect(leagueForm.getByRole("status")).toContainText("Liga wurde als Entwurf angelegt");

    await page.getByRole("link", { name: new RegExp(leagueName) }).click();
    await page.getByRole("button", { name: "Liga veröffentlichen" }).click();
    await expect(page.getByRole("status")).toContainText("Liga ist jetzt für Tipprunden sichtbar");

    await page.getByRole("link", { name: "Spielplan", exact: true }).click();
    const firstLeg = page.locator(".schedule-phase-picker").filter({ hasText: "Hinrunde" });
    await firstLeg.getByLabel("Von").fill(matchdayDate);
    await firstLeg.getByLabel("Bis").fill(matchdayDate);
    await firstLeg.getByRole("button", { name: "Spieltag hinzufügen" }).click();
    await expect(
      firstLeg.getByText("Der nächste Spieltag wurde angelegt.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hinrunde · Spieltag 1" })).toBeVisible();

    const matchForm = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Spiel hinzufügen" }) });
    const homeField = matchForm.locator(".field").filter({ hasText: "Heimverein" });
    await homeField.locator("summary").click();
    await homeField.getByRole("button", { name: homeName }).click();
    const awayField = matchForm.locator(".field").filter({ hasText: "Auswärtsverein" });
    await awayField.locator("summary").click();
    await awayField.getByRole("button", { name: awayName }).click();
    await matchForm.getByLabel("Anpfiff").fill(kickoff);
    await matchForm.getByRole("button", { name: "Spiel anlegen" }).click();
    await expect(matchForm.getByRole("status")).toContainText("Spiel wurde angelegt");
    await expect(
      page.locator(".match-admin-item").filter({ hasText: homeName }).filter({ hasText: awayName }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Ergebnisse", exact: true }).click();
    await page.getByLabel(`Tore ${homeName}`).fill("2");
    await page.getByLabel(`Tore ${awayName}`).fill("1");
    await page.getByRole("button", { name: "Ergebnisse speichern" }).click();
    await expect(page.getByRole("status")).toContainText("1 Ergebnis gespeichert");
  });
});
