import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nesh sample",
  description: "Web Push demo using @piro0919/next-push + Nesh",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8f8f8",
        }}
      >
        {children}
      </body>
    </html>
  );
}
