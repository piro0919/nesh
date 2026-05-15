import { ImageResponse } from "next/og";

export const alt = "Nesh — Web Push, made simple";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const violet = "#7c3aed";
const violetSoft = "rgba(124, 58, 237, 0.18)";
const bg = "#0a0a0a";
const fg = "#fafafa";
const muted = "rgba(250, 250, 250, 0.65)";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background: `radial-gradient(circle at 85% 20%, ${violetSoft} 0%, transparent 55%), radial-gradient(circle at 10% 90%, ${violetSoft} 0%, transparent 50%), ${bg}`,
        color: fg,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: violet,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: fg,
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          n
        </div>
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.5 }}>nesh.kkweb.io</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 112,
            fontWeight: 800,
            letterSpacing: -4,
            lineHeight: 1.02,
          }}
        >
          <span>Web Push,</span>
          <span>made simple.</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 36,
            color: muted,
            letterSpacing: -0.5,
            lineHeight: 1.25,
          }}
        >
          <span>A lightweight alternative to OneSignal</span>
          <span>for Next.js / React projects.</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 22,
          color: muted,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 9999,
              background: violet,
            }}
          />
          Open source · MIT
        </div>
        <div>nesh.kkweb.io</div>
      </div>
    </div>,
    size,
  );
}
