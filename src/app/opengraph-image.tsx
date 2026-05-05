import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "Nesh — Web Push, made simple";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "96px",
        background:
          "linear-gradient(135deg, oklch(0.205 0 0) 0%, oklch(0.269 0 0) 50%, oklch(0.205 0 0) 100%)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 36,
          opacity: 0.6,
          letterSpacing: "0.05em",
          marginBottom: 16,
        }}
      >
        nesh.kkweb.io
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 124,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
        }}
      >
        <span>Web Push,</span>
        <span>made simple.</span>
      </div>
      <div
        style={{
          marginTop: 40,
          fontSize: 32,
          opacity: 0.7,
          maxWidth: 900,
          lineHeight: 1.4,
        }}
      >
        A lightweight alternative to OneSignal for Next.js / React projects.
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 64,
          right: 96,
          fontSize: 28,
          opacity: 0.5,
          display: "flex",
          gap: 24,
        }}
      >
        <span>Open source</span>
        <span>·</span>
        <span>MIT</span>
      </div>
    </div>,
    { ...size },
  );
}
