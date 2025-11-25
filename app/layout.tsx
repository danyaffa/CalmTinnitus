// FILE: app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "./AuthProvider";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL("https://calmtinnitus.com"),
  title: {
    default: "CalmTinnitus | Tinnitus Relief & Neuromodulation App",
    template: "%s | CalmTinnitus",
  },
  description:
    "CalmTinnitus is an AI-guided tinnitus relief and neuromodulation app that helps you match your tinnitus pitch, create sound therapy, and relax with masking sounds like white noise, rain, and ocean waves.",
  keywords: [
    "tinnitus",
    "tinnitus relief",
    "tinnitus treatment",
    "tinnitus cure",
    "stop ringing in ears",
    "ringing in the ears",
    "tinnitus masker",
    "tinnitus sound therapy",
    "notch therapy",
    "acoustic neuromodulation",
    "coordinated reset",
    "tinnitus neuromodulation app",
    "CalmTinnitus",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://calmtinnitus.com",
    title: "CalmTinnitus | Tinnitus Relief & Neuromodulation App",
    description:
      "Match your tinnitus pitch, generate neuromodulation therapy and relax with masking sounds. Built by a 50-year tinnitus veteran for real-world relief.",
    siteName: "CalmTinnitus",
    images: [
      {
        url: "https://calmtinnitus.com/CalmTinnitus-Logo.png",
        width: 1200,
        height: 630,
        alt: "CalmTinnitus – Tinnitus Relief & Neuromodulation App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CalmTinnitus | Tinnitus Relief & Neuromodulation App",
    description:
      "AI-guided tinnitus sound therapy, masking and neuromodulation to help reduce the impact of ringing in your ears.",
    images: ["https://calmtinnitus.com/CalmTinnitus-Logo.png"],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Mobile friendly */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {/* JSON-LD schema for AI / search */}
        <JsonLd />
        {/* Auth + app content */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
