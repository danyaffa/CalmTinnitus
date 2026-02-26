// /app/company-policy/page.tsx
"use client";

import Link from "next/link";

export default function CompanyPolicyPage() {
  return (
    <main className="info-page">
      <div className="info-card">
        <h1>Company Policy</h1>

        <p>
          CalmTinnitus is operated by{" "}
          <strong>Leffler International Investments Pty Ltd</strong>.
        </p>

        <p>Key points:</p>

        <ul>
          <li>The service is provided “as is” without performance guarantees.</li>
          <li>
            We may change, pause, or discontinue the app at any time as we
            continue development.
          </li>
          <li>
            We only collect minimal information required to operate your account
            and sync sessions.
          </li>
        </ul>

        <p>
          <Link href="/">← Back to CalmTinnitus</Link>
        </p>
      </div>
    </main>
  );
}
