import type { ReactNode } from "react";
import Image from "next/image";

import { Link } from "@/components/ui/link";

export type AppShellProps = Readonly<{
  children: ReactNode;
  utility?: ReactNode;
}>;

export function AppShell({ children, utility }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Zum Inhalt springen
      </a>
      <header className="app-header">
        <div className="app-header__inner">
          <Link aria-label="A-KlassenHoiz Startseite" className="app-brand" href="/">
            <Image
              alt=""
              aria-hidden="true"
              className="app-brand__logo"
              height={40}
              priority
              src="/icons/app-icon.svg"
              width={40}
            />
            <span>A-KlassenHoiz</span>
          </Link>
          {utility ? <div className="app-header__utility">{utility}</div> : null}
        </div>
      </header>
      <main className="app-main" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
