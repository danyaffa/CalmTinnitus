// /app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "./AuthProvider";

export const metadata: Metadata = {
  title: "CalmTinnitus – Train your brain toward quieter days",
  description:
    "A calm, at-home neuromodulation sound tool created by someone who has lived with persistent tinnitus for over 50 years. Safe daily sound training based on tinnitus neuromodulation research.",
  keywords: [
    "tinnitus",
    "tinnitus therapy",
    "tinnitus relief",
    "neuromodulation",
    "sound therapy",
    "tinnitus training",
    "CalmTinnitus"
  ],
  themeColor: "#087a93",
  metadataBase: new URL("https://calmtinnitus.com"),
  alternates: {
    canonical: "https://calmtinnitus.com"
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  openGraph: {
    title: "CalmTinnitus – Train your brain toward quieter days",
    description:
      "At-home sound therapy based on tinnitus neuromodulation research. Safe, simple daily training built by someone who has lived with tinnitus for over 50 years.",
    url: "https://calmtinnitus.com",
    siteName: "CalmTinnitus",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CalmTinnitus"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CalmTinnitus – Tinnitus Relief Companion",
    description:
      "Neuromodulation-based tinnitus sound training. Calm your tinnitus with safe daily sound therapy.",
    images: ["/og-image.png"]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Google Verification */}
        <meta
          name="google-site-verification"
          content="1-hMw5VR5fPWM2BohUpP3BBUCgc3f_tuqvOjuV2Fnl0"
        />

        {/* ✅ Bing / Microsoft Verification */}
        <meta
          name="msvalidate.01"
          content="1A5F9E495867B41926D6E2C113347122"
        />

        {/* Canonical URL */}
        <link rel="canonical" href="https://calmtinnitus.com" />

        {/* PWA + Theme */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#087a93" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon + Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
