// /app/feedback/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../../components/Footer";
import { auth, db, firebaseReady } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError("");

    try {
      if (firebaseReady && db) {
        await addDoc(collection(db, "reviews"), {
          userId: user?.uid || "anonymous",
          rating,
          comment: message.trim(),
          appName: "CalmTinnitus",
          createdAt: serverTimestamp(),
        });
      }
      setSent(true);
    } catch (err) {
      console.error("Feedback submission failed:", err);
      setError("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <main className="info-page">
      <div className="info-card">
        <h1>Send Feedback</h1>
        <p>
          Tell us what works, what doesn{"'"}t, and what you would like to see in
          future versions.
        </p>

        {sent ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "14px 16px", borderRadius: 12, fontWeight: 700, textAlign: "center" as const }}>
            Thank you for your feedback! We appreciate your input.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 28,
                    cursor: "pointer",
                    color: star <= rating ? "#f59e0b" : "#d1d5db",
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your feedback here…"
            />
            {error && <p style={{ color: "#991b1b", fontWeight: 600, fontSize: 14 }}>{error}</p>}
            <button className="btn btn-primary" type="submit">
              Submit Feedback
            </button>
          </form>
        )}

        <p style={{ marginTop: 16 }}>
          Have questions? Visit our <Link href="/qa">AI-powered FAQ</Link>.
        </p>
        <p>
          <Link href="/">← Back to CalmTinnitus</Link>
        </p>
        <Footer variant="minimal" />
      </div>
    </main>
  );
}
