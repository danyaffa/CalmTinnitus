// /app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "./AuthProvider";

export const metadata: Metadata = {
  title: "NeuroQuiet - Silence Starts Now",
  description:
    "NeuroQuiet tinnitus neuromodulation therapy by Leffler International Investments Pty Ltd.",
  themeColor: "#087a93",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#087a93" />
        <meta
          name="description"
          content="NeuroQuiet is a prototype tinnitus neuromodulation tool combining Notch Therapy and Coordinated Reset (CR) with simple tracking."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
