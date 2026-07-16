import type { SVGProps } from "react";

export type IconName =
  | "account"
  | "chevron-right"
  | "logout"
  | "moon"
  | "overview"
  | "plus"
  | "predictions"
  | "rankings"
  | "results"
  | "settings"
  | "sun"
  | "system"
  | "user";

const paths: Record<IconName, React.ReactNode> = {
  account: (
    <>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.75 19.25c.55-3.05 2.63-4.75 6.25-4.75s5.7 1.7 6.25 4.75" />
    </>
  ),
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  logout: (
    <>
      <path d="M14 8V5.75A1.75 1.75 0 0 0 12.25 4h-6.5A1.75 1.75 0 0 0 4 5.75v12.5A1.75 1.75 0 0 0 5.75 20h6.5A1.75 1.75 0 0 0 14 18.25V16" />
      <path d="M10 12h10m-3.5-3.5L20 12l-3.5 3.5" />
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
      <path d="M4 19.5h4l10.8-10.8a2.12 2.12 0 0 0-3-3L5 16.5l-1 3Z" />
      <path d="m14.5 7 2.5 2.5" />
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
