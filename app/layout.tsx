// FILE: app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "./AuthProvider";
import JsonLd from "@/components/JsonLd"; // ✅ Import the new Schema component

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
  // ✅ Google & Bing Verification (Moved here for better Next.js support)
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
  // ✅ Optimized for Social Sharing (Facebook/LinkedIn)
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
  // ✅ Optimized for Twitter Cards
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
        {/* Viewport is best handled here in older Next versions, or in metadata export for newer ones. 
            Leaving here for safety based on your setup. */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {/* ✅ Inject JSON-LD for Google Search Results */}
        <JsonLd />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
