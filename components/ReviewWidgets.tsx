// FILE: /components/ReviewWidgets.tsx
"use client";

import React, { useState, useEffect } from "react";
import { db, collection, addDoc, serverTimestamp } from "../lib/firebase";

export type ReviewWidgetProps = {
  appName?: string;
  appStoreUrl?: string;
  feedbackEndpoint?: string;
  onFeedbackSubmitted?: () => void;
  primaryColor?: string;
  toEmail?: string;
  forceOpen?: boolean; // ✅ NEW: Allows you to open it programmatically
};

export const ReviewWidget: React.FC<ReviewWidgetProps> = ({
  appName = "CalmTinnitus",
  appStoreUrl,
  feedbackEndpoint,
  onFeedbackSubmitted,
  primaryColor = "#2563eb",
  toEmail = "leffleryd@gmail.com",
  forceOpen = false, // ✅ Default to closed
}) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // ✅ Force correct endpoint
  const FINAL_ENDPOINT = "/api/review-feedback";

  // ✅ WATCH FOR FORCE OPEN (The "Happy Moment" Trigger)
  useEffect(() => {
    if (forceOpen && !submitted) {
      setOpen(true);
    }
  }, [forceOpen, submitted]);

  // Auto-close popup after submit
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => setOpen(false), 3000);
    return () => clearTimeout(timer);
  }, [submitted]);

  const handleSubmit = async () => {
    if (!rating) return;
    const ownerEmail = toEmail || "leffleryd@gmail.com";

    // 1. Firestore Save
    if (db) {
      try {
        await addDoc(collection(db, "reviews"), {
          appName,
          rating,
          comment,
          email,
          ownerEmail,
          createdAt: serverTimestamp(),
          source: "calmtinnitus-widget",
        });
      } catch (e) {
        console.warn("Firestore save failed:", e);
      }
    }

    // 2. Email Send
    try {
      const res = await fetch(FINAL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment,
          email,
          appName,
          toEmail: ownerEmail,
        }),
      });

      if (!res.ok) throw new Error("Email failed");

      setSubmitted(true);
      setRating(null);
      setComment("");
      setEmail("");
      onFeedbackSubmitted?.();
    } catch (err) {
      console.error(err);
      alert("Failed to send feedback.");
    }
  };

  // Styles
  const styles = {
    wrapper: { position: "fixed", right: 20, bottom: 20, zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "flex-end", fontFamily: "sans-serif" } as React.CSSProperties,
    btn: { padding: "10px 20px", borderRadius: 999, border: "none", background: primaryColor, color: "#fff", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" } as React.CSSProperties,
    panel: { marginBottom: 15, width: 300, padding: 20, borderRadius: 16, background: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.25)", border: "1px solid #f3f4f6" } as React.CSSProperties,
    input: { width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", marginTop: 10, fontSize: 14 } as React.CSSProperties,
    submit: { width: "100%", marginTop: 12, padding: 10, borderRadius: 8, border: "none", background: rating ? primaryColor : "#cbd5e1", color: "#fff", fontWeight: "bold", cursor: rating ? "pointer" : "default" } as React.CSSProperties
  };

  if (typeof window === "undefined") return null;

  return (
    <div style={styles.wrapper}>
      {open && (
        <div style={styles.panel}>
          {!submitted ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <strong style={{ color: "#1e293b" }}>Rate {appName}</strong>
                <button onClick={() => setOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8" }}>✕</button>
              </div>
              
              <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} style={{ border: "none", background: "none", fontSize: 28, cursor: "pointer", color: rating && s <= rating ? "#facc15" : "#e2e8f0" }}>★</button>
                ))}
              </div>

              <textarea placeholder="Your thoughts..." value={comment} onChange={(e) => setComment(e.target.value)} style={{ ...styles.input, minHeight: 70 }} />
              <input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />

              <button onClick={handleSubmit} disabled={!rating} style={styles.submit}>Send Feedback</button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 32 }}>🎉</div>
              <h4 style={{ margin: "10px 0 5px", color: "#16a34a" }}>Thank You!</h4>
              <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Feedback received.</p>
            </div>
          )}
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={styles.btn}>
        ⭐ Rate {appName}
      </button>
    </div>
  );
};
