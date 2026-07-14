const berlinFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type DateTimeParts = Readonly<{
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}>;

function berlinParts(instant: number): DateTimeParts {
  const values = Object.fromEntries(
    berlinFormatter
      .formatToParts(new Date(instant))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  } as DateTimeParts;
}

function offsetAt(instant: number): number {
  const parts = berlinParts(instant);
  return (
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) -
    Math.trunc(instant / 1000) * 1000
  );
}

function sameParts(left: DateTimeParts, right: DateTimeParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute &&
    left.second === right.second
  );
}

export function berlinDateTimeLocalToIso(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/u);
  if (!match) throw new RangeError("Invalid datetime-local value");
  const expected: DateTimeParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };
  const utcGuess = Date.UTC(
    expected.year,
    expected.month - 1,
    expected.day,
    expected.hour,
    expected.minute,
    expected.second,
  );
  const normalized = new Date(utcGuess);
  if (
    normalized.getUTCFullYear() !== expected.year ||
    normalized.getUTCMonth() + 1 !== expected.month ||
    normalized.getUTCDate() !== expected.day ||
    normalized.getUTCHours() !== expected.hour ||
    normalized.getUTCMinutes() !== expected.minute ||
    normalized.getUTCSeconds() !== expected.second
  ) {
    throw new RangeError("Invalid calendar date");
  }

  let instant = utcGuess - offsetAt(utcGuess);
  instant = utcGuess - offsetAt(instant);
  if (!sameParts(berlinParts(instant), expected)) {
    throw new RangeError("Local time does not exist in Europe/Berlin");
  }
  return new Date(instant).toISOString();
}
