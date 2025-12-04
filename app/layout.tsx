// FILE: app/layout.tsx

import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import JsonLd from "@/components/JsonLd";
import ReviewWidget from "@/components/ReviewWidget";

export const metadata: Metadata = {
  metadataBase: new URL("https://calmtinnitus.com"),

  // PAGE TITLES
  title: {
    default: "CalmTinnitus | Tinnitus Relief & Neuromodulation App",
    template: "%s | CalmTinnitus",
  },

  // MAIN DESCRIPTION
  description:
    "CalmTinnitus is an AI-guided tinnitus relief and neuromodulation app that helps you match your tinnitus pitch, create sound therapy, and relax with masking sounds like white noise, rain, and ocean waves.",

  // KEYWORDS FOR SEO + AI DISCOVERY
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
    "white noise tinnitus",
    "pink noise tinnitus",
    "brown noise tinnitus",
    "tinnitus frequency match",
    "tinnitus matching tool",
    "hyperacusis relief",
    "hearing health app"
  ],

  alternates: {
    canonical: "https://calmtinnitus.com/",
  },

  // Global indexing for all pages
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  // OPEN GRAPH (FACEBOOK / LINKEDIN / WHATSAPP)
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

  // TWITTER / X CARDS
  twitter: {
    card: "summary_large_image",
    title: "CalmTinnitus | Tinnitus Relief & Neuromodulation App",
    description:
      "AI-guided tinnitus sound therapy, masking and neuromodulation to help reduce the impact of ringing in your ears.",
    images: ["https://calmtinnitus.com/CalmTinnitus-Logo.png"],
  },

  // PWA MANIFEST
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Mobile friendly */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Extra meta for trust + PWA + app stores */}
        <meta name="author" content="CalmTinnitus" />
        <meta name="publisher" content="CalmTinnitus" />
        <meta
          name="medical-disclaimer"
          content="CalmTinnitus does not provide medical diagnosis or emergency care. Always consult a qualified clinician for medical advice."
        />
        <meta name="theme-color" content="#087a93" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>

      <body>
        {/* JSON-LD schema for AI / search */}
        <JsonLd />

        {/* Auth + app content */}
        <AuthProvider>{children}</AuthProvider>

        {/* ⭐ Floating review widget on all pages */}
        <ReviewWidget appName="CalmTinnitus" />
      </body>
    </html>
  );
}
