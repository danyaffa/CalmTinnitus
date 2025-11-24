// FILE: app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "./AuthProvider";
// ✅ FIXED: Relative path to components inside app folder
import JsonLd from "./components/JsonLd"; 

export const metadata: Metadata = {
  title: {
    default: "CalmTinnitus | #1 Tinnitus Relief & Neuromodulation App",
    template: "%s | CalmTinnitus",
  },
  description:
    "Stop the ringing. CalmTinnitus uses clinically backed neuromodulation therapy to reduce tinnitus frequency. Created by a 50-year tinnitus veteran.",
  keywords: [
    "tinnitus cure",
    "stop ear ringing",
    "neuromodulation therapy",
    "tinnitus relief app",
    "white noise for tinnitus",
    "sound therapy",
    "CalmTinnitus",
  ],
  authors: [{ name: "CalmTinnitus Team" }],
  creator: "CalmTinnitus",
  publisher: "CalmTinnitus",
  metadataBase: new URL("https://calmtinnitus.com"),
  alternates: {
    canonical: "https://calmtinnitus.com",
  },
  verification: {
    google: "1-hMw5VR5fPWM2BohUpP3BBUCgc3f_tuqvOjuV2Fnl0",
    other: {
      "msvalidate.01": "1A5F9E495867B41926D6E2C113347122",
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Find Quiet with CalmTinnitus",
    description:
      "The AI-powered therapy app to reduce ear ringing naturally. Safe daily training.",
    url: "https://calmtinnitus.com",
    siteName: "CalmTinnitus",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CalmTinnitus App Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CalmTinnitus - Tinnitus Relief App",
    description: "Stop the ringing with AI-powered sound therapy.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  themeColor: "#087a93",
  appleWebApp: {
    capable: true,
    title: "CalmTinnitus",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <JsonLd />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
