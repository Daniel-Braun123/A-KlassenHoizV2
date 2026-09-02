import { afterEach, describe, expect, it } from "vitest";

import { clubLogoUrl } from "@/features/competition/club-logo-url";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
});

describe("clubLogoUrl", () => {
  it("bevorzugt ein versioniertes Storage-Logo", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co/";

    expect(
      clubLogoUrl(
        "clubs/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/v2.webp",
        "https://example.test/old.png",
      ),
    ).toBe(
      "https://project.supabase.co/storage/v1/object/public/club-logos/clubs/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/v2.webp",
    );
  });

  it("verwendet eine externe URL als Fallback", () => {
    expect(clubLogoUrl(null, " https://example.test/logo.png ")).toBe(
      "https://example.test/logo.png",
    );
  });

  it("liefert ohne Quelle keinen Bildpfad", () => {
    expect(clubLogoUrl(null, null)).toBeNull();
  });
});
