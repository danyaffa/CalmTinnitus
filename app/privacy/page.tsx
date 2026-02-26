// /app/privacy/page.tsx
"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="info-page">
      <div className="info-card">
        <h1>Privacy Policy</h1>

        <p>
          This Privacy Policy explains how <strong>CalmTinnitus</strong> handles
          information when you use the app.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account details</strong> (such as email) if you create an
            account.
          </li>
          <li>
            <strong>App usage data you enter</strong> (for example, sessions,
            preferences, or wellbeing tracking you choose to record).
          </li>
          <li>
            <strong>Technical data</strong> required to operate the service
            (e.g., basic device/browser information, error logs).
          </li>
        </ul>

        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell your personal data.</li>
          <li>
            We do not use your data to diagnose medical conditions. The app is
            not a medical device.
          </li>
        </ul>

        <h2>How we use information</h2>
        <ul>
          <li>To provide login and access to the app.</li>
          <li>To save your preferences and session history (if enabled).</li>
          <li>To improve reliability, performance, and safety.</li>
        </ul>

        <h2>Where data is stored</h2>
        <p>
          CalmTinnitus may use secure cloud services (such as authentication and
          database providers) to store the information required to operate the
          app.
        </p>

        <h2>Retention & deletion</h2>
        <p>
          You can request deletion of your account data. Where possible, we will
          remove your personal information from our systems unless we must keep
          certain records for legal, security, or fraud-prevention reasons.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy questions or deletion requests, contact:{" "}
          <strong>leffleryd@gmail.com</strong>
        </p>

        <p style={{ marginTop: 16 }}>
          <Link href="/">← Back to CalmTinnitus</Link>
        </p>
      </div>
    </main>
  );
}
