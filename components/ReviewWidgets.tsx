// FILE: components/ReviewWidget.tsx

"use client";

import React, { useState } from "react";
import { addReview } from "../lib/firestore";

// App label for this project
const APP_NAME = "CalmTinnitus";

export default function ReviewWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    setLoading(true);
    try {
      // RULE:
      // Only 4★ and 5★ are stored + emailed.
      // 1★, 2★, 3★ are ignored (no upload, no email).
      const shouldUpload = rating >= 4;

      if (shouldUpload) {
        // 1) Save to Firestore
        try {
          await addReview("guest", rating, comment, APP_NAME);
        } catch (err) {
          console.error("addReview failed:", err);
        }

        // 2) Email notification (via API route)
        try {
          await fetch("/api/review-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rating,
              comment,
              text: comment, // extra field for safety
              appName: APP_NAME,
            }),
          });
        } catch (err) {
          console.error("Review email send failed:", err);
        }
      }

      // 3) Always show thank-you confirmation
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setComment("");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Closed state → small floating pill
  if (!isOpen) {
    return (
      <div
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 50,
          background: "white",
          color: "black",
          padding: "8px 16px",
          borderRadius: 999,
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          fontWeight: "bold",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          border: "1px solid #e2e8f0",
        }}
      >
        <span style={{ color: "#eab308" }}>★★★★★</span>
        <span>4.9/5 Reviews</span>
      </div>
    );
  }

  // Opened state → dark modal
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 51,
        background: "#1e293b",
        color: "white",
        padding: 20,
        borderRadius: 16,
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        width: 300,
        border: "1px solid #334155",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16 }}>Rate {APP_NAME}</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ✕
        </button>
      </div>

      {submitted ? (
        <div
          style={{
            color: "#4ade80",
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          Thanks for your feedback!
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              justifyContent: "center",
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: star <= rating ? "#eab308" : "#475569",
                }}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Tell us what you think about ${APP_NAME}...`}
            style={{
              width: "100%",
              height: 80,
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: 8,
              color: "white",
              marginBottom: 12,
              resize: "none",
            }}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              background: "#38bdf8",
              color: "#0f172a",
              fontWeight: "bold",
              border: "none",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Sending..." : "Submit Review"}
          </button>
        </>
      )}
    </div>
  );
}
