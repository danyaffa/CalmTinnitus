// FILE: app/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";
import Footer from "../components/Footer";

// ✅ Load ReviewWidget only on the client, and only after hydration
const ReviewWidget = dynamic(
  async () => {
    const mod = await import("../components/ReviewWidgets");
    return mod.ReviewWidget;
  },
  { ssr: false }
);

const InstallAppButton = dynamic(
  () => import("../components/InstallAppButton"),
  { ssr: false }
);

export default function HomePage() {
  const year = useMemo(() => new Date().getFullYear(), []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Ensures Android WebView doesn't execute widget code before hydration
    setMounted(true);
  }, []);

  // Low stimulation mode
  const [lowStim, setLowStim] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("calmtinnitus_low_stim");
    if (saved === "true") {
      setLowStim(true);
      document.documentElement.classList.add("low-stimulation");
    }
  }, []);

  const toggleLowStim = () => {
    const next = !lowStim;
    setLowStim(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("calmtinnitus_low_stim", String(next));
      if (next) {
        document.documentElement.classList.add("low-stimulation");
      } else {
        document.documentElement.classList.remove("low-stimulation");
      }
    }
  };

  return (
    <>
      <main className="nq-landing">
        {/* 🌅 TOP GRADIENT SHELL (Header + Hero) */}
        <div className="nq-hero-shell">
          <div className="nq-hero-inner">
            {/* HEADER */}
            <header className="nq-header">
              <div className="nq-header-left">
                <Link href="/" className="nq-logo-wrap">
                  <Image
                    src="/CalmTinnitus-Logo.png"
                    alt="CalmTinnitus – Silence Starts Now"
                    width={150}
                    height={150}
                    className="nq-logo"
                    priority
                  />
                </Link>
              </div>
              <nav className="nq-header-right">
                <Link href="/qa" className="nq-header-link">
                  Q&amp;A
                </Link>
                <Link href="/login" className="nq-header-link">
                  Log in
                </Link>
                <Link href="/register" className="nq-header-btn">
                  Register
                </Link>
                <button
                  onClick={toggleLowStim}
                  className="nq-low-stim-btn"
                  title={
                    lowStim
                      ? "Disable Low Stimulation Mode"
                      : "Enable Low Stimulation Mode"
                  }
                >
                  {lowStim ? "Standard Mode" : "Low Stimulation"}
                </button>
                {mounted && <InstallAppButton />}
              </nav>
            </header>

            {/* HERO */}
            <section className="nq-hero">
              <div className="nq-hero-text">
                <Link href="/research" className="nq-research-link">
                  Therapy is based on tinnitus neuromodulation research
                </Link>

                <h1>Train your brain toward quieter days.</h1>

                <p className="nq-lead">
                  CalmTinnitus is a calm, at-home sound tool created by someone
                  who has lived with persistent tinnitus for over{" "}
                  <strong>50 years</strong>. There is no miracle cure — but with
                  steady training, many people experience quieter moments,
                  better focus, and more peace.
                </p>

                <div className="nq-plan-group">
                  <p className="nq-trial-badge">
                    14-day free trial — no payment required to start
                  </p>
                  <p className="nq-plan">
                    <span className="nq-plan-price">$19.80 / month</span>
                    <span className="nq-plan-detail">
                      {" "}
                      — after trial, cancel anytime
                    </span>
                  </p>
                  <p className="nq-plan-sub">
                    One simple plan. No hidden upgrades. Just an affordable tool
                    you can use daily.
                  </p>

                  <Link href="/register" className="nq-primary-cta">
                    Start your free trial
                  </Link>
                  <Link href="/therapy" className="nq-quick-relief">
                    Quick Relief — start a calming session now
                  </Link>
                  <div className="nq-install-row">
                    {mounted && <InstallAppButton />}
                  </div>
                </div>
              </div>

              <div className="nq-hero-image">
                <Image
                  src="/woman.png"
                  alt="Calm person listening to sound therapy"
                  width={500}
                  height={360}
                  className="nq-hero-photo"
                  priority
                />
              </div>
            </section>
          </div>
        </div>

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

        {/* CORE PLATFORM FEATURES */}
        <section className="nq-section">
          <h2>Core Platform Features</h2>
          <div className="nq-features-grid">
            <div className="nq-feature-item">
              <h3>Precision Pitch Matching</h3>
              <p>Identify your unique tinnitus frequency with our built-in tone matcher for personalised therapy.</p>
            </div>
            <div className="nq-feature-item">
              <h3>3 Therapy Modes</h3>
              <p>Relief (CR neuromodulation), Standard masking, and Sleep Support — choose based on how you feel today.</p>
            </div>
            <div className="nq-feature-item">
              <h3>Background Sound Library</h3>
              <p>White noise, soft rain, and ocean waves to complement your therapy or use as standalone masking.</p>
            </div>
            <div className="nq-feature-item">
              <h3>Session Tracking</h3>
              <p>Log your sessions, track loudness and stress levels, and see your training consistency over time.</p>
            </div>
            <div className="nq-feature-item">
              <h3>14-Day Free Trial</h3>
              <p>Full access for 14 days with no payment required. After the trial, continue for just $19.80/month.</p>
            </div>
            <div className="nq-feature-item">
              <h3>Works Everywhere</h3>
              <p>Use on any device — web, Android, or install as a progressive web app on your phone or tablet.</p>
            </div>
            <div className="nq-feature-item">
              <h3>AI-Powered FAQ</h3>
              <p>Get instant answers about tinnitus, therapy modes, and how to get the most from CalmTinnitus.</p>
            </div>
            <div className="nq-feature-item">
              <h3>Privacy First</h3>
              <p>Minimal data collection. No therapy content stored on servers. Full account deletion at any time.</p>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="nq-section nq-section-dark">
          <div className="nq-card-dark">
            <h2>Designed by a long-term tinnitus sufferer.</h2>
            <ul>
              <li>Built for headphones or mobile earpods at safe volume.</li>
              <li>Quick &ldquo;reset&rdquo; sessions when tinnitus spikes.</li>
              <li>Longer calming sessions before bed to support sleep.</li>
              <li>
                Session history so you can see how often you&apos;re training over
                time.
              </li>
              <li>Progressive training programs (7–30 days) to build consistency.</li>
              <li>Low stimulation mode for sensitive days.</li>
              <li>Guided mindfulness techniques (MBCT) for tinnitus management.</li>
              <li>Safe, evidence-informed approach based on neuromodulation research.</li>
            </ul>
            <p className="nq-note">
              CalmTinnitus is a self-help sound tool and does not replace
              medical care. For sudden hearing changes, strong distress, or
              other medical concerns, please seek professional help immediately.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <Footer variant="full" />

        {/* STYLES */}
        <style jsx>{`
          .nq-landing {
            max-width: 1120px;
            margin: 0 auto;
            padding: 1.25rem 1rem 2.5rem;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
              sans-serif;
          }

          .nq-hero-shell {
            background: radial-gradient(
                circle at top left,
                rgba(134, 239, 255, 0.26),
                transparent 55%
              ),
              linear-gradient(135deg, #f3fbff, #f6f4ff);
            border-radius: 1.5rem;
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
            padding: 1rem 1.25rem 2.25rem;
            margin-bottom: 2.75rem;
          }

          .nq-hero-inner {
            max-width: 1120px;
            margin: 0 auto;
          }

          .nq-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding-bottom: 0.5rem;
            margin-bottom: 1.25rem;
            border-bottom: 1px solid rgba(148, 163, 184, 0.25);
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
            color: #0f172a;
          }

          .nq-header-link:hover {
            text-decoration: underline;
          }

          .nq-header-btn {
            padding: 0.4rem 0.95rem;
            border-radius: 999px;
            background: #0f172a;
            color: #f9fafb;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.85rem;
            white-space: nowrap;
            box-shadow: 0 10px 20px rgba(15, 23, 42, 0.35);
          }

          .nq-header-btn:hover {
            background: #020617;
          }

          .nq-hero {
            display: grid;
            grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
            gap: 2.5rem;
            align-items: center;
            margin-top: 0.75rem;
          }

          .nq-hero-text h1 {
            font-size: 2.5rem;
            line-height: 1.1;
            margin: 0 0 1rem;
            color: #020617;
          }

          .nq-lead {
            font-size: 1.05rem;
            line-height: 1.6;
            color: #1f2933;
            margin: 0 0 1.5rem;
          }

          .nq-plan-group {
            margin-bottom: 0.25rem;
          }

          .nq-plan {
            margin: 0 0 0.3rem;
            display: flex;
            align-items: baseline;
            gap: 0.85rem;
          }

          .nq-plan-price {
            font-weight: 800;
            font-size: 1.75rem;
            color: #0369a1;
          }

          .nq-plan-detail {
            font-size: 1rem;
            color: #334155;
          }

          .nq-plan-sub {
            margin: 0;
            font-size: 0.9rem;
            color: #64748b;
            max-width: 90%;
          }

          .nq-primary-cta {
            display: inline-flex;
            margin-top: 1.1rem;
            padding: 0.6rem 1.6rem;
            border-radius: 999px;
            background: linear-gradient(135deg, #0ea5e9, #22c55e);
            color: white;
            font-weight: 700;
            font-size: 0.98rem;
            text-decoration: none;
            box-shadow: 0 16px 30px rgba(56, 189, 248, 0.45);
          }

          .nq-primary-cta:hover {
            filter: brightness(1.03);
          }

          .nq-quick-relief {
            display: inline-flex;
            margin-top: 0.65rem;
            padding: 0.5rem 1.3rem;
            border-radius: 999px;
            background: #f0fdf4;
            border: 1px solid #86efac;
            color: #166534;
            font-weight: 600;
            font-size: 0.88rem;
            text-decoration: none;
          }

          .nq-quick-relief:hover {
            background: #dcfce7;
          }

          .nq-low-stim-btn {
            padding: 0.3rem 0.7rem;
            border-radius: 999px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            color: #475569;
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
          }

          .nq-low-stim-btn:hover {
            background: #e2e8f0;
          }

          .nq-install-row {
            margin-top: 0.75rem;
          }

          .nq-hero-image {
            display: flex;
            justify-content: center;
          }

          .nq-hero-photo {
            width: 100%;
            height: auto;
            max-width: 480px;
            border-radius: 1.6rem;
            object-fit: cover;
            box-shadow: 0 22px 50px rgba(15, 23, 42, 0.55);
          }

          .nq-research-link {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            margin-bottom: 0.9rem;
            padding: 0.15rem 0.7rem;
            font-size: 0.85rem;
            font-weight: 600;
            color: #0369a1;
            background: rgba(191, 219, 254, 0.55);
            border-radius: 999px;
            text-decoration: none;
            margin-right: 0.75rem;
          }

          .nq-research-link:last-of-type {
            margin-right: 0;
          }

          .nq-research-link:hover {
            background: rgba(191, 219, 254, 0.9);
          }

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
            background: linear-gradient(135deg, #bae6fd, #e0f2fe);
            border-radius: 1.2rem;
            padding: 1.7rem 1.6rem;
            color: #334155;
            box-shadow: 0 22px 50px rgba(148, 163, 184, 0.25);
          }

          .nq-card-dark h2 {
            margin-top: 0;
            margin-bottom: 0.9rem;
            color: #0f172a;
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
            color: #64748b;
          }

          .nq-trial-badge {
            display: inline-block;
            margin: 0 0 0.6rem;
            padding: 0.35rem 0.9rem;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            border-radius: 999px;
            font-weight: 700;
            font-size: 0.88rem;
            box-shadow: 0 6px 18px rgba(34, 197, 94, 0.35);
          }

          .nq-features-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .nq-feature-item {
            background: #ffffff;
            border-radius: 1rem;
            padding: 1rem 1.1rem;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
            border: 1px solid #e5e7eb;
          }

          .nq-feature-item h3 {
            margin: 0 0 0.35rem;
            font-size: 0.98rem;
            color: #0369a1;
          }

          .nq-feature-item p {
            margin: 0;
            font-size: 0.88rem;
            color: #4b5563;
            line-height: 1.5;
          }



          @media (max-width: 768px) {
            .nq-landing {
              padding: 1rem 0.8rem 2.2rem;
            }

            .nq-hero-shell {
              padding: 0.8rem 0.85rem 1.7rem;
              margin-bottom: 2.25rem;
            }

            .nq-header {
              padding-bottom: 0.35rem;
              margin-bottom: 1rem;
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
              font-size: 2rem;
            }

            .nq-plan-price {
              font-size: 1.5rem;
            }
          }

          @media (max-width: 600px) {
            .nq-features-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (min-width: 900px) {
            .nq-cards {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            .nq-features-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
        `}</style>

        {/* ✅ Render the widget only after hydration (Android-safe) */}
        {mounted ? (
          <ReviewWidget
            appName="CalmTinnitus"
            appStoreUrl="https://apps.apple.com"
            feedbackEndpoint="/api/feedback"
          />
        ) : null}
      </main>
    </>
  );
}
