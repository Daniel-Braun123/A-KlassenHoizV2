const sensitiveKeyPattern =
  /(email|password|secret|token|cookie|authorization|prediction|tip|round.?name|nickname)/i;
const emailPattern = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g;
const jwtPattern = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const secretPattern = /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{12,}\b/g;

const redacted = "[REDACTED]";

function redactString(value: string): string {
  return value
    .replace(emailPattern, redacted)
    .replace(jwtPattern, redacted)
    .replace(secretPattern, redacted);
}

export function redactUnknown(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return "[MAX_DEPTH]";
  }

  if (typeof value === "string") {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((entry) => redactUnknown(entry, depth + 1));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sensitiveKeyPattern.test(key) ? redacted : redactUnknown(entry, depth + 1),
      ]),
    );
  }

  return value;
}
