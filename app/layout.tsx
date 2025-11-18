// /app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroQuiet – Train your brain toward quieter days",
  description:
    "Prototype sound-based neuromodulation tool for tinnitus sufferers. Train your brain toward quieter days with gentle sound sessions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA manifest & theme */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />

        {/* Icons */}
        <link
          rel="icon"
          href="/icons/icon-192x192.png"
          sizes="192x192"
          type="image/png"
        />
        <link
          rel="apple-touch-icon"
          href="/icons/icon-192x192.png"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
