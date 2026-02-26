// FILE: /app/about/page.tsx
"use client";

import Head from "next/head";
import Link from "next/link";
import Footer from "../../components/Footer";

export default function AboutPage() {
  const siteUrl = "https://calmtinnitus.com";

  return (
    <>
      <Head>
        <title>About CalmTinnitus</title>
        <meta
          name="description"
          content="Learn more about the CalmTinnitus approach to supporting people living with tinnitus, created from real high-pitch tinnitus experience."
        />
        <link rel="canonical" href={`${siteUrl}/about`} />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="nq-about">
        <header className="nq-about-header">
          <h1>About CalmTinnitus™</h1>
          <p>
            CalmTinnitus™ is a calm, at-home tinnitus sound tool developed under
            <strong> Leffler International Investments Pty Ltd</strong>.  
            It is inspired by modern neuromodulation research and built to help people
            gently retrain how the brain reacts to tinnitus.
          </p>

          <p className="nq-about-back">
            <Link href="/" className="nq-link">
              ← Back to home
            </Link>
          </p>
        </header>

        <section className="nq-about-section">
          <h2>Created from real experience</h2>
          <p>
            CalmTinnitus™ was created by someone living with high-pitch tinnitus for
            over 50 years — including severe, war-related acoustic trauma.  
            This is not theory. This is lived experience transformed into a practical
            tool.
          </p>
        </section>

        <section className="nq-about-section">
          <h2>Our mission</h2>
          <p>
            To give tinnitus sufferers a simple, affordable, research-informed tool
            that can be used every day — without expensive hardware, clinics, or
            complicated protocols.
          </p>
          <ul>
            <li>Safe, comfortable sound therapy</li>
            <li>Built-in tinnitus pitch matching</li>
            <li>Neuromodulation-inspired tone patterns</li>
            <li>Sleep-friendly audio modes</li>
            <li>Mobile-ready and easy to use</li>
          </ul>
        </section>

        <section className="nq-about-section">
          <h2>Not a miracle cure</h2>
          <p>
            No sound therapy can promise a cure — and we will never claim one.  
            But many people find that regular, structured training helps reduce the
            intensity, stress, and intrusiveness of tinnitus.
          </p>
        </section>

        <section className="nq-about-section nq-about-dark">
          <h2>Responsible and honest</h2>
          <p>
            CalmTinnitus™ is a self-help training tool. It does not replace ENT care,
            audiology evaluation, or professional medical treatment.
          </p>
        </section>

        <Footer variant="full" />

        <style jsx>{`
          .nq-about {
            max-width: 960px;
            margin: 0 auto;
            padding: 1.5rem 1rem 2.5rem;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
              sans-serif;
          }

          .nq-about-header h1 {
            font-size: 1.8rem;
            margin-bottom: 0.6rem;
          }

          .nq-about-header p {
            font-size: 1rem;
            color: #4b5563;
          }

          .nq-about-back {
            margin-top: 0.75rem;
          }

          .nq-link {
            color: #0369a1;
            text-decoration: underline;
            text-underline-offset: 3px;
          }

          .nq-about-section {
            margin-top: 1.7rem;
            font-size: 0.96rem;
            line-height: 1.6;
            color: #374151;
          }

          .nq-about-section h2 {
            font-size: 1.25rem;
            margin-bottom: 0.4rem;
          }

          .nq-about-section ul {
            margin: 0.5rem 0 0;
            padding-left: 1.3rem;
          }

          .nq-about-section li + li {
            margin-top: 0.35rem;
          }

          .nq-about-dark {
            background: #f3f4f6;
            border-radius: 0.9rem;
            padding: 1rem;
          }


          @media (max-width: 768px) {
            .nq-about {
              padding: 1.25rem 0.85rem 2.2rem;
            }

            .nq-about-header h1 {
              font-size: 1.5rem;
            }
          }
        `}</style>
      </main>
    </>
  );
}
