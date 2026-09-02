"use client";

import { useState } from "react";

import { clubLogoUrl } from "@/features/competition/club-logo-url";
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
  logoPath,
  logoUrl,
  name,
  size = 32,
}: Readonly<{
  className?: string;
  logoPath?: string | null;
  logoUrl: string | null;
  name: string | null;
  size?: number;
}>) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = clubLogoUrl(logoPath, logoUrl);

  if (!source || failedSource === source) {
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
      onError={() => setFailedSource(source)}
      src={source}
      width={size}
    />
  );
}
