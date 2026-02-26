// FILE: app/privacy/page.tsx
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
            <strong>Account details</strong> (such as email) if you register or
            log in.
          </li>
          <li>
            <strong>Information you enter</strong> (such as preferences,
            sessions, or wellbeing tracking you choose to record).
          </li>
          <li>
            <strong>Technical data</strong> required to operate the service
            (basic device/browser info, error logs).
          </li>
        </ul>

        <h2>How we use information</h2>
        <ul>
          <li>To provide login and app access.</li>
          <li>To save your preferences and session history (if enabled).</li>
          <li>To maintain security and improve reliability.</li>
        </ul>

        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell your personal information.</li>
          <li>
            We do not use your data to diagnose medical conditions. CalmTinnitus
            is not a medical device.
          </li>
        </ul>

        <h2>Data retention & deletion</h2>
        <p>
          You may request deletion of your account data. Where possible, we will
          remove your personal information from our systems unless we must keep
          certain records for legal, security, or fraud-prevention reasons.
        </p>

        <p style={{ marginTop: 18 }}>
          <Link href="/">← Back to Home</Link>
        </p>
      </div>

      <style jsx>{`
        .info-page {
          max-width: 920px;
          margin: 0 auto;
          padding: 1.25rem 1rem 2.5rem;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .info-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 1.25rem;
          padding: 1.25rem 1.25rem;
          box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
          color: #0f172a;
        }

        h1 {
          margin-top: 0;
        }

        h2 {
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          font-size: 1.05rem;
        }

        ul {
          margin: 0.25rem 0 0.5rem;
          padding-left: 1.2rem;
          line-height: 1.55;
        }

        li + li {
          margin-top: 0.35rem;
        }
      `}</style>
    </main>
  );
}
