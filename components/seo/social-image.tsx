import { ImageResponse } from "next/og";

export const socialImageAlt = "A-KlassenHoiz – Fußball-Tippspiel mit Freunden";
export const socialImageSize = { width: 1200, height: 630 } as const;

export function createSocialImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#f7faf7",
        color: "#173b2b",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "flex-start",
          background: "#ffffff",
          border: "3px solid #bed4c3",
          borderRadius: "40px",
          boxShadow: "0 24px 80px rgba(23, 59, 43, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          height: "100%",
          justifyContent: "center",
          padding: "64px 72px",
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: "22px" }}>
          <div
            style={{
              alignItems: "center",
              background: "#006b3c",
              borderRadius: "24px",
              color: "#fff7cf",
              display: "flex",
              fontSize: 62,
              fontWeight: 800,
              height: 112,
              justifyContent: "center",
              position: "relative",
              width: 112,
            }}
          >
            A
            <span
              style={{
                background: "#f2c94c",
                borderRadius: "50%",
                height: 18,
                position: "absolute",
                right: 13,
                top: 13,
                width: 18,
              }}
            />
          </div>
          <span style={{ color: "#006b3c", display: "flex", fontSize: 42, fontWeight: 800 }}>
            A-KlassenHoiz
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <span style={{ display: "flex", fontSize: 68, fontWeight: 800, letterSpacing: "-2px" }}>
            Fußball-Tippspiel
          </span>
          <span style={{ color: "#52675b", display: "flex", fontSize: 44 }}>
            Gemeinsam mit Freunden tippen
          </span>
        </div>
        <div
          style={{
            alignItems: "center",
            background: "#d8f4df",
            borderRadius: "999px",
            color: "#006b3c",
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            height: 60,
            lineHeight: 1,
            padding: "0 26px",
          }}
        >
          Privat · einfach · kostenlos
        </div>
      </div>
    </div>,
    socialImageSize,
  );
}
