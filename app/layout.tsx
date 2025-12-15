// FILE: app/layout.tsx

import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { AuthProvider } from "./AuthProvider";
import JsonLd from "@/components/JsonLd";
import ReviewWidgets from "@/components/ReviewWidgets";

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
    "hearing health app",
  ],

  alternates: {
    canonical: "https://calmtinnitus.com/",
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

const ANDROID_ONLY_CRASH_SCRIPT = `
(function () {
  // Only show this overlay inside Android WebView / Capacitor.
  // (Website remains unchanged.)
  try {
    var ua = navigator.userAgent || '';
    var isWebView = /; wv\\)|\\bwv\\b/i.test(ua) || /Capacitor|Cordova|Android/i.test(ua);
    if (!isWebView) return;
  } catch (e) {}

  function show(title, detail) {
    try {
      var el = document.getElementById('__crash_overlay__');
      if (!el) {
        el = document.createElement('pre');
        el.id = '__crash_overlay__';
        el.style.cssText =
          'position:fixed;inset:0;z-index:2147483647;padding:16px;margin:0;' +
          'background:#fff;color:#111;white-space:pre-wrap;overflow:auto;font:14px/1.4 monospace;';
        document.documentElement.appendChild(el);
      }
      el.textContent = title + "\\n\\n" + detail;
    } catch (e) {}
  }

  window.addEventListener('error', function (e) {
    var msg = (e && e.message) ? e.message : 'Unknown error';
    var src = (e && e.filename) ? e.filename : '';
    var line = (e && e.lineno) ? e.lineno : '';
    var col  = (e && e.colno) ? e.colno : '';
    show('CRASH: window.error', msg + "\\n" + src + ":" + line + ":" + col);
  }, true);

  window.addEventListener('unhandledrejection', function (e) {
    var reason = (e && e.reason)
      ? (e.reason.stack || e.reason.message || String(e.reason))
      : 'Unknown rejection';
    show('CRASH: unhandledrejection', reason);
  });

  // Show boot message in Android WebView only.
  show('Boot', 'Android-only crash handler installed. If the app crashes, the real error will appear here.');
})();
`;

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Android-only crash overlay (website stays clean) */}
        <Script
          id="android-only-crash-overlay"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: ANDROID_ONLY_CRASH_SCRIPT }}
        />

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
        <ReviewWidgets appName="CalmTinnitus" />
      </body>
    </html>
  );
}
