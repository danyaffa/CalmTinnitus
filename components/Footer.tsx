"use client";

import Link from "next/link";
import { useMemo } from "react";

type FooterVariant = "full" | "minimal";

interface FooterProps {
  variant?: FooterVariant;
}

export default function Footer({ variant = "full" }: FooterProps) {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="ct-footer">
      <div className="ct-footer-main">
        <span>
          &copy; {year} Leffler International Investments Pty Ltd. All rights
          reserved.
        </span>
        <span>CalmTinnitus&trade; &ndash; Tinnitus Relief Companion.</span>
      </div>

      {variant === "full" && (
        <div className="ct-footer-links">
          <Link href="/about">About</Link>
          <Link href="/research">Research</Link>
          <Link href="/program">7&ndash;30 Day Program</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/disclaimers">Disclaimers</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/settings">Account Settings</Link>
          <Link href="/company-policy">Company Policy</Link>
        </div>
      )}

      <p className="ct-footer-note">
        CalmTinnitus&trade; is a trade mark of Leffler International Investments
        Pty Ltd. This app does not diagnose, treat, cure, or prevent disease.
        Always consult a qualified clinician for medical advice.
      </p>

      <style jsx>{`
        .ct-footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 1.4rem;
          margin-top: 2rem;
          font-size: 0.8rem;
          color: #6b7280;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .ct-footer-main {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.75rem;
        }

        .ct-footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 0.6rem;
        }

        .ct-footer-links :global(a) {
          color: #4b5563;
          text-decoration: none;
        }

        .ct-footer-links :global(a:hover) {
          text-decoration: underline;
        }

        .ct-footer-note {
          margin: 0;
        }
      `}</style>
    </footer>
  );
}
