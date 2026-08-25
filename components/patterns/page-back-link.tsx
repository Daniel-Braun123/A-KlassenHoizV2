import type { Route } from "next";

import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";

type PageBackLinkProps = {
  accessibleLabel: string;
  href: Route;
  label: string;
};

export function PageBackLink({ accessibleLabel, href, label }: PageBackLinkProps) {
  return (
    <nav aria-label="Zurücknavigation" className="page-back-navigation">
      <Link aria-label={accessibleLabel} href={href}>
        <Icon name="arrow-left" />
        <span>{label}</span>
      </Link>
    </nav>
  );
}
