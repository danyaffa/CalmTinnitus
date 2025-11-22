// app/qa/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export default function QAPage() {
  const year = new Date().getFullYear();

  const faqs = [
    {
      question: "What is CalmTinnitus?",
      answer:
        [span_0](start_span)[span_1](start_span)"CalmTinnitus is a web-based sound therapy tool designed to help you manage and habituate to your tinnitus. It is a wellness tool, not a medical cure, built by someone who has lived with persistent tinnitus for over 50 years.[span_0](end_span)[span_1](end_span)",
    },
    {
      question: "How does the therapy work?",
      answer:
        "The process involves three simple steps: First, you use our built-in tone matcher to find the pitch of your tinnitus. Next, you select a therapy mode (Standard, Relief, or Sleep). [span_2](start_span)[span_3](start_span)[span_4](start_span)Finally, you choose a background sound (like noise, nature, or your own music) and start a timed session.[span_2](end_span)[span_3](end_span)[span_4](end_span)",
    },
    {
      question: "What are the different therapy modes?",
      answer: (
        <ul style={{ margin: "0.5rem 0 0 1.5rem", padding: 0 }}>
          <li>
            <strong>Standard Therapy:</strong> A gentle background sound mixed
            [span_5](start_span)with your matched tinnitus tone, designed for habituation. [cite:
            110]
          </li>
          <li>
            <strong>Relief (CR) Therapy:</strong> Uses neuromodulation pulses,
            often described as clicks or rhythmic pulses, to help desynchronize
            [cite_start]tinnitus signals.[span_5](end_span)
          </li>
          <li>
            <strong>Sleep Support:</strong> A quieter, more relaxing profile
            [span_6](start_span)specifically designed to help you wind down before bed. [cite: 110,
            114]
          </li>
        </ul>
      ),
    },
    {
      question: "Can I use my own music?",
      answer:
        [cite_start]"Yes! Our external player integration allows you to embed playlists or tracks from services like Spotify, Apple Music, and YouTube directly into your therapy session.[span_6](end_span)",
    },
    {
      question: "How often should I use it?",
      answer:
        "Regular, short sessions are recommended. Consistent training can help your brain gradually reduce how intrusive the tinnitus feels in your daily life. [span_7](start_span)[span_8](start_span)You can also use it for quick 'reset' sessions when your tinnitus spikes.[span_7](end_span)[span_8](end_span)",
    },
    {
      question: "Is it safe to use with headphones?",
      answer:
        [span_9](start_span)"Yes, CalmTinnitus is built for use with headphones or mobile earpods at a safe, comfortable volume.[span_9](end_span)",
    },
  ];

  return (
    <main className="nq-qa-page">
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
            />
          </Link>
        </div>
        <nav className="nq-header-right">
          <Link href="/" className="nq-header-link">
            Home
          </Link>
          <Link href="/login" className="nq-header-link">
            Log in
          </Link>
          <Link href="/register" className="nq-header-btn">
            Register
          </Link>
        </nav>
      </header>

      {/* PAGE TITLE & IMAGE */}
      <section className="nq-hero">
        <h1>Frequently Asked Questions</h1>
        <p className="nq-lead">
          Learn more about how CalmTinnitus works and how it can help you find
          relief.
        </p>
        <div className="nq-hero-image-container">
          <Image
            src="/image_0.png"
            alt="CalmTinnitus Therapy Dashboard Interface"
            width={1120}
            height={630}
            className="nq-hero-image"
            priority
          />
        </div>
      </section>

      {/* Q&A SECTION */}
      <section className="nq-section">
        <div className="nq-faq-list">
          {faqs.map((faq, index) => (
            <details key={index} className="nq-faq-item">
              <summary className="nq-faq-question">
                {faq.question}
                <span className="nq-faq-icon">▼</span>
              </summary>
              <div className="nq-faq-answer">{faq.answer}</div>
            </details>
          ))}
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

      {/* STYLES */}
      <style jsx>{`
        .nq-qa-page {
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
          padding-bottom: 0.5rem;
          margin-bottom: 2.5rem;
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
          gap: 1rem;
          font-size: 0.9rem;
        }

        .nq-header-link {
          text-decoration: none;
          color: #0f172a;
          font-weight: 500;
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
          box-shadow: 0 4px 6px rgba(15, 23, 42, 0.1);
        }

        .nq-header-btn:hover {
          background: #020617;
        }

        /* HERO */
        .nq-hero {
          text-align: center;
          margin-bottom: 3rem;
        }

        .nq-hero h1 {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
          color: #0f172a;
        }

        .nq-lead {
          font-size: 1.1rem;
          color: #475569;
          margin-bottom: 2rem;
        }

        .nq-hero-image-container {
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .nq-hero-image {
          width: 100%;
          height: auto;
          display: block;
        }

        /* Q&A SECTION */
        .nq-section {
          margin-bottom: 3rem;
        }

        .nq-faq-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .nq-faq-item {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .nq-faq-question {
          padding: 1rem 1.25rem;
          font-weight: 600;
          color: #0f172a;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          list-style: none;
          background: #f8fafc;
        }

        .nq-faq-question::-webkit-details-marker {
          display: none;
        }

        .nq-faq-icon {
          font-size: 0.8rem;
          color: #64748b;
          transition: transform 0.2s;
        }

        details[open] .nq-faq-icon {
          transform: rotate(180deg);
        }

        .nq-faq-answer {
          padding: 1rem 1.25rem;
          color: #475569;
          line-height: 1.6;
          border-top: 1px solid #e2e8f0;
        }

        /* FOOTER */
        .nq-footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 1.4rem;
          font-size: 0.8rem;
          color: #6b7280;
          text-align: center;
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
          justify-content: center;
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

        @media (max-width: 768px) {
          .nq-header {
            flex-direction: column;
            gap: 0.75rem;
            margin-bottom: 2rem;
          }
          .nq-header-right {
            width: 100%;
            justify-content: center;
          }
          .nq-hero h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </main>
  );
}
