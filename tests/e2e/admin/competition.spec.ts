import { expect, type Locator, type Page, test } from "@playwright/test";

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

async function submitServerAction(page: Page, trigger: Locator) {
  const responsePromise = page.waitForResponse((response) => {
    const request = response.request();
    return request.method() === "POST" && Boolean(request.headers()["next-action"]);
  });

  await trigger.click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
}

async function reopenCurrentPage(page: Page) {
  const url = page.url();
  const replacement = await page.context().newPage();

  await replacement.goto(url);
  await page.close();

  return replacement;
}

test.describe("mobile global competition administration", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("creates clubs, a league, a matchday, a match and its result", async ({ page }) => {
    test.setTimeout(180_000);
    let currentPage = page;
    await loginAsLocalAppAdmin(currentPage);
    const suffix = crypto.randomUUID().slice(0, 7);
    const leagueName = `A-Klasse ${suffix}`;
    const homeName = `Heim ${suffix}`;
    const awayName = `Gast ${suffix}`;
    const kickoff = pastKickoffInput();
    const matchdayDate = kickoff.slice(0, 10);

    await currentPage.getByRole("link", { name: "Vereine", exact: true }).click();
    let clubForm = currentPage
      .locator("form")
      .filter({ has: currentPage.getByRole("heading", { name: "Neuer Verein" }) });
    for (const name of [homeName, awayName]) {
      await clubForm.getByLabel("Vereinsname").fill(name);
      await submitServerAction(
        currentPage,
        clubForm.getByRole("button", { name: "Verein anlegen" }),
      );
      currentPage = await reopenCurrentPage(currentPage);
      await expect(currentPage.getByText(name, { exact: true })).toBeVisible();
      clubForm = currentPage
        .locator("form")
        .filter({ has: currentPage.getByRole("heading", { name: "Neuer Verein" }) });
    }

    await currentPage.getByRole("link", { name: "Ligen", exact: true }).click();
    await currentPage.getByText("Neue Liga anlegen", { exact: true }).click();
    const leagueForm = currentPage
      .locator("form")
      .filter({ has: currentPage.getByRole("heading", { name: "Ligadaten" }) });
    await leagueForm.getByLabel("Liganame").fill(leagueName);
    await leagueForm.getByLabel("Jahr").fill("26/27");
    await leagueForm.getByRole("checkbox", { name: homeName }).check();
    await leagueForm.getByRole("checkbox", { name: awayName }).check();
    await submitServerAction(
      currentPage,
      leagueForm.getByRole("button", { name: "Liga als Entwurf anlegen" }),
    );
    currentPage = await reopenCurrentPage(currentPage);

    await currentPage.getByRole("link", { name: new RegExp(leagueName) }).click();
    await submitServerAction(
      currentPage,
      currentPage.getByRole("button", { name: "Liga veröffentlichen" }),
    );
    currentPage = await reopenCurrentPage(currentPage);
    await expect(currentPage.getByText("Veröffentlicht", { exact: true })).toBeVisible();

    await currentPage.getByRole("link", { name: "Spielplan", exact: true }).click();
    const firstLeg = currentPage.locator(".schedule-phase-picker").filter({ hasText: "Hinrunde" });
    await firstLeg.getByLabel("Von").fill(matchdayDate);
    await firstLeg.getByLabel("Bis").fill(matchdayDate);
    await submitServerAction(
      currentPage,
      firstLeg.getByRole("button", { name: "Spieltag hinzufügen" }),
    );
    currentPage = await reopenCurrentPage(currentPage);
    await expect(currentPage.getByRole("heading", { name: "Hinrunde · Spieltag 1" })).toBeVisible();

    const matchForm = currentPage
      .locator("form")
      .filter({ has: currentPage.getByRole("heading", { name: "Spiel hinzufügen" }) });
    const homeField = matchForm.locator(".field").filter({ hasText: "Heimverein" });
    await homeField.locator("summary").click();
    await homeField.getByRole("button", { name: homeName }).click();
    const awayField = matchForm.locator(".field").filter({ hasText: "Auswärtsverein" });
    await awayField.locator("summary").click();
    await awayField.getByRole("button", { name: awayName }).click();
    await matchForm.getByLabel("Anpfiff").fill(kickoff);
    await submitServerAction(currentPage, matchForm.getByRole("button", { name: "Spiel anlegen" }));
    currentPage = await reopenCurrentPage(currentPage);
    await expect(
      currentPage
        .locator(".match-admin-item")
        .filter({ hasText: homeName })
        .filter({ hasText: awayName }),
    ).toBeVisible();

    await currentPage.getByRole("link", { name: "Ergebnisse", exact: true }).click();
    await currentPage.getByLabel(`Tore ${homeName}`).fill("2");
    await currentPage.getByLabel(`Tore ${awayName}`).fill("1");
    await submitServerAction(
      currentPage,
      currentPage.getByRole("button", { name: "Ergebnisse speichern" }),
    );
    currentPage = await reopenCurrentPage(currentPage);
    await expect(currentPage.getByLabel(`Tore ${homeName}`)).toHaveValue("2");
    await expect(currentPage.getByLabel(`Tore ${awayName}`)).toHaveValue("1");
  });
});
