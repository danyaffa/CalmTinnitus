// FILE: /app/app-store/page.tsx

import Link from "next/link";
import type { Metadata } from "next";

const APP_URL = "https://calmtinnitus.com";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=app.placeholder.calmtinnitus";
const APP_STORE_URL = "https://apps.apple.com/app/id1000000002";

export const metadata: Metadata = {
  title: "Download CalmTinnitus – Android & iOS",
  description:
    "Install the CalmTinnitus app on Android or iOS to access personalised tinnitus sound therapy and relaxation tools.",
  alternates: {
    canonical: `${APP_URL}/app-store`,
  },
};

export default function AppStoreLandingPage() {
  return (
    <main
      style={{
        maxWidth: 560,
        margin: "0 auto",
        textAlign: "center",
        padding: "2.5rem 1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 16 }}>
        Download CalmTinnitus
      </h1>
      <p style={{ color: "#475569", marginBottom: 32 }}>
        Access sound therapy, relaxation, and tinnitus tracking on your phone.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 320,
          margin: "0 auto",
        }}
      >
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            border: "1px solid #cbd5e1",
            padding: "12px 24px",
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: "none",
            color: "#0f172a",
            display: "block",
          }}
        >
          Get it on Google Play
        </a>

        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            border: "1px solid #cbd5e1",
            padding: "12px 24px",
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: "none",
            color: "#0f172a",
            display: "block",
          }}
        >
          Download on the App Store
        </a>
      </div>

      <p style={{ marginTop: 32, fontSize: "0.85rem", color: "#64748b" }}>
        Prefer the web version?{" "}
        <Link href="/" style={{ color: "#0369a1" }}>
          Open CalmTinnitus in your browser
        </Link>
      </p>
    </main>
  );
}
