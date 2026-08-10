import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const templates = ["confirmation.html", "recovery.html"] as const;

describe("authentication email templates", () => {
  it.each(templates)("keeps the %s action unique and visible in Gmail", (template) => {
    const html = readFileSync(resolve("supabase/templates", template), "utf8");
    const confirmationUrlOccurrences = html.split("{{ .ConfirmationURL }}").length - 1;

    expect(html).toContain("https://a-klassenhoiz.de/icons/icon-192.png");
    expect(confirmationUrlOccurrences).toBeGreaterThanOrEqual(2);
    expect(html).toContain("Falls der Button nicht funktioniert");
    expect(html).toMatch(/>\s*\{\{ \.ConfirmationURL \}\}\s*<\/a>/u);
  });
});
