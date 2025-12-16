// FILE: /components/ClientCrashReporter.tsx
"use client";

import React, { useEffect, useState } from "react";

export default function ClientCrashReporter() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const text = `${event.message}\n${event.filename}:${event.lineno}:${event.colno}\n${
        event.error?.stack ?? ""
      }`;
      setMsg(text);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason: any = event.reason;
      const text = `Unhandled Promise Rejection:\n${
        reason?.message ?? String(reason)
      }\n${reason?.stack ?? ""}`;
      setMsg(text);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!msg) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 999999,
        padding: 12,
        borderRadius: 12,
        background: "rgba(0,0,0,0.85)",
        color: "white",
        fontSize: 12,
        whiteSpace: "pre-wrap",
        maxHeight: "40vh",
        overflow: "auto",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        Crash details (Android WebView)
      </div>
      {msg}
    </div>
  );
}
