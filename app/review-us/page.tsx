// /app/review-us/page.tsx
"use client";

import Link from "next/link";

export default function ReviewUsPage() {
  return (
    <main className="info-page">
      <div className="info-card">
        <h1>Review NeuroQuiet</h1>
        <p>
          If NeuroQuiet helps you, we would be grateful if you leave a short
          review. Your feedback guides our future development.
        </p>
        <ul>
          <li>Share how often you used the app.</li>
          <li>Describe any change in how intrusive your tinnitus feels.</li>
          <li>Mention if there were any side-effects or issues.</li>
        </ul>
        <p>
          For now, you can{" "}
          <a href="mailto:support@neuroquiet.app">email your review</a> or share
          it with the person who invited you to test NeuroQuiet.
        </p>
        <p>
          <Link href="/">← Back to NeuroQuiet</Link>
        </p>
      </div>
    </main>
  );
}
