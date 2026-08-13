const productionSiteUrl = "https://a-klassenhoiz.de";

function normalizeSiteUrl(value: string | undefined): string {
  const candidate = new URL(value?.trim() || productionSiteUrl);

  if (candidate.protocol !== "http:" && candidate.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS");
  }

  candidate.pathname = "/";
  candidate.search = "";
  candidate.hash = "";
  return candidate.origin;
}

export const siteConfig = {
  name: "A-KlassenHoiz",
  operatorName: "Daniel Braun",
  supportEmail: "danielbr0802@gmail.com",
  title: "Fußball-Tippspiel mit Freunden – kostenlos | A-KlassenHoiz",
  description:
    "Erstelle kostenlos eine private Fußball-Tipprunde, lade Freunde ein und tippt gemeinsam Spiele. Einfach eingerichtet, privat und bis zum Anpfiff flexibel.",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  locale: "de_DE",
  language: "de-DE",
} as const;

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${siteConfig.url}/`).toString();
}
