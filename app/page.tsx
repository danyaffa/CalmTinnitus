// app/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Metadata } from 'next'; // Import Metadata type for type safety

// --- ADDED METADATA EXPORT for SEO and Site Verification ---
export const metadata: Metadata = {
  title: 'CalmTinnitus – Silence Starts Now',
  description: 'Calm-Tinnitus helps reduce tinnitus discomfort using science-based neuromodulation, sound therapy, and guided relaxation for daily relief.',
  // Google & Bing Verification
  verification: {
    google: '1-hMw5VR5fPWM2BohUpP3BBUCgc3f_tuqvOjuV2Fnl0',
    other: {
      'msvalidate.01': '1A5F9E495867B41926D6E2C113347122',
    }
  },
  // Canonical Link
  alternates: {
    canonical: 'https://www.calmtinnitus.com/',
  }
};
// -------------------------------------------------------------


export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <main className="nq-landing">
      {/* HEADER */}
      <header className="nq-header">
        <div className="nq-header-left">
          <Link href="/" className="nq-logo-wrap">
            <Image
              src="/CalmTinnitus-Logo.png"
              alt="CalmTinnitus – Silence Starts Now"
              width={200}
              height={100}
              className="nq-logo"
            />
          </Link>
        </div>
        <nav className="nq-header-right">
          <Link href="/login" className="nq-header-link">
            Log in
          </Link>
          <Link href="/register" className="nq-header-btn">
            Register
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="nq-hero">
        <div className="nq-hero-text">
          <Link href="/research" className="nq-research-link">
            Based on tinnitus neuromodulation research
          </Link>

          <h1>Train your brain toward quieter days.</h1>

          <p className="nq-lead">
            CalmTinnitus is a calm, at-home sound tool created by someone who has
            lived with persistent tinnitus for over <strong>50 years</strong>.
            There is no miracle cure — but with steady training, many people
            experience quieter moments, better focus, and more peace.
          </p>

          <p className="nq-plan">
            <span className="nq-plan-price">A$7 / month</span>
            <span className="nq-plan-detail"> — cancel anytime</span>
          </p>
          <p className="nq-plan-sub">
            One simple plan. No free trials, no hidden upgrades. Just an
            affordable tool you can use daily.
          </p>
        </div>

        <div className="nq-hero-image">
          <Image
            src="/woman.png"
            alt="Calm person listening to sound therapy"
            width={500}
            height={360}
            className="nq-hero-photo"
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="nq-section">
        <h2>How CalmTinnitus supports you</h2>
        <div className="nq-cards">
          <article className="nq-card">
            <h3>1. Match your tinnitus pitch</h3>
            <p>
              Use the built-in tone matcher to find the pitch that sounds most
              like your tinnitus. This becomes the target for sound therapy.
            </p>
          </article>
          <article className="nq-card">
            <h3>2. Choose your therapy mode</h3>
            <p>
              Pick between relaxation / masking, brain-training (CR-style
              patterns), or gentle sleep support, depending on how you feel
              today.
            </p>
          </article>
          <article className="nq-card">
            <h3>3. Train regularly</h3>
            <p>
              Short, regular sessions can help your brain gradually reduce how
              intrusive tinnitus feels in daily life.
            </p>
          </article>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="nq-section nq-section-dark">
        <div className="nq-card-dark">
          <h2>Designed by a long-term tinnitus sufferer.</h2>
          <ul>
            <li>Built for headphones or mobile earpods at safe volume.</li>
            <li>Quick “reset” sessions when tinnitus spikes.</li>
            <li>Longer calming sessions before bed to support sleep.</li>
            <li>
              Session history so you can see how often you’re training over
              time.
            </li>
          </ul>
          <p className="nq-note">
            CalmTinnitus is a self-help sound tool and does not replace medical
            care. For sudden hearing changes, strong distress, or other medical
            concerns, please seek professional help immediately.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="nq-footer">
        <div className="nq-footer-main">
          <span>
            © {year} Leffler International Investments Pty Ltd. All rights
            reserved.
          </span>
          <span>CalmTinnitus™ – Tinnitus Relief Companion.</span>
        </div>
        <div className="nq-footer-links">
          <Link href="/about">About</Link>
          <Link href="/research">Research</Link>
          <Link href="/legal">Legal</Link>
          <Link href="/disclaimers">Disclaimers</Link>
          <Link href="/company-policy">Company Policy</Link>
        </div>
        <p className="nq-footer-note">
          CalmTinnitus™ is a trade mark of Leffler International Investments Pty
          Ltd. This app does not diagnose, treat, cure, or prevent disease.
        </p>
      </footer>

      {/* MOBILE-FRIENDLY STYLES */}
      <style jsx>{`
        .nq-landing {
          max-width: 1120px;
          margin: 0 auto;
          padding: 1.25rem 1rem 2.5rem;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        /* HEADER */
        .nq-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .nq-logo-wrap {
          display: inline-flex;
          align-items: center;
        }

        .nq-logo {
          height: auto;
          max-width: 190px;
          width: 100%;
        }

        .nq-header-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
        }

        .nq-header-link {
          text-decoration: none;
          color: #111827;
        }

        .nq-header-link:hover {
          text-decoration: underline;
        }

        .nq-header-btn {
          padding: 0.35rem 0.9rem;
          border-radius: 999px;
          background: #111827;
          color: #f9fafb;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.85rem;
          white-space: nowrap;
        }

        .nq-header-btn:hover {
          background: #020617;
        }

        /* HERO */
        .nq-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
          gap: 2rem;
          align-items: center;
          margin-bottom: 2.5rem;
        }

        .nq-hero-text h1 {
          font-size: 2rem;
          line-height: 1.15;
          margin: 0 0 0.75rem;
        }

        .nq-lead {
          font-size: 1rem;
          line-height: 1.5;
          color: #4b5563;
          margin: 0 0 1rem;
        }

        .nq-plan {
          margin: 0 0 0.15rem;
        }

        .nq-plan-price {
          font-weight: 700;
          font-size: 1.2rem;
        }

        .nq-plan-detail {
          font-size: 0.95rem;
          color: #4b5563;
        }

        .nq-plan-sub {
          margin: 0 0 1.5rem;
          font-size: 0.85rem;
          color: #6b7280;
        }

        .nq-hero-image {
          display: flex;
          justify-content: center;
        }

        .nq-hero-photo {
          width: 100%;
          height: auto;
          max-width: 460px;
          border-radius: 1.25rem;
          object-fit: cover;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.45);
        }

        /* RESEARCH LINK (NO BLUE PILL, BIGGER FONT) */
        .nq-research-link {
          display: inline-block;
          margin-bottom: 0.8rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: #0369a1;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .nq-research-link:hover {
          color: #075985;
        }

        /* SECTIONS */
        .nq-section {
          margin-bottom: 2.5rem;
        }

        .nq-section h2 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .nq-cards {
          display: grid;
          gap: 1rem;
        }

        .nq-card {
          background: #ffffff;
          border-radius: 1rem;
          padding: 1.1rem 1.2rem;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
          border: 1px solid #e5e7eb;
          font-size: 0.95rem;
          color: #4b5563;
        }

        .nq-card h3 {
          margin-top: 0;
          margin-bottom: 0.45rem;
          font-size: 1.05rem;
          color: #111827;
        }

        .nq-section-dark {
          margin-bottom: 2.75rem;
        }

        .nq-card-dark {
          background: #020617;
          border-radius: 1.2rem;
          padding: 1.7rem 1.6rem;
          color: #e5e7eb;
          box-shadow: 0 22px 50px rgba(15, 23, 42, 0.7);
        }

        .nq-card-dark h2 {
          margin-top: 0;
          margin-bottom: 0.9rem;
        }

        .nq-card-dark ul {
          margin: 0 0 0.9rem;
          padding-left: 1.4rem;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .nq-card-dark li + li {
          margin-top: 0.35rem;
        }

        .nq-note {
          font-size: 0.8rem;
          color: #e5e7eb;
        }

        /* FOOTER */
        .nq-footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 1.4rem;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .nq-footer-main {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.75rem;
        }

        .nq-footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 0.6rem;
        }

        .nq-footer-links a {
          color: #4b5563;
          text-decoration: none;
        }

        .nq-footer-links a:hover {
          text-decoration: underline;
        }

        .nq-footer-note {
          margin: 0;
        }

        /* MOBILE LAYOUT */
        @media (max-width: 768px) {
          .nq-landing {
            padding: 1rem 0.8rem 2.2rem;
          }

          .nq-header {
            flex-direction: row;
          }

          .nq-logo {
            max-width: 150px;
          }

          .nq-header-right {
            gap: 0.5rem;
          }

          .nq-header-btn {
            padding-inline: 0.7rem;
          }

          .nq-hero {
            grid-template-columns: minmax(0, 1fr);
            gap: 1.5rem;
          }

          .nq-hero-image {
            order: -1;
          }

          .nq-hero-text h1 {
            font-size: 1.6rem;
          }
        }

        @media (min-width: 900px) {
          .nq-cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
}
