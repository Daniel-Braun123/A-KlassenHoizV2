"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
export function InvitationQr({ url }: { url: string }) {
  const [source, setSource] = useState<string>();
  useEffect(() => {
    let active = true;
    void import("qrcode")
      .then((module) => module.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: "M" }))
      .then((value) => {
        if (active) setSource(value);
      });
    return () => {
      active = false;
    };
  }, [url]);
  return source ? (
    <Image
      alt="QR-Code für den aktuellen Einladungslink"
      className="invitation-qr"
      height={280}
      src={source}
      unoptimized
      width={280}
    />
  ) : (
    <p role="status">QR-Code wird erzeugt …</p>
  );
}
