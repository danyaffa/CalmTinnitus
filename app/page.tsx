// /app/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="nq-landing-page">
      {/* Header with logo and auth links */}
      <header className="nq-header">
        <div className="nq-header-left">
          <Link href="/">
            <Image
              src="/NeuroQuiet-Logo.png"
              alt="NeuroQuiet – Silence Starts Now"
              width={240}
              height={120}
              className="nq-logo"
            />
          </Link>
        </div>
        <nav className="nq-header-right">
          <Link href="/login" className="nq-header-link">
            Log in
          </Link>
          <Link href="/register" className="nq-header-button">
            Register
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="nq-hero">
        <div className="nq-hero-text">
          <p className="nq-badge">Based on tinnitus neuromodulation research</p>
          <h1>Train your brain toward quieter days.</h1>
          <p className="nq-lead">
            NeuroQuiet is a calm, at-home sound tool created by someone who has
            lived with persistent tinnitus for over <strong>50 years</strong>.
            There is no miracle cure — but with steady training, many people
            experience quieter moments, better focus, and more peace.
          </p>
          <p className="nq-plan">
            <span className="nq-plan-price">A$7 / month</span>{" "}
            <span className="nq-plan-detail">— cancel anytime</span>
          </p>
          <p className="nq-plan-sub">
            One simple plan. No hidden upgrades. Just an
            affordable tool you can use daily.
          </p>
        </div>

        {/* HERO IMAGE – person with headphones */}
        <div className="nq-hero-device nq-hero-image-person">
          <div className="nq-hero-device-card nq-hero-device-person">
            <Image
              src="/woman.png"
              alt="Person listening calmly to sound therapy"
              width={420}
              height={320}
              className="nq-device-image"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="nq-how">
        <h2>How NeuroQuiet supports you</h2>
        <div className="nq-how-grid">
          <div className="nq-how-card">
            <h3>1. Match your tinnitus pitch</h3>
            <p>
              Use the simple slider to match a tone to your tinnitus pitch. This
              gives us a “target” frequency for therapy.
            </p>
          </div>
          <div className="nq-how-card">
            <h3>2. Choose a therapy profile</h3>
            <p>
              Pick between Notch Therapy, Coordinated Reset-style (CR) patterns,
              and gentle soundscapes for sleep and focus support.
            </p>
          </div>
          <div className="nq-how-card">
            <h3>3. Train daily</h3>
            <p>
              Short, regular sessions can help your brain gradually reduce the
              impact of tinnitus on your day.
            </p>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="nq-benefits">
        <div className="nq-benefits-card">
          <h2>Designed for real life, not perfection.</h2>
          <ul>
            <li>Use with your own earbuds or headphones at safe volume.</li>
            <li>Short 5–10 minute “reset” sessions when tinnitus spikes.</li>
            <li>Longer soothing sessions for evenings and sleep preparation.</li>
            <li>
              Simple tracking so you can see how often you are training and how
              you feel over time.
            </li>
          </ul>
          <p className="nq-note">
            NeuroQuiet is a self-help sound tool and does not replace
            professional medical care. For sudden changes in hearing or strong
            distress, please seek urgent medical advice.
          </p>
        </div>
      </section>

      {/* FOOTER: legal + trade protection */}
      <footer className="nq-footer">
        <div className="nq-footer-main">
          <span>
            © {new Date().getFullYear()} Leffler International Investments Pty
            Ltd. All rights reserved.
          </span>
          <span>NeuroQuiet™ – Tinnitus Relief Companion.</span>
        </div>
        <div className="nq-footer-links">
          <Link href="/info">About &amp; Safety</Link>
          <Link href="/legal">Legal</Link>
          <Link href="/disclaimers">Disclaimers</Link>
          <Link href="/company-policy">Company Policy</Link>
          <Link href="/terms">Terms of Use</Link>
        </div>
      </footer>

      <style jsx>{`
        .nq-landing-page {
          max-width: 1120px;
          margin: 0 auto;
          padding: 2rem 1.25rem 3rem;
        }

        .nq-footer {
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
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
        }

        .nq-footer-links a {
          color: #4b5563;
          text-decoration: none;
        }

        .nq-footer-links a:hover {
          text-decoration: underline;
        }

        .nq-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }

        .nq-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .nq-header-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;
        }

        .nq-header-link {
          text-decoration: none;
          color: #111827;
        }

        .nq-header-link:hover {
          text-decoration: underline;
        }

        .nq-header-button {
          padding: 0.35rem 0.9rem;
          border-radius: 999px;
          background: #111827;
          color: #f9fafb;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .nq-header-button:hover {
          background: #020617;
        }

        .nq-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.2fr);
          gap: 2rem;
          align-items: center;
          margin-bottom: 2.5rem;
        }

        @media (max-width: 900px) {
          .nq-hero {
            grid-template-columns: minmax(0, 1fr);
          }
          .nq-hero-device {
            order: -1;
          }
        }

        .nq-hero-text h1 {
          font-size: 2.1rem;
          line-height: 1.15;
          margin-bottom: 0.7rem;
        }

        .nq-badge {
          display: inline-flex;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          background: #e0f2fe;
          color: #0369a1;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .nq-lead {
          font-size: 1rem;
          line-height: 1.5;
          color: #4b5563;
          margin-bottom: 1rem;
        }

        .nq-plan {
          margin-bottom: 0.15rem;
        }

        .nq-plan-price {
          font-weight: 700;
          font-size: 1.2rem;
        }

        .nq-plan-detail {
          font-size: 0.9rem;
          color: #4b5563;
        }

        .nq-plan-sub {
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .nq-hero-device {
          display: flex;
          justify-content: center;
        }

        .nq-hero-device-card {
          border-radius: 1.2rem;
          padding: 0.5rem;
          background: radial-gradient(circle at top left, #1f2937, #020617);
          box-shadow: 0 22px 60px rgba(15, 23, 42, 0.6);
        }

        .nq-device-screen {
          border-radius: 0.9rem;
          padding: 1.3rem 1.2rem;
          background: linear-gradient(to bottom right, #0f172a, #020617);
          color: #e5e7eb;
          min-width: 270px;
          max-width: 330px;
        }

        .nq-device-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.9rem;
        }

        .nq-device-title {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .nq-device-pill {
          border-radius: 999px;
          padding: 0.2rem 0.6rem;
          font-size: 0.7rem;
          background: rgba(15, 118, 110, 0.16);
          color: #a7f3d0;
        }

        .nq-device-body p {
          font-size: 0.75rem;
          line-height: 1.4;
          color: #e5e7eb;
          margin-bottom: 0.7rem;
        }

        .nq-device-foot {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .nq-device-foot-label {
          font-size: 0.7rem;
          color: #9ca3af;
        }

        .nq-device-foot-bar {
          height: 6px;
          width: 100%;
          border-radius: 999px;
          background: linear-gradient(to right, #22c55e, #facc15);
        }

        .nq-device-foot-text {
          font-size: 0.7rem;
          color: #e5e7eb;
        }

        .nq-how {
          margin-bottom: 2.8rem;
        }

        .nq-how h2 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .nq-how-grid {
          display: grid;
          gap: 1rem;
        }

        @media (min-width: 800px) {
          .nq-how-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        .nq-how-card {
          background: #ffffff;
          border-radius: 1rem;
          padding: 1.1rem 1.2rem;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.05);
          border: 1px solid #e5e7eb;
        }

        .nq-how-card h3 {
          margin-top: 0;
          margin-bottom: 0.4rem;
          font-size: 1.05rem;
        }

        .nq-how-card p {
          margin: 0;
          font-size: 0.9rem;
          color: #4b5563;
        }

        .nq-benefits-card {
          background: #020617;
          border-radius: 1.2rem;
          padding: 1.8rem 1.6rem;
          color: #e5e7eb;
          box-shadow: 0 22px 50px rgba(15, 23, 42, 0.7);
        }

        .nq-benefits-card h2 {
          margin-top: 0;
          margin-bottom: 0.9rem;
          font-size: 1.5rem;
        }

        .nq-benefits-card ul {
          margin: 0;
          padding-left: 1.4rem;
          font-size: 0.92rem;
          line-height: 1.5;
        }

        .nq-benefits-card li + li {
          margin-top: 0.35rem;
        }

        .nq-note {
          font-size: 0.8rem;
          color: #e5e7eb;
          margin-top: 1.1rem;
        }
      `}</style>
    </main>
  );
}
