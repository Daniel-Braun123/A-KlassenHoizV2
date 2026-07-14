import { expect, test } from "@playwright/test";
import { loginAsLocalUser } from "../../helpers/admin";
import { createRoundInvitationFixture } from "../../helpers/fixtures";
import { createLocalActorClient } from "../../helpers/local-actors";
const hash = async (token: string) =>
  "\\x" +
  Buffer.from(await crypto.subtle.digest("SHA-256", Buffer.from(token, "base64url"))).toString(
    "hex",
  );
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
  const newOwner = await memberContext.newPage();
  await loginAsLocalUser(
    newOwner,
    "member@example.test",
    "/rounds/" + fixture.roundId + "/settings",
  );
  await newOwner.getByRole("button", { name: "Entfernen" }).click();
  await expect(newOwner.getByText("Mitglied wurde entfernt.")).toBeVisible();
  await newOwner.getByRole("button", { name: "Jetzt archivieren" }).click();
  await expect(newOwner.getByText("Tipprunde archiviert.")).toBeVisible();
  await newOwner.reload();
  await newOwner.getByRole("button", { name: "Reaktivieren" }).click();
  await expect(newOwner.getByText("Tipprunde reaktiviert.")).toBeVisible();
  await newOwner.reload();
  await newOwner.getByRole("button", { name: "Endgültig löschen" }).click();
  await newOwner.getByLabel(new RegExp(fixture.roundName)).fill(fixture.roundName);
  await newOwner.getByRole("button", { name: "Sofort und endgültig löschen" }).click();
  await newOwner.waitForURL(/\/start$/);
  await expect(newOwner.getByText(fixture.roundName, { exact: true })).toHaveCount(0);
  await ownerContext.close();
  await memberContext.close();
});
