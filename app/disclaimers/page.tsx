// /app/disclaimers/page.tsx
"use client";

import Link from "next/link";
import Footer from "../../components/Footer";

export default function DisclaimersPage() {
  return (
    <main className="info-page">
      <div className="info-card">
        <h1>Disclaimers</h1>
        <ul>
          <li>
            CalmTinnitus is a <strong>self-help sound tool for tinnitus sufferers</strong> and is provided for informational and wellness-support purposes only. It does not diagnose, treat, cure, or prevent any disease and does not replace professional medical care.
          </li>
          <li>
            No outcome, relief, or benefit is promised or implied. Results vary between individuals.
          </li>
          <li>
            If symptoms worsen, stop using the app and consult a qualified health professional.
          </li>
          <li>
            High volume can damage hearing — always keep volume low and comfortable.
          </li>
        </ul>
        <p>
          <Link href="/">← Back to CalmTinnitus</Link>
        </p>
        <Footer variant="minimal" />
      </div>
    </main>
  );
}
