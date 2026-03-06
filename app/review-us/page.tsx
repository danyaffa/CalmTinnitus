// /app/review-us/page.tsx
"use client";

import Link from "next/link";
import Footer from "../../components/Footer";

export default function ReviewUsPage() {
  return (
    <main className="info-page">
      <div className="info-card">
        <h1>Review CalmTinnitus</h1>
        <p>
          If CalmTinnitus helps you, we would be grateful if you leave a short
          review. Your feedback guides our future development.
        </p>
        <ul>
          <li>Share how often you used the app.</li>
          <li>Describe any change in how intrusive your tinnitus feels.</li>
          <li>Mention if there were any side-effects or issues.</li>
        </ul>
        <p>
          You can share your review on our{" "}
          <Link href="/feedback">feedback page</Link>, or share
          it with the person who invited you to try CalmTinnitus.
        </p>
        <p>
          <Link href="/">← Back to CalmTinnitus</Link>
        </p>
        <Footer variant="minimal" />
      </div>
    </main>
  );
}
