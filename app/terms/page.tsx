"use client";

import React, { useMemo } from "react";
import Link from "next/link";

export default function TermsPage() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <main className="terms-page">
      <div className="terms-wrap">
        <h1>Terms of Service</h1>
        <p className="terms-updated">Last updated: {year}</p>

        <section>
          <h2>Overview</h2>
          <p>
            CalmTinnitus™ is a subscription-based digital sound therapy and
            self-help application operated by Leffler International Investments
            Pty Ltd. By accessing or using CalmTinnitus, you agree to be bound by
            these Terms.
          </p>
        </section>

        <section>
          <h2>Subscription & Billing</h2>
          <p>
            CalmTinnitus is billed on a recurring monthly basis unless cancelled.
            Payments are processed securely via Stripe. Pricing, taxes, and
            billing frequency are clearly displayed at checkout.
          </p>
        </section>

        <section>
          <h2>Termination by Us</h2>
          <p>
            We may terminate these Terms (or any part of them), and we may limit,
            suspend, change, or remove your access to any or all CalmTinnitus
            services at any time for any reason.
          </p>
          <p>
            If commercially reasonable, we will take reasonable steps to notify
            you before restricting access. If, in our sole judgment, you fail or
            are suspected of failing to comply with any provision of these Terms,
            we may terminate your access immediately and without notice.
          </p>
        </section>

        <section>
          <h2>Termination by You</h2>
          <p>
            You may terminate your subscription at any time and for any reason
            by cancelling your subscription or closing your account.
            Termination will be effective on the date your account is closed.
          </p>
          <p>
            Payment information management and cancellation instructions are
            available via Stripe’s secure platform:
          </p>
          <p>
            <a
              href="https://support.link.com/how-to-delete-your-saved-payment-information"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://support.link.com/how-to-delete-your-saved-payment-information
            </a>
          </p>
        </section>

        <section>
          <h2>Medical Disclaimer</h2>
          <p>
            CalmTinnitus is a self-help sound therapy tool. It does not diagnose,
            treat, cure, or prevent any disease. It is not a substitute for
            professional medical advice. Always consult a qualified healthcare
            professional regarding medical concerns.
          </p>
        </section>

        <section>
          <h2>Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws
            of Australia.
          </p>
        </section>

        <footer className="terms-footer">
          <p>
            © {year} Leffler International Investments Pty Ltd. All rights
            reserved.
          </p>
          <p>
            <Link href="/">← Back to CalmTinnitus</Link>
          </p>
        </footer>
      </div>

      <style jsx>{`
        .terms-page {
          max-width: 820px;
          margin: 0 auto;
          padding: 2rem 1.2rem 3rem;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          color: #0f172a;
        }

        .terms-wrap h1 {
          font-size: 2.2rem;
          margin-bottom: 0.4rem;
        }

        .terms-updated {
          color: #64748b;
          font-size: 0.85rem;
          margin-bottom: 2rem;
        }

        section {
          margin-bottom: 1.8rem;
        }

        h2 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #334155;
        }

        a {
          color: #0369a1;
          text-decoration: none;
        }

        a:hover {
          text-decoration: underline;
        }

        .terms-footer {
          margin-top: 3rem;
          border-top: 1px solid #e5e7eb;
          padding-top: 1.2rem;
          font-size: 0.8rem;
          color: #6b7280;
        }
      `}</style>
    </main>
  );
}
