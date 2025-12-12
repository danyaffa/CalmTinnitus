// /app/legal/page.tsx
"use client";

import Link from "next/link";

export default function LegalPage() {
  const lastUpdated = "13 Dec 2025";

  return (
    <main className="info-page">
      <div className="info-card">
        <h1>Legal Notice &amp; Disclaimers</h1>
        <p style={{ opacity: 0.8, marginTop: "-0.25rem" }}>
          Last updated: {lastUpdated}
        </p>

        <h2>1) Important medical disclaimer</h2>
        <p>
          CalmTinnitus is a wellness and audio-based support app. It is{" "}
          <strong>not a medical device</strong> and is{" "}
          <strong>not intended to diagnose, treat, cure, or prevent</strong> any
          disease or medical condition. It has not been evaluated or approved by
          any medical or health regulator.
        </p>
        <ul>
          <li>
            Results vary. We do <strong>not</strong> guarantee improvement in
            tinnitus, sleep, anxiety, stress, or any other outcome.
          </li>
          <li>
            The app provides general information and self-guided tools only and
            is <strong>not</strong> a substitute for professional medical advice,
            diagnosis, or treatment.
          </li>
          <li>
            Always seek the advice of a qualified health professional with any
            questions you may have regarding a medical condition.
          </li>
        </ul>

        <h2>2) Safety warnings</h2>
        <ul>
          <li>
            <strong>Volume:</strong> Keep volume at a safe level. Prolonged
            exposure to loud sound may cause hearing damage.
          </li>
          <li>
            <strong>Do not use while driving/operating machinery:</strong> Do
            not use audio therapies in situations requiring full attention.
          </li>
          <li>
            <strong>Stop if unwell:</strong> If you experience discomfort,
            dizziness, headache, increased tinnitus distress, or any adverse
            effect, stop using the app and seek medical advice.
          </li>
          <li>
            <strong>Children:</strong> If used by minors, it must be under adult
            supervision and with safe volume limits.
          </li>
        </ul>

        <h2>3) Not for emergencies</h2>
        <p>
          CalmTinnitus does not provide emergency services. If you think you may
          have a medical emergency, call your local emergency number
          immediately.
        </p>

        <h2>4) Your responsibilities</h2>
        <p>
          You are responsible for how you use the app and for your health
          decisions. You agree to use CalmTinnitus in a manner consistent with
          all applicable laws, rules, and regulations, and not to misuse,
          disrupt, or attempt to gain unauthorized access to any part of the
          service.
        </p>

        <h2>5) Privacy &amp; data</h2>
        <p>
          Our privacy practices (including what data we collect, why we collect
          it, and how you can request deletion) are described in our{" "}
          <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>
        <p style={{ marginTop: "0.5rem" }}>
          Where the app uses third-party services (for example, analytics,
          crash-reporting, or payment providers), those services may process
          limited technical information needed to operate and secure the app, as
          described in the Privacy Policy.
        </p>

        <h2>6) Intellectual property</h2>
        <p>
          All app content, branding, and software are owned by their respective
          owners and protected by applicable intellectual property laws. You may
          not copy, modify, distribute, sell, or lease any part of CalmTinnitus
          unless you have our written permission.
        </p>

        <h2>7) Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, CalmTinnitus and its owners,
          officers, partners, and suppliers will not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or any loss
          of profits or revenues, whether incurred directly or indirectly, or
          any loss of data, use, goodwill, or other intangible losses, resulting
          from your access to or use of (or inability to access or use) the app.
        </p>
        <p>
          Nothing in this Legal Notice excludes, restricts, or modifies any
          consumer guarantee, right, or remedy that cannot be excluded under
          applicable law. Where liability cannot be excluded, it is limited to
          the maximum extent permitted by law.
        </p>

        <h2>8) Changes</h2>
        <p>
          We may update this Legal Notice from time to time. The “Last updated”
          date above indicates the latest revision. Continued use of the app
          after updates means you accept the revised Legal Notice.
        </p>

        <h2>9) Who we are &amp; contact</h2>
        <p>
          CalmTinnitus is operated by <strong>Leffler International Investments Pty Ltd</strong>{" "}
          (Australia).
        </p>
        <p>
          Contact:{" "}
          <a href="mailto:leffleryd@gmail.com">leffleryd@gmail.com</a>
        </p>

        <p style={{ marginTop: "1.25rem" }}>
          <Link href="/">← Back to CalmTinnitus</Link>
        </p>
      </div>
    </main>
  );
}
