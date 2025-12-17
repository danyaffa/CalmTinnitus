"use client";

import { useEffect, useRef } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Prevent reload loops
  const didHardReload = useRef(false);

  useEffect(() => {
    console.error("App Router error boundary caught:", error);

    const msg = (error?.message || "").toLowerCase();

    // Detect likely Next.js chunk/hydration failures that often happen in Android WebView
    const looksLikeChunkOrHydration =
      msg.includes("chunkloaderror") ||
      (msg.includes("loading chunk") && msg.includes("failed")) ||
      (msg.includes("failed to fetch") && msg.includes("/_next/")) ||
      msg.includes("hydration") ||
      msg.includes("client-side exception");

    // Hard reload ONCE to break stale HTML/chunk cache mismatch
    if (looksLikeChunkOrHydration && !didHardReload.current) {
      didHardReload.current = true;

      try {
        const key = "ct_hard_reload_once_v1";
        const already = sessionStorage.getItem(key);
        if (!already) {
          sessionStorage.setItem(key, "1");
          setTimeout(() => {
            window.location.reload();
          }, 350);
        }
      } catch {
        // If sessionStorage is blocked for any reason, still try a single reload
        setTimeout(() => {
          window.location.reload();
        }, 350);
      }
    }
  }, [error]);

  return (
    <html>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
          background: "#f5f7fa",
          color: "#111",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <h2 style={{ marginBottom: 12 }}>CalmTinnitus is loading…</h2>

            <p style={{ opacity: 0.75, marginBottom: 20 }}>
              We’re preparing the app environment.
              <br />
              If this takes more than a few seconds, tap below.
            </p>

            <button
              onClick={() => {
                try {
                  sessionStorage.removeItem("ct_hard_reload_once_v1");
                } catch {}
                reset();
              }}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "none",
                background: "#087a93",
                color: "#fff",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
