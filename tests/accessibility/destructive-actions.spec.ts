import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginAsLocalUser } from "../helpers/admin";
import { createRoundInvitationFixture } from "../helpers/fixtures";
import { createLocalActorClient } from "../helpers/local-actors";
const hash = async (token: string) =>
  "\\x" +
  Buffer.from(await crypto.subtle.digest("SHA-256", Buffer.from(token, "base64url"))).toString(
    "hex",
  );
async function axe(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
}
test("destructive dialogs and account deletion have accessible focus and warnings", async ({
  page,
}) => {
  const fixture = await createRoundInvitationFixture();
  const member = createLocalActorClient("member@example.test");
  await member.schema("api").rpc("join_round", {
    p_token_hash: await hash(fixture.token),
    p_nickname: "Ziel",
    p_idempotency_key: crypto.randomUUID(),
  });
  await loginAsLocalUser(page, "owner@example.test", "/rounds/" + fixture.roundId + "/settings");
  await page.getByRole("button", { name: "Besitz übertragen" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await axe(page);
  await page.getByRole("button", { name: "Dialog schließen" }).click();
  await page.getByRole("button", { name: "Endgültig löschen" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await axe(page);
  await page.getByRole("button", { name: "Dialog schließen" }).click();
  await page.goto("/profile/delete-account");
  await axe(page);
});
