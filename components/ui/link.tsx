import type { UrlObject } from "node:url";

import type { Route } from "next";
import NextLink from "next/link";
import type { ComponentProps, PropsWithChildren } from "react";

import { cn } from "@/lib/ui/cn";

export type LinkProps = PropsWithChildren<
  Omit<ComponentProps<typeof NextLink>, "href"> & {
    href: Route | UrlObject;
  }
> & {
  variant?: "text" | "button";
};

export function Link({ children, className, href, variant = "text", ...props }: LinkProps) {
  return (
    <NextLink className={cn("ui-link", `ui-link--${variant}`, className)} href={href} {...props}>
      {children}
    </NextLink>
  );
}
