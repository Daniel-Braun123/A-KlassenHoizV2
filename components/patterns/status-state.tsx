import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

export type StatusKind = "loading" | "empty" | "error" | "locked" | "success" | "offline";

const symbols: Readonly<Record<StatusKind, string>> = {
  loading: "…",
  empty: "○",
  error: "!",
  locked: "—",
  success: "✓",
  offline: "↯",
};

export type StatusStateProps = Readonly<{
  kind: StatusKind;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}>;

export function StatusState({
  action,
  compact = false,
  description,
  kind,
  title,
}: StatusStateProps) {
  const liveRole = kind === "error" ? "alert" : kind === "loading" ? "status" : undefined;

  return (
    <section
      aria-busy={kind === "loading" || undefined}
      className={cn("status-state", `status-state--${kind}`, compact && "status-state--compact")}
      role={liveRole}
    >
      <span aria-hidden="true" className="status-state__symbol">
        {symbols[kind]}
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        {action ? <div className="status-state__action">{action}</div> : null}
      </div>
    </section>
  );
}
