// /app/feedback/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    // For now we just open email client
    window.location.href = `mailto:support@neuroquiet.app?subject=NeuroQuiet%20Feedback&body=${encodeURIComponent(
      message
    )}`;
    setSent(true);
  };

  return (
    <main className="info-page">
      <div className="info-card">
        <h1>Send Feedback</h1>
        <p>
          Tell us what works, what doesn’t, and what you would like to see in
          future versions.
        </p>
        <form onSubmit={handleSubmit} className="feedback-form">
          <textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your feedback here…"
          />
          <button className="btn btn-primary" type="submit">
            Send via Email
          </button>
          {sent && (
            <p className="small-note">
              Thank you. Your email client should open now. If it does not,
              please email us directly at{" "}
              <a href="mailto:support@neuroquiet.app">support@neuroquiet.app</a>.
            </p>
          )}
        </form>
        <p>
          <Link href="/">← Back to NeuroQuiet</Link>
        </p>
      </div>
    </main>
  );
}
