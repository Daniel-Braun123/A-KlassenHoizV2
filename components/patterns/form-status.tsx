import type { ReactNode } from "react";
export function FormStatus({
  status,
  children,
}: {
  status: "idle" | "loading" | "success" | "error";
  children: ReactNode;
}) {
  if (status === "idle") return null;
  return (
    <div
      className={`form-status form-status--${status}`}
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      aria-busy={status === "loading" || undefined}
      tabIndex={status === "error" ? -1 : undefined}
    >
      {children}
    </div>
  );
}
