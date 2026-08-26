import { expect, type Page, test } from "@playwright/test";
import { loginAsLocalUser } from "../../helpers/admin";
import { createRoundInvitationFixture } from "../../helpers/fixtures";
import { createLocalActorClient } from "../../helpers/local-actors";
const hash = async (token: string) =>
  "\\x" +
  Buffer.from(await crypto.subtle.digest("SHA-256", Buffer.from(token, "base64url"))).toString(
    "hex",
  );

async function submitServerAction(page: Page, buttonName: string) {
  const responsePromise = page.waitForResponse((response) => {
    const request = response.request();

    return (
      request.method() === "POST" &&
      Boolean(request.headers()["next-action"]) &&
      new URL(response.url()).pathname.endsWith("/settings")
    );
  });

  await page.getByRole("button", { name: buttonName }).click();
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

test("ownership transfer, member removal, archive and hard delete remain owner-only", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const fixture = await createRoundInvitationFixture();
  const memberApi = createLocalActorClient("member@example.test");
  await memberApi.schema("api").rpc("join_round", {
    p_token_hash: await hash(fixture.token),
    p_nickname: "Neuer Besitzer",
    p_idempotency_key: crypto.randomUUID(),
  });
  const ownerContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const owner = await ownerContext.newPage();
  await loginAsLocalUser(owner, "owner@example.test", "/rounds/" + fixture.roundId + "/settings");
  await owner.getByRole("button", { name: "Besitz übertragen" }).click();
  await owner.getByLabel("Neuer Besitzer").selectOption({ label: "Neuer Besitzer" });
  await owner.getByRole("button", { name: "Übertragung bestätigen" }).click();
  await owner.waitForURL("**/rounds/" + fixture.roundId);
  await expect(owner.getByRole("link", { name: "Runde verwalten" })).toHaveCount(0);
  const memberContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  let newOwner = await memberContext.newPage();
  await loginAsLocalUser(
    newOwner,
    "member@example.test",
    "/rounds/" + fixture.roundId + "/settings",
  );
  await submitServerAction(newOwner, "Entfernen");
  newOwner = await reopenCurrentPage(newOwner);
  await expect(newOwner.locator(".member-list > li")).toHaveCount(1);
  await submitServerAction(newOwner, "Jetzt archivieren");
  newOwner = await reopenCurrentPage(newOwner);
  await expect(newOwner.getByRole("button", { name: "Reaktivieren" })).toBeEnabled();
  await submitServerAction(newOwner, "Reaktivieren");
  newOwner = await reopenCurrentPage(newOwner);
  await expect(newOwner.getByRole("button", { name: "Jetzt archivieren" })).toBeEnabled();
  await newOwner.getByRole("button", { name: "Endgültig löschen" }).click();
  await newOwner.getByLabel(new RegExp(fixture.roundName)).fill(fixture.roundName);
  await newOwner.getByRole("button", { name: "Sofort und endgültig löschen" }).click();
  await newOwner.waitForURL(/\/start$/);
  await expect(newOwner.getByText(fixture.roundName, { exact: true })).toHaveCount(0);
  await ownerContext.close();
  await memberContext.close();
});
