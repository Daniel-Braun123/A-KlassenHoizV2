import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const templates = [
  ["confirmation.html", "{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}"],
  ["recovery.html", "{{ .ConfirmationURL }}"],
] as const;

describe("authentication email templates", () => {
  it.each(templates)("keeps the %s action unique and visible in Gmail", (template, actionUrl) => {
    const html = readFileSync(resolve("supabase/templates", template), "utf8");
    const confirmationUrlOccurrences = html.split(actionUrl).length - 1;

    expect(html).toContain("https://a-klassenhoiz.de/icons/icon-192.png");
    expect(confirmationUrlOccurrences).toBeGreaterThanOrEqual(2);
    expect(html).toContain("Falls der Button nicht funktioniert");
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(
      [...document.querySelectorAll("a")].some(
        (link) => link.textContent?.trim() === actionUrl.replaceAll("&amp;", "&"),
      ),
    ).toBe(true);
  });
});
