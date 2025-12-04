// FILE: components/ReviewWidgets.tsx
"use client";

import React, { useState, type CSSProperties } from "react";

type ReviewWidgetProps = {
  appName?: string;
  appStoreUrl?: string; // optional link to app store page
};

const DEFAULT_APP_NAME = "CalmTinnitus";

const pillStyle: CSSProperties = {
  position: "fixed",
  bottom: 24,
  right: 24,
  zIndex: 50,
  background: "#ffffff",
  color: "#0f172a",
  padding: "8px 16px",
  borderRadius: 999,
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
  fontWeight: 600,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  border: "1px solid #e2e8f0",
};

const modalStyle: CSSProperties = {
  position: "fixed",
  bottom: 24,
  right: 24,
  zIndex: 51,
  background: "#020617",
  color: "#e5e7eb",
  padding: 20,
  borderRadius: 16,
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
  width: 320,
  border: "1px solid #1f2937",
};

const starButton: CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
};

const inputBase: CSSProperties = {
  width: "100%",
  borderRadius: 8,
  padding: 8,
  border: "1px solid #1f2937",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: 14,
};

const buttonBase: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14,
};

const ReviewWidgets: React.FC<ReviewWidgetProps> = ({
  appName = DEFAULT_APP_NAME,
  appStoreUrl,
}) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        rating,
        text: comment,
        comment,
        email,
        appName,
      };

      // Call API route to save + email review
      try {
        await fetch("/api/review-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Review submit failed:", err);
      }

      // Optional: send happy users to store
      if (rating >= 4 && appStoreUrl) {
        try {
          window.open(appStoreUrl, "_blank", "noopener,noreferrer");
        } catch {
          // ignore
        }
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setComment("");
        setEmail("");
        setOpen(false);
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  };

  // Closed pill
  if (!open) {
    return (
      <button
        type="button"
        style={pillStyle}
        onClick={() => setOpen(true)}
      >
        <span style={{ color: "#facc15" }}>★★★★★</span>
        <span>Rate {appName}</span>
      </button>
    );
  }

  // Open modal
  return (
    <div style={modalStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16 }}>Rate {appName}</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            background: "transparent",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          ✕
        </button>
      </div>

      {submitted ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{ fontSize: 28 }}>🎉</div>
          <p style={{ marginTop: 8, color: "#4ade80" }}>Thank you!</p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                style={{
                  ...starButton,
                  color: s <= rating ? "#facc15" : "#1f2937",
                }}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            placeholder={`Tell us what you think about ${appName}...`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{
              ...inputBase,
              minHeight: 80,
              marginBottom: 8,
              resize: "none",
            }}
          />

          <input
            type="email"
            placeholder="Email (optional, not public)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputBase, marginBottom: 12 }}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !comment.trim()}
            style={{
              ...buttonBase,
              background: submitting ? "#0ea5e9aa" : "#0ea5e9",
              color: "#0b1120",
              opacity: submitting || !comment.trim() ? 0.8 : 1,
            }}
          >
            {submitting ? "Sending..." : "Submit review"}
          </button>
        </>
      )}
    </div>
  );
};

export default ReviewWidgets;
