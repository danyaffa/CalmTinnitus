"use client";

import React, { useEffect, useState, useCallback } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // iOS Safari — show hint
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as any).MSStream;
      if (isIOS) {
        setShowIOSHint(true);
      }
    }
  }, [deferredPrompt]);

  if (isInstalled) return null;

  return (
    <>
      <button onClick={handleInstall} style={btnStyle}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Install App
      </button>

      {showIOSHint && (
        <div style={iosOverlay} onClick={() => setShowIOSHint(false)}>
          <div style={iosCard} onClick={(e) => e.stopPropagation()}>
            <p style={{ margin: "0 0 .75rem", fontWeight: 700, fontSize: "1.1rem" }}>
              Install CalmTinnitus
            </p>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Tap the <strong>Share</strong> button in Safari, then tap{" "}
              <strong>&quot;Add to Home Screen&quot;</strong> to install CalmTinnitus
              as an app.
            </p>
            <button
              onClick={() => setShowIOSHint(false)}
              style={{
                marginTop: "1rem",
                padding: ".5rem 1.2rem",
                borderRadius: 999,
                border: "none",
                background: "#087a93",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const btnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "0.55rem 1.2rem",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #087a93, #46c0c7)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.9rem",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(8,122,147,.35)",
  whiteSpace: "nowrap",
};

const iosOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,.55)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "1rem",
};

const iosCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: "1.5rem",
  maxWidth: 340,
  width: "100%",
  textAlign: "center",
  boxShadow: "0 20px 50px rgba(0,0,0,.2)",
};
