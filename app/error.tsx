// FILE: app/error.tsx
"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Router error boundary caught:", error);
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
            <h2 style={{ marginBottom: 12 }}>
              CalmTinnitus is loading…
            </h2>

            <p style={{ opacity: 0.75, marginBottom: 20 }}>
              We’re preparing the app environment.  
              If this takes more than a few seconds, tap below.
            </p>

            <button
              onClick={() => reset()}
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
