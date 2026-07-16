"use client";

import { useState } from "react";

import { cn } from "@/lib/ui/cn";

function clubInitials(name: string | null): string {
  return (name ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ClubLogo({
  className,
  logoUrl,
  name,
  size = 32,
}: Readonly<{
  className?: string;
  logoUrl: string | null;
  name: string | null;
  size?: number;
}>) {
  const [failed, setFailed] = useState(false);

  if (!logoUrl || failed) {
    return (
      <span className={cn("club-logo", "club-logo--fallback", className)} aria-hidden="true">
        {clubInitials(name)}
      </span>
    );
  }

  return (
    // Der Vereinsname steht als zugänglicher Text direkt neben dem dekorativen Logo.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className={cn("club-logo", className)}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      src={logoUrl}
      width={size}
    />
  );
}
