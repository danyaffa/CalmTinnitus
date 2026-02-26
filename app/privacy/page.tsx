// FILE: app/privacy/page.tsx
"use client";

import Link from "next/link";
import Footer from "../../components/Footer";

export default function PrivacyPage() {
  return (
    <main className="info-page">
      <div className="info-card">
        <h1>Privacy Policy</h1>

        <p>
          <strong>CalmTinnitus</strong> is designed to work without collecting or
          storing personal health data. Our goal is to keep the app simple and
          privacy-first.
        </p>

        <h2>What we store</h2>
        <ul>
          <li>
            <strong>We do not store your therapy / session content.</strong>
          </li>
          <li>
            If you create an account, the only information involved is your{" "}
            <strong>login identity</strong> (such as email) handled by the
            authentication provider.
          </li>
        </ul>

        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell your information.</li>
          <li>We do not share your information for advertising.</li>
          <li>We do not store medical or therapy notes about you.</li>
        </ul>

        <h2>Deleting your data</h2>
        <p>
          You can delete your account and related app records at any time from{" "}
          <strong>Account Settings</strong>. Once deleted, your access is
          removed and associated records are deleted.
        </p>

        <h2>Medical disclaimer</h2>
        <p>
          CalmTinnitus is not a medical device and does not provide medical
          diagnosis or treatment. Always consult a qualified clinician for
          medical advice.
        </p>

        <p style={{ marginTop: 18 }}>
          <Link href="/">← Back to Home</Link>
        </p>
        <Footer variant="minimal" />
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
