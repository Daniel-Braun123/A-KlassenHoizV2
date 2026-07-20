const berlinDateFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type MatchdayPeriod = Readonly<{
  id: string;
  startsOn: string;
  endsOn: string;
}>;

function dateParts(value: string): Readonly<{ day: string; month: string; year: string }> {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) throw new RangeError(`Invalid date-only value: ${value}`);
  return { year: match[1]!, month: match[2]!, day: match[3]! };
}

function dayDistance(left: string, right: string): number {
  return Math.abs(Date.parse(`${left}T00:00:00Z`) - Date.parse(`${right}T00:00:00Z`)) / 86_400_000;
}

export function berlinToday(now = new Date()): string {
  return berlinDateFormatter.format(now);
}

export function formatMatchdayPeriod(startsOn: string, endsOn: string): string {
  const start = dateParts(startsOn);
  const end = dateParts(endsOn);
  const shortStartYear = start.year.slice(2);
  const shortEndYear = end.year.slice(2);

  if (startsOn === endsOn) return `${start.day}.${start.month}.${shortStartYear}`;
  if (start.year === end.year && start.month === end.month) {
    return `${start.day}.–${end.day}.${end.month}.${shortEndYear}`;
  }
  if (start.year === end.year) {
    return `${start.day}.${start.month}.–${end.day}.${end.month}.${shortEndYear}`;
  }
  return `${start.day}.${start.month}.${shortStartYear}–${end.day}.${end.month}.${shortEndYear}`;
}

export function formatMatchdayOptionLabel(
  displayName: string,
  startsOn: string,
  endsOn: string,
): string {
  return `${displayName.replace("Spieltag ", "ST ")} · ${formatMatchdayPeriod(startsOn, endsOn)}`;
}

export function periodsOverlap(
  left: Readonly<{ startsOn: string; endsOn: string }>,
  right: Readonly<{ startsOn: string; endsOn: string }>,
): boolean {
  return left.startsOn <= right.endsOn && right.startsOn <= left.endsOn;
}

export function nearestMatchdayId(
  matchdays: readonly MatchdayPeriod[],
  preferredId?: string,
  today = berlinToday(),
): string | undefined {
  if (preferredId && matchdays.some((matchday) => matchday.id === preferredId)) {
    return preferredId;
  }

  return matchdays.toSorted((left, right) => {
    const leftContains = left.startsOn <= today && today <= left.endsOn;
    const rightContains = right.startsOn <= today && today <= right.endsOn;
    const leftDistance = leftContains
      ? 0
      : dayDistance(today, today < left.startsOn ? left.startsOn : left.endsOn);
    const rightDistance = rightContains
      ? 0
      : dayDistance(today, today < right.startsOn ? right.startsOn : right.endsOn);

    if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    if (leftContains && rightContains) {
      const startDistance = dayDistance(today, left.startsOn) - dayDistance(today, right.startsOn);
      if (startDistance !== 0) return startDistance;
    }

    const leftIsUpcoming = left.startsOn > today;
    const rightIsUpcoming = right.startsOn > today;
    if (leftIsUpcoming !== rightIsUpcoming) return leftIsUpcoming ? -1 : 1;
    return left.startsOn.localeCompare(right.startsOn) || left.id.localeCompare(right.id);
  })[0]?.id;
}
