// /app/legal/page.tsx
"use client";

import Link from "next/link";

export default function LegalPage() {
  return (
    <main className="info-page">
      <div className="info-card">
        <h1>Legal Notice</h1>
        <p>
          NeuroQuiet <strong>is not a medical device</strong>. It has not been assessed or
          approved by any health regulator.
        </p>
        <ul>
          <li>We do not guarantee any improvement in tinnitus or sleep.</li>
          <li>
            Use of NeuroQuiet is entirely at your own risk. You remain
            responsible for your own health decisions.
          </li>
          <li>
            Nothing in this app or on our website is a substitute for
            professional medical advice, diagnosis, or treatment.
          </li>
        </ul>
        <p>
          By using NeuroQuiet you agree that Leffler International Investments
          Pty Ltd, its officers, and partners will not be liable for any loss or
          damage arising from its use.
        </p>
        <p>
          <Link href="/">← Back to NeuroQuiet</Link>
        </p>
      </div>
    </main>
  );
}
