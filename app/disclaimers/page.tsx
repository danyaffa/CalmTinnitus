// /app/disclaimers/page.tsx
"use client";

import Link from "next/link";

export default function DisclaimersPage() {
  return (
    <main className="info-page">
      <div className="info-card">
        <h1>Disclaimers</h1>
        <ul>
          <li>
            NeuroQuiet is a <strong>research prototype</strong> and is provided
            for informational and wellness-support purposes only.
          </li>
          <li>
            No outcome, relief, or benefit is promised or implied. Results vary
            between individuals and some users may feel no change.
          </li>
          <li>
            If you notice any worsening of symptoms, stop using the app and
            consult a qualified health professional.
          </li>
          <li>
            Sound exposure at high volume can damage hearing. Always keep your
            volume low and comfortable.
          </li>
        </ul>
        <p>
          <Link href="/">← Back to NeuroQuiet</Link>
        </p>
      </div>
    </main>
  );
}
