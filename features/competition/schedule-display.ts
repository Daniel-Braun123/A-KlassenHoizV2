const berlinDateKeyFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const berlinDateLabelFormatter = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const berlinTimeLabelFormatter = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function berlinDateKey(value: string | Date): string {
  return berlinDateKeyFormatter.format(new Date(value));
}

export function berlinDateLabel(value: string | Date): string {
  return berlinDateLabelFormatter.format(new Date(value));
}

export function berlinTimeLabel(value: string | Date): string {
  return `${berlinTimeLabelFormatter.format(new Date(value))} Uhr`;
}

export function defaultKickoffInputValue(date: string | Date = new Date()): string {
  const dateKey =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(date) ? date : berlinDateKey(date);
  return `${dateKey}T15:00`;
}
