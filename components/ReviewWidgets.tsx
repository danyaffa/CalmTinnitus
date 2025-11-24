// FILE: /components/ReviewWidgets.tsx
"use client";

import React, { useState, useEffect } from "react";

// ✅ FIREBASE IMPORTS
import { db } from "../lib/firebaseClient"; // make sure this path is correct in your project
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type ReviewWidgetProps = {
  appName: string;
  appStoreUrl?: string;
  feedbackEndpoint?: string;
  onFeedbackSubmitted?: () => void;
  primaryColor?: string;
};

export const ReviewWidget: React.FC<ReviewWidgetProps> = ({
  appName,
  appStoreUrl,
  feedbackEndpoint = "/api/review-feedback",
  onFeedbackSubmitted,
  primaryColor = "#2563eb",
}) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState(""); // optional input for Firestore
  const [submitted, setSubmitted] = useState(false);

  // Auto-close popup after submit
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => setOpen(false), 3000);
    return () => clearTimeout(timer);
  }, [submitted]);

  // MAIN SUBMISSION HANDLER
  const handleSubmit = async () => {
    if (!rating) return;

    try {
      // 1️⃣ SAVE TO FIRESTORE
      await addDoc(collection(db, "reviews"), {
        appName: appName || "AI Business Launcher",
        rating,
        comment,
        email,
        createdAt: serverTimestamp(),
        source: "dashboard-widget",
      });

      // 2️⃣ SEND EMAIL
      await fetch(feedbackEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment,
          email,
          appName,
        }),
      });

      // 3️⃣ DONE
      setSubmitted(true);
      setRating(null);
      setComment("");
      setEmail("");

      onFeedbackSubmitted?.();
    } catch (err) {
      console.error("ReviewWidget submission error", err);
    }
  };

  // --------------------
  // UI STYLES
  // --------------------

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    right: 20,
    bottom: 150,
    zIndex: 60,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    maxWidth: 320,
  };

  const pillButtonStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
    background: primaryColor,
    boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  };

  const panelStyle: React.CSSProperties = {
    marginTop: 8,
    background: "#0f172a",
    color: "#e5e7eb",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 18px 40px rgba(0,0,0,0.4)",
    width: 320,
    maxWidth: "90vw",
    fontSize: 13,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#bfdbfe",
    marginBottom: 4,
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 60,
    borderRadius: 10,
    border: "1px solid #334155",
    padding: 8,
    fontSize: 12,
    background: "#020617",
    color: "#e5e7eb",
  };

  const starButtonStyle = (star: number): React.CSSProperties => ({
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
    border: "none",
    background: "transparent",
    padding: 0,
    margin: "0 2px",
    color: rating && star <= rating ? "#fbbf24" : "#64748b",
  });

  if (typeof window === "undefined") return null;

  // --------------------
  // RENDER
  // --------------------

  return (
    <div style={containerStyle}>
      <button
        type="button"
        style={pillButtonStyle}
        onClick={() => setOpen((o) => !o)}
      >
        ⭐ Rate AI Business Launcher
      </button>

      {open && (
        <div style={panelStyle}>
          {!submitted ? (
            <>
              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: "#f9fafb",
                  }}
                >
                  How is {appName} working for you?
                </div>

                <button
                  onClick={() => setOpen(false)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#9ca3af",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* STARS */}
              <div style={{ marginBottom: 10 }}>
                <span style={labelStyle}>Quick rating</span>
                <div>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      style={starButtonStyle(star)}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* COMMENT */}
              <div style={{ marginBottom: 10 }}>
                <div style={labelStyle}>Anything we can improve?</div>
                <textarea
                  style={textareaStyle}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="This helps us make AI Business Launcher better for you."
                />
              </div>

              {/* EMAIL (optional) */}
              <div style={{ marginBottom: 10 }}>
                <div style={labelStyle}>Your email (optional)</div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    border: "1px solid #334155",
                    padding: 8,
                    fontSize: 12,
                    background: "#020617",
                    color: "#e5e7eb",
                  }}
                  placeholder="So we can follow up if needed."
                />
              </div>

              {/* ACTION BUTTONS */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!rating}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "none",
                    cursor: rating ? "pointer" : "default",
                    fontSize: 12,
                    fontWeight: 700,
                    backgroundColor: rating ? "#22c55e" : "#4b5563",
                    color: "#0f172a",
                  }}
                >
                  Send feedback
                </button>

                {appStoreUrl && (
                  <a
                    href={appStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 11,
                      color: "#93c5fd",
                      textDecoration: "underline",
                    }}
                  >
                    Leave a public review ⭐
                  </a>
                )}
              </div>
            </>
          ) : (
            // THANK YOU SCREEN
            <div style={{ fontSize: 13 }}>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 6,
                  color: "#bbf7d0",
                }}
              >
                Thank you!
              </div>
              <p style={{ margin: 0, marginBottom: 8 }}>
                Your feedback helps us improve <strong>{appName}</strong>.
              </p>
              {appStoreUrl && (
                <p style={{ margin: 0, fontSize: 12 }}>
                  Want to help even more?{" "}
                  <a
                    href={appStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#93c5fd", textDecoration: "underline" }}
                  >
                    Leave a quick public review ⭐
                  </a>
                  .
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
