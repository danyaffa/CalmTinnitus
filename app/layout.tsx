// FILE: app/layout.tsx

import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  // ✅ FIX: canonical BASE must be www
  metadataBase: new URL("https://www.calmtinnitus.com"),

  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },

  title: {
    default: "CalmTinnitus | Tinnitus Relief & Neuromodulation App",
    template: "%s | CalmTinnitus",
  },

  description:
    "CalmTinnitus is a tinnitus relief and neuromodulation app with 14-day free trial. Match your tinnitus pitch, use CR therapy, standard masking, and sleep support modes with white noise, rain, and ocean waves. Built by a 50-year tinnitus veteran.",

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
    "hearing health app",
    "tinnitus management app",
    "tinnitus sleep support",
    "tinnitus free trial",
    "tinnitus web app",
    "tinnitus relief app free trial",
    "best tinnitus app",
    "tinnitus retraining therapy",
    "tinnitus pitch matching",
  ],

  // ✅ FIX: canonical must match indexed URL
  alternates: {
    canonical: "https://www.calmtinnitus.com/",
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  openGraph: {
    type: "website",
    url: "https://www.calmtinnitus.com",
    title: "CalmTinnitus | Tinnitus Relief & Neuromodulation App",
    description:
      "Match your tinnitus pitch, generate neuromodulation therapy and relax with masking sounds. Built by a 50-year tinnitus veteran for real-world relief.",
    siteName: "CalmTinnitus",
    images: [
      {
        url: "https://www.calmtinnitus.com/CalmTinnitus-Logo.png",
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
    images: ["https://www.calmtinnitus.com/CalmTinnitus-Logo.png"],
  },

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="author" content="Leffler International Investments Pty Ltd" />
        <meta name="publisher" content="Leffler International Investments Pty Ltd" />
        <meta name="copyright" content="Leffler International Investments Pty Ltd" />
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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>

      <body>
        <JsonLd />
        <AuthProvider>{children}</AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
