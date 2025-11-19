// /app/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="nq-landing-page">
      {/* HERO */}
      <section className="nq-hero">
        <div className="nq-hero-text">
          <p className="nq-badge">Based on tinnitus neuromodulation research</p>
          <h1>Train your brain toward quieter days.</h1>
          <p className="nq-hero-sub">
            NeuroQuiet is a calm, at-home sound tool created by someone who has
            lived with persistent tinnitus for over <strong>50 years</strong>.
            There is no miracle cure — but with steady training, many people
            experience quieter moments, better focus, and more peace.
          </p>
          <div className="nq-hero-actions">
            <Link href="/register" className="nq-btn nq-btn-primary">
              Start now
            </Link>
            <span className="nq-price-note">
              A$7 / month – cancel anytime
            </span>
          </div>
          <p className="nq-hero-footnote">
            One simple plan. No free trials, no hidden upgrades. Just an
            affordable tool you can use daily.
          </p>
        </div>

        {/* UPDATED: Replaced laptop mockup with the person image (/woman.png) */}
        <div className="nq-hero-device nq-hero-image-person">
          <div className="nq-hero-device-card nq-hero-device-person">
            <Image
              // Assuming 'woman.png' was uploaded to public directory
              src="/woman.png" 
              alt="Woman with headphones relaxing, symbolizing tinnitus relief"
              width={480}
              height={480} 
            />
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="nq-section">
        <div className="nq-section-title">
          <h2>Why NeuroQuiet?</h2>
          <p>Honest, gentle support for people who live with tinnitus every day.</p>
        </div>
        <div className="nq-card-grid">
          <div className="nq-card">
            <h3>Created by a long-term tinnitus sufferer</h3>
            <p>
              Over five decades of living with constant ringing shaped
              NeuroQuiet. Every part of the tool comes from real experience, not
              theory alone.
            </p>
          </div>
          <div className="nq-card">
            <h3>Use at home, anytime</h3>
            <p>
              All you need is headphones and a quiet place. Match your tinnitus
              pitch, choose your sound, and start short, calm sessions whenever
              you have a moment.
            </p>
          </div>
          <div className="nq-card">
            <h3>Inspired by published research*</h3>
            <p>
              NeuroQuiet combines ideas explored in tinnitus research — notched
              sound, pink noise, and Coordinated Reset patterns. It is a
              self-help sound tool, not a medical device.
            </p>
          </div>
        </div>
        <p className="nq-footnote">
          *Research from independent academic groups, not associated with
          NeuroQuiet. Individual results vary.
        </p>
      </section>

      {/* HOW IT WORKS – 4 STEPS */}
      <section className="nq-section nq-how">
        <div className="nq-section-title">
          <h2>How it works</h2>
          <p>Four simple steps you repeat gently over time.</p>
        </div>

        <div className="nq-how-grid">
          <div className="nq-how-step">
            <div className="nq-step-number">1</div>
            <h3>Assess your tinnitus pitch</h3>
            <p>
              Use the frequency slider in the app until the tone resembles the
              sound you hear. Saving this as your tinnitus pitch personalises
              the sound training for your ears.
            </p>
          </div>

          <div className="nq-how-step">
            <div className="nq-step-number">2</div>
            <h3>Select therapy type</h3>
            <p>
              Choose between Notch Therapy (a narrow “hole” at your tinnitus
              pitch) or Coordinated Reset (CR), which uses brief tone pulses
              around your pitch to disturb the tinnitus pattern.
            </p>
          </div>

          <div className="nq-how-step">
            <div className="nq-step-number">3</div>
            <h3>Start therapy session</h3>
            <p>
              Run short, comfortable sessions each day at a safe volume. You
              should always hear the sound clearly, but it must never feel loud
              or painful.
            </p>
          </div>

          <div className="nq-how-step">
            <div className="nq-step-number">4</div>
            <h3>Measure your progress</h3>
            <p>
              Your session history and (coming soon) progress charts help you
              see how often you train and which modes you use most, so you and
              your clinician can track long-term patterns.
            </p>
          </div>
        </div>

        <p className="nq-note">
          Tinnitus improvement usually takes time. Think of NeuroQuiet as a
          long-term habit, not a quick fix.
        </p>
      </section>

      {/* DEVICE SHOWCASE – MOBILE + LAPTOP MOCKUPS */}
      <section className="nq-section nq-devices">
        <div className="nq-section-title">
          <h2>Works on computer and phone</h2>
          <p>
            Use NeuroQuiet on your laptop at home or with your phone lying beside
            you in bed. Your sessions stay in sync with your account.
          </p>
        </div>

        <div className="nq-device-grid">
          <div className="nq-device-card">
            <div className="nq-device-label">Desktop / Laptop</div>
            <Image
              src="/icons/LapTop.png"
              alt="NeuroQuiet on laptop"
              width={520}
              height={340}
              className="nq-device-image"
            />
          </div>
          <div className="nq-device-card nq-device-card-mobile">
            <div className="nq-device-label">Mobile</div>
            <Image
              src="/icons/Mobile.png"
              alt="NeuroQuiet on mobile"
              width={260}
              height={480}
              className="nq-device-image"
            />
          </div>
        </div>

        <p className="nq-note">
          On supported devices, audio can continue while your screen is dimmed,
          so you can lie back and relax while the session runs.
        </p>
      </section>

      {/* PRICING */}
      <section className="nq-section nq-pricing">
        <div className="nq-pricing-card">
          <h2>Simple pricing</h2>
          <p className="nq-price">
            <span className="nq-price-amount">A$7</span>{" "}
            <span className="nq-price-period">/ month</span>
          </p>
          <ul className="nq-price-list">
            <li>Unlimited sessions while your subscription is active</li>
            <li>No free trials to abuse, no hidden upgrades</li>
            <li>Cancel any month inside the app</li>
          </ul>
          <Link href="/register" className="nq-btn nq-btn-primary nq-btn-wide">
            Start NeuroQuiet
          </Link>
          <p className="nq-note">
            NeuroQuiet is a self-help sound tool and does not replace
            professional medical care. For sudden changes in hearing or strong
            distress, please seek urgent medical advice.
          </p>
        </div>
      </section>
      
      {/* DELETED: Removed REVIEWS PLACEHOLDER section */}

      <style jsx>{`
        .nq-landing-page {
          max-width: 1120px;
          margin: 0 auto;
          padding: 2rem 1.25rem 3rem;
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

        .nq-hero-sub {
          font-size: 0.98rem;
          color: #374151;
          line-height: 1.6;
          margin-bottom: 1.1rem;
        }

        .nq-hero-actions {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }

        .nq-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0.6rem 1.4rem;
          font-size: 0.95rem;
          font-weight: 600;
          text-decoration: none;
          border: 1px solid transparent;
          cursor: pointer;
        }

        .nq-btn-primary {
          background: #0ea5e9;
          color: #ffffff;
          border-color: #0ea5e9;
        }

        .nq-btn-primary:hover {
          background: #0284c7;
          border-color: #0284c7;
        }

        .nq-btn-wide {
          width: 100%;
          justify-content: center;
        }

        .nq-price-note {
          font-size: 0.9rem;
          color: #4b5563;
        }

        .nq-hero-footnote {
          font-size: 0.8rem;
          color: #6b7280;
        }
        
        /* UPDATED: Styles for the new hero image container */
        .nq-hero-device-card.nq-hero-device-person {
          background: #f0f4f7; /* Lighter background for the photo */
          padding: 0.5rem; /* Reduced padding */
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.2);
        }

        .nq-hero-device-card {
          border-radius: 1.25rem;
          background: #0f172a;
          padding: 0.75rem;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.45);
        }

        .nq-section {
          margin-bottom: 2.75rem;
        }

        .nq-section-title h2 {
          font-size: 1.4rem;
          margin-bottom: 0.25rem;
        }

        .nq-section-title p {
          font-size: 0.96rem;
          color: #4b5563;
        }

        .nq-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
          margin-top: 1.25rem;
        }

        .nq-card {
          background: #ffffff;
          border-radius: 0.9rem;
          border: 1px solid #e5e7eb;
          padding: 1.1rem 1.2rem;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
          font-size: 0.9rem;
          color: #374151;
        }

        .nq-card h3 {
          font-size: 1rem;
          margin-bottom: 0.35rem;
        }

        .nq-footnote,
        .nq-note {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.6rem;
        }

        .nq-how-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 1.1rem;
          margin-top: 1.35rem;
        }

        .nq-how-step {
          background: #f9fafb;
          border-radius: 0.9rem;
          padding: 1rem 1.1rem;
          border: 1px solid #e5e7eb;
          font-size: 0.9rem;
        }

        .nq-step-number {
          width: 1.7rem;
          height: 1.7rem;
          border-radius: 999px;
          background: #0ea5e9;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 0.4rem;
        }

        .nq-device-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          align-items: flex-end;
          margin-top: 1.5rem;
        }

        .nq-device-card {
          background: #020617;
          border-radius: 1.25rem;
          padding: 0.9rem;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.55);
          flex: 1 1 280px;
          max-width: 520px;
        }

        .nq-device-card-mobile {
          max-width: 260px;
        }

        .nq-device-label {
          font-size: 0.78rem;
          color: #e5e7eb;
          margin-bottom: 0.4rem;
        }

        .nq-device-image {
          border-radius: 1rem;
        }

        .nq-pricing-card {
          max-width: 440px;
          margin: 0 auto;
          background: #0f172a;
          color: #e57e7eb;
          border-radius: 1.1rem;
          padding: 1.8rem 1.7rem 1.7rem;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.6);
        }

        .nq-pricing-card h2 {
          font-size: 1.3rem;
          margin-bottom: 0.6rem;
        }

        .nq-price {
          margin: 0.1rem 0 0.4rem;
        }

        .nq-price-amount {
          font-size: 2rem;
          font-weight: 700;
        }

        .nq-price-period {
          font-size: 0.95rem;
          color: #cbd5f5;
        }

        .nq-price-list {
          list-style: disc;
          padding-left: 1.1rem;
          font-size: 0.9rem;
          margin: 0.7rem 0 1.1rem;
        }

        .nq-reviews {
          text-align: center;
        }

        .nq-stars {
          font-size: 1.4rem;
          margin-top: 0.8rem;
        }

        .nq-star-faded {
          opacity: 0.35;
        }
      `}</style>
    </main>
  );
}
