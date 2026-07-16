export function currentLeagueYearLabel(date = new Date()): string {
  const startYear = date.getFullYear() % 100;
  const endYear = (startYear + 1) % 100;

  return `${String(startYear).padStart(2, "0")}/${String(endYear).padStart(2, "0")}`;
}
