import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Nesh — Web Push, made simple",
  description:
    "A lightweight Web Push SaaS for Next.js / React projects. The hosted alternative to OneSignal — sign up, drop the SDK in, start sending.",
  metadataBase: new URL("https://nesh.kkweb.io"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    title: "Nesh — Web Push, made simple",
    description:
      "Lightweight Web Push for Next.js / React. Sign up, drop the SDK in, start sending.",
    url: "https://nesh.kkweb.io",
    siteName: "Nesh",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nesh — Web Push, made simple",
    description:
      "Lightweight Web Push for Next.js / React. Sign up, drop the SDK in, start sending.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
