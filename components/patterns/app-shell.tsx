import type { Route } from "next";
import type { ReactNode } from "react";

import { Link } from "@/components/ui/link";

export type AppShellNavigationItem = Readonly<{
  href: Route;
  label: string;
  current?: boolean;
}>;

export type AppShellProps = Readonly<{
  children: ReactNode;
  navigation?: readonly AppShellNavigationItem[];
  utility?: ReactNode;
}>;

export function AppShell({ children, navigation = [], utility }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Zum Inhalt springen
      </a>
      <header className="app-header">
        <div className="app-header__inner">
          <Link aria-label="A-KlassenHoiz Startseite" className="app-brand" href="/">
            <span aria-hidden="true" className="app-brand__mark">
              AH
            </span>
            <span>A-KlassenHoiz</span>
          </Link>
          {utility ? <div className="app-header__utility">{utility}</div> : null}
        </div>
      </header>
      <main className="app-main" id="main-content" tabIndex={-1}>
        {children}
      </main>
      {navigation.length > 0 ? (
        <nav aria-label="Tipprunden-Navigation" className="app-navigation">
          <ul>
            {navigation.map((item) => (
              <li key={item.href}>
                <Link aria-current={item.current ? "page" : undefined} href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
