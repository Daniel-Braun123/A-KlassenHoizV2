import "server-only";

import { redactUnknown } from "@/lib/observability/redact";

export type OperationalLogLevel = "info" | "warn" | "error";

export type OperationalLogEvent = Readonly<{
  level: OperationalLogLevel;
  code: string;
  correlationId: string;
  route?: string;
  status?: number;
  durationMs?: number;
  details?: Readonly<Record<string, unknown>>;
}>;

export function writeOperationalLog(event: OperationalLogEvent): void {
  const safeEvent = redactUnknown({
    timestamp: new Date().toISOString(),
    ...event,
  });
  const serialized = JSON.stringify(safeEvent);

  if (event.level === "error") {
    console.error(serialized);
    return;
  }

  if (event.level === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}
