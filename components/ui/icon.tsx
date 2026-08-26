import type { SVGProps } from "react";

export type IconName =
  | "account"
  | "account-circle"
  | "arrow-left"
  | "calendar"
  | "check-circle"
  | "chevron-right"
  | "clock"
  | "lock"
  | "logout"
  | "list"
  | "moon"
  | "overview"
  | "plus"
  | "predictions"
  | "qr"
  | "rankings"
  | "results"
  | "settings"
  | "sun"
  | "system"
  | "table"
  | "trophy"
  | "user";

const paths: Record<IconName, React.ReactNode> = {
  account: (
    <>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.75 19.25c.55-3.05 2.63-4.75 6.25-4.75s5.7 1.7 6.25 4.75" />
    </>
  ),
  "account-circle": (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="9" r="3" />
      <path d="M6 19.75a6 6 0 0 1 12 0" />
    </>
  ),
  "arrow-left": (
    <>
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h10" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M8 3.5v4m8-4v4M3.5 10h17" />
      <path d="M8 13.5h.01m4 0h.01m4 0h.01M8 17h.01m4 0h.01" />
    </>
  ),
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16.5 8.5" />
    </>
  ),
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  logout: (
    <>
      <path d="M14 8V5.75A1.75 1.75 0 0 0 12.25 4h-6.5A1.75 1.75 0 0 0 4 5.75v12.5A1.75 1.75 0 0 0 5.75 20h6.5A1.75 1.75 0 0 0 14 18.25V16" />
      <path d="M10 12h10m-3.5-3.5L20 12l-3.5 3.5" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r=".75" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r=".75" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r=".75" fill="currentColor" stroke="none" />
    </>
  ),
  moon: <path d="M20 15.2A8 8 0 0 1 8.8 4 8.35 8.35 0 1 0 20 15.2Z" />,
  overview: (
    <>
      <path d="m3.5 11 8.5-7 8.5 7" />
      <path d="M5.5 9.5v10h13v-10M9 19.5v-6h6v6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  predictions: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 3 2.2-1.15 3.55h-3.7L9 9.2 12 7Z" />
      <path d="m9 9.2-3.5-.7M15 9.2l3.5-.7m-4.65 4.25 2.1 3.1m-5.8-3.1-2.1 3.1M8.05 15.85 7.5 19m8.45-3.15.55 3" />
    </>
  ),
  qr: (
    <>
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
      <path d="M14.5 14.5h2v2h-2zm4 0h2v6h-2zm-4 4h2v2h-2z" />
    </>
  ),
  rankings: (
    <>
      <path d="M5 20v-6h4v6m2 0V9h4v11m2 0V4h4v16" />
      <path d="M3 20h19" />
    </>
  ),
  results: (
    <>
      <path d="M7 4h12v16H7z" />
      <path d="M4 7V3h12M10 9h6m-6 4h6m-6 4h4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.07A1.7 1.7 0 0 0 8.96 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.07A1.7 1.7 0 0 0 4.6 8.96a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.96 4.6 1.7 1.7 0 0 0 10 3.07V3h4v.07a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.25.62.86 1.03 1.53 1.03H21v4h-.07A1.7 1.7 0 0 0 19.4 15Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </>
  ),
  system: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8m-4-4v4" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 9v11m8-11v11M3 14h18" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v4.5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H4.5v1.5A3.5 3.5 0 0 0 8 11m8-5h3.5v1.5A3.5 3.5 0 0 1 16 11M12 12.5V17m-4 3h8m-6-3h4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 20c.45-3.55 2.62-5.5 6.5-5.5s6.05 1.95 6.5 5.5" />
    </>
  ),
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
