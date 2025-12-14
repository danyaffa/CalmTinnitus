// FILE: /app/error.tsx
"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[App Error Boundary]", error);
  }, [error]);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h2 style={{ margin: "0 0 8px 0" }}>Something went wrong.</h2>
      <p style={{ margin: "0 0 16px 0", lineHeight: 1.4 }}>
        The app hit a client-side runtime error during startup. Please try again.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #ccc",
          background: "#fff",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Reload
      </button>
    </div>
  );
}
