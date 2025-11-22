// /app/qa/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export default function QaPage() {
  const year = new Date().getFullYear();

  const faqs = [
    {
      q: "Does CalmTinnitus cure tinnitus?",
      a: "No. There is currently no guaranteed cure for tinnitus. CalmTinnitus is a sound-training tool that may help some people reduce how loud or intrusive their tinnitus feels and improve focus or sleep over time.",
    },
    {
      q: "How often should I use the therapy?",
      a: "Most people benefit from short daily sessions. For example, 15–30 minutes once or twice a day, plus an extra calming session when tinnitus spikes or before sleep.",
    },
    {
      q: "Is the therapy safe for my hearing?",
      a: "Always keep the volume at a comfortable, safe level where you can still hear outside sounds. If you have any existing hearing or ear conditions, ask your hearing-care professional before starting.",
    },
    {
      q: "Do I need headphones or can I use speakers?",
      a: "Headphones or in-ear buds usually work best because the sound can be delivered more precisely at your tinnitus pitch. However, if headphones are uncomfortable, you can use external speakers at a gentle volume.",
    },
    {
      q: "What if I wear hearing aids or have hearing loss?",
      a: "You can usually still use CalmTinnitus. Many people listen through their hearing aids using a streamer or directly through headphones at a low level. If you are unsure, speak with your audiologist for personalised advice.",
    },
    {
      q: "How long before I may notice any change?",
      a: "Everyone is different. Some users feel a little relief within days when they use the tool during spikes or before bed. For others, it can take weeks or months of regular training before tinnitus feels less intrusive.",
    },
    {
      q: "Can I use CalmTinnitus while falling asleep?",
      a: "Yes. Many users choose the sleep-support mode with softer background sound and a session timer so the sound fades after a set period. Never use headphones that could be physically uncomfortable while sleeping.",
    },
    {
      q: "Who should NOT use this app?",
      a: "If you have sudden hearing loss, severe dizziness, strong ear pain, drainage, or a major change in tinnitus, stop and see a doctor or ENT urgently. People with very strong sound sensitivity (hyperacusis) should begin only under professional guidance.",
    },
    {
      q: "Is CalmTinnitus a medical device?",
      a: "No. CalmTinnitus is a self-guided wellness and sound-training tool for adults. It does not diagnose, treat, cure, or prevent any disease and is not a substitute for medical care or professional mental-health support.",
    },
    {
      q: "How does billing work and can I cancel?",
      a: "CalmTinnitus is offered as a simple monthly subscription. You can cancel any time; your access will continue until the end of the current billing period.",
    },
  ];

  return (
    <main className="nq-qa-root">
      <div className="nq-qa-shell">
        {/* HEADER STRIP */}
        <header className="nq-qa-header">
          <Link href="/" className="nq-qa-logo-link">
            <Image
              src="/CalmTinnitus-Logo.png"
              alt="CalmTinnitus – Silence Starts Now"
              width={140}
              height={140}
              className="nq-qa-logo"
            />
          </Link>
          <nav className="nq-qa-nav">
            <Link href="/" className="nq-qa-nav-link">
              Home
            </Link>
            <Link href="/research" className="nq-qa-nav-link">
              Research
            </Link>
            <Link href="/login" className="nq-qa-nav-link">
              Log in
            </Link>
            <Link href="/register" className="nq-qa-nav-cta">
              Register
            </Link>
          </nav>
        </header>

        {/* HERO AREA */}
        <section className="nq-qa-hero">
          <div className="nq-qa-hero-text">
            <h1>Questions &amp; Answers</h1>
            <p>
              Here you can find clear, honest answers about how CalmTinnitus
              works, how to use it, and what you can realistically expect. It is
              written by someone who lives with tinnitus every day.
            </p>
          </div>
          <div className="nq-qa-hero-image">
            <Image
              src="/Therapy.png"
              alt="CalmTinnitus therapy interface"
              width={520}
              height={360}
              className="nq-qa-therapy-image"
            />
          </div>
        </section>

        {/* FAQ LIST */}
        <section className="nq-qa-faq-section">
          <h2>Common questions from tinnitus sufferers</h2>
          <div className="nq-qa-faq-list">
            {faqs.map((item) => (
              <details key={item.q} className="nq-qa-faq-item">
                <summary className="nq-qa-faq-question">
                  {item.q}
                </summary>
                <p className="nq-qa-faq-answer">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="nq-qa-note">
            CalmTinnitus can be one helpful piece of your toolkit, alongside
            hearing care, stress management, and good sleep habits. If you are
            ever unsure, talk with your doctor, audiologist, or therapist.
          </p>
        </section>
      </div>

      {/* FOOTER (MATCH STYLE) */}
      <footer className="nq-qa-footer">
        <div className="nq-qa-footer-main">
          <span>
            © {year} Leffler International Investments Pty Ltd. All rights
            reserved.
          </span>
          <span>CalmTinnitus™ – Tinnitus Relief Companion.</span>
        </div>
        <div className="nq-qa-footer-links">
          <Link href="/about">About</Link>
          <Link href="/research">Research</Link>
          <Link href="/legal">Legal</Link>
          <Link href="/disclaimers">Disclaimers</Link>
          <Link href="/company-policy">Company Policy</Link>
        </div>
        <p className="nq-qa-footer-note">
          CalmTinnitus™ is a wellness sound tool and does not diagnose, treat,
          cure, or prevent disease. Always follow the advice of your healthcare
          professionals.
        </p>
      </footer>

      <style jsx>{`
        .nq-qa-root {
          max-width: 1120px;
          margin: 0 auto;
          padding: 1.25rem 1rem 2.5rem;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .nq-qa-shell {
          background: radial-gradient(
              circle at top left,
              rgba(125, 211, 252, 0.3),
              transparent 55%
            ),
            linear-gradient(135deg, #f3fbff, #f6f4ff);
          border-radius: 1.5rem;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16);
          padding: 1.3rem 1.4rem 2.1rem;
          margin-bottom: 2.4rem;
        }

        .nq-qa-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding-bottom: 0.6rem;
          margin-bottom: 1.3rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.3);
        }

        .nq-qa-logo-link {
          display: inline-flex;
          align-items: center;
        }

        .nq-qa-logo {
          width: 160px;
          height: auto;
        }

        .nq-qa-nav {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.9rem;
        }

        .nq-qa-nav-link {
          text-decoration: none;
          color: #0f172a;
        }

        .nq-qa-nav-link:hover {
          text-decoration: underline;
        }

        .nq-qa-nav-cta {
          padding: 0.4rem 0.95rem;
          border-radius: 999px;
          background: #0f172a;
          color: #f9fafb;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.85rem;
          white-space: nowrap;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.32);
        }

        .nq-qa-nav-cta:hover {
          background: #020617;
        }

        .nq-qa-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 2rem;
          align-items: center;
          margin-top: 0.4rem;
        }

        .nq-qa-hero-text h1 {
          font-size: 2.2rem;
          margin: 0 0 0.6rem;
          color: #020617;
        }

        .nq-qa-hero-text p {
          margin: 0;
          font-size: 1rem;
          line-height: 1.6;
          color: #1f2933;
        }

        .nq-qa-hero-image {
          display: flex;
          justify-content: center;
        }

        .nq-qa-therapy-image {
          width: 100%;
          max-width: 520px;
          height: auto;
          border-radius: 1.4rem;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.45);
        }

        .nq-qa-faq-section {
          margin-top: 2.2rem;
        }

        .nq-qa-faq-section h2 {
          font-size: 1.6rem;
          margin-bottom: 1rem;
        }

        .nq-qa-faq-list {
          display: grid;
          gap: 0.75rem;
        }

        .nq-qa-faq-item {
          border-radius: 0.9rem;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          padding: 0.9rem 1rem;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
        }

        .nq-qa-faq-question {
          cursor: pointer;
          list-style: none;
          font-weight: 600;
          color: #0f172a;
        }

        .nq-qa-faq-item summary::-webkit-details-marker {
          display: none;
        }

        .nq-qa-faq-item summary::after {
          content: "+";
          float: right;
          font-weight: 700;
          color: #64748b;
        }

        .nq-qa-faq-item[open] summary::after {
          content: "–";
        }

        .nq-qa-faq-answer {
          margin-top: 0.55rem;
          font-size: 0.95rem;
          line-height: 1.55;
          color: #4b5563;
        }

        .nq-qa-note {
          margin-top: 1.1rem;
          font-size: 0.85rem;
          color: #6b7280;
        }

        .nq-qa-footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 1.1rem;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .nq-qa-footer-main {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.75rem;
        }

        .nq-qa-footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 0.6rem;
        }

        .nq-qa-footer-links a {
          color: #4b5563;
          text-decoration: none;
        }

        .nq-qa-footer-links a:hover {
          text-decoration: underline;
        }

        .nq-qa-footer-note {
          margin: 0;
        }

        @media (max-width: 768px) {
          .nq-qa-root {
            padding: 1rem 0.8rem 2.1rem;
          }

          .nq-qa-shell {
            padding: 1rem 0.9rem 1.8rem;
            margin-bottom: 2rem;
          }

          .nq-qa-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .nq-qa-nav {
            align-self: flex-end;
          }

          .nq-qa-hero {
            grid-template-columns: minmax(0, 1fr);
            gap: 1.6rem;
          }

          .nq-qa-hero-image {
            order: -1;
          }

          .nq-qa-hero-text h1 {
            font-size: 1.9rem;
          }
        }
      `}</style>
    </main>
  );
}
