// /app/qa/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Footer from "../../components/Footer";

const ALL_FAQS = [
  // App & Therapy
  {
    category: "Therapy & Usage",
    q: "Does CalmTinnitus cure tinnitus?",
    a: "No. There is currently no guaranteed cure for tinnitus. CalmTinnitus is a sound-training tool that may help some people reduce how loud or intrusive their tinnitus feels and improve focus or sleep over time.",
  },
  {
    category: "Therapy & Usage",
    q: "Why do I hear 'ticking', 'clicks', or 'gaps' in the sound?",
    a: "If you are using 'Relief (CR) Therapy' mode, this is intentional. These short, quiet interruptions are part of the neuromodulation process designed to disrupt the brain's tinnitus activity. If you find them distracting, you can switch to 'Standard Therapy' for a smooth, continuous masking sound.",
  },
  {
    category: "Therapy & Usage",
    q: "What is the correct volume level for the therapy?",
    a: "Keep the therapy sound comfortable and never loud. You should still hear normal sounds around you. The ticks in Relief (CR) mode should be soft but noticeable. The best rule is: 'Just loud enough to hear it, but soft enough to ignore it.' Loud volume does not make the treatment stronger, so keep it gentle.",
  },
  {
    category: "Therapy & Usage",
    q: "What happens when the timer finishes?",
    a: "The sound will stop automatically, and you will hear a gentle voice alert (or beep) confirming the session is over. For the best therapeutic results, we recommend waiting 3 to 4 hours between these focused sessions.",
  },
  {
    category: "Therapy & Usage",
    q: "How often should I use the therapy?",
    a: "Most people benefit from short daily sessions. For example, 15–30 minutes once or twice a day. Consistency is key—try to stick to a routine rather than doing very long sessions all at once.",
  },
  {
    category: "Therapy & Usage",
    q: "What are the 3 therapy modes?",
    a: "Relief (CR) uses coordinated reset neuromodulation with intentional gaps to retrain your brain. Standard provides continuous masking sound at your tinnitus pitch. Sleep Support uses softer sounds with no ticking, designed to help you fall asleep.",
  },
  {
    category: "Therapy & Usage",
    q: "What background sounds are available?",
    a: "CalmTinnitus includes white noise, soft rain, and ocean waves as background sounds. You can also choose 'No Background' to use the therapy tone by itself, or pair it with your own music.",
  },
  {
    category: "Therapy & Usage",
    q: "Can I use CalmTinnitus while falling asleep?",
    a: "Yes. Many users choose the 'Sleep Support' mode, which uses softer background sounds and no ticking. Set the timer so it turns off automatically after you drift off.",
  },
  // Safety
  {
    category: "Safety & Health",
    q: "Is the therapy safe for my hearing?",
    a: "Always keep the volume at a comfortable, safe level where you can still hear outside sounds. If you have any existing hearing or ear conditions, ask your hearing-care professional before starting.",
  },
  {
    category: "Safety & Health",
    q: "Do I need headphones or can I use speakers?",
    a: "Headphones or in-ear buds usually work best because the sound can be delivered more precisely at your tinnitus pitch. However, if headphones are uncomfortable, you can use external speakers at a gentle volume.",
  },
  {
    category: "Safety & Health",
    q: "What if I wear hearing aids or have hearing loss?",
    a: "You can usually still use CalmTinnitus. Many people listen through their hearing aids using a streamer or directly through headphones at a low level. If you are unsure, speak with your audiologist for personalised advice.",
  },
  {
    category: "Safety & Health",
    q: "How long before I may notice any change?",
    a: "Everyone is different. Some users feel a little relief within days when they use the tool during spikes or before bed. For others, it can take weeks or months of regular training before tinnitus feels less intrusive.",
  },
  {
    category: "Safety & Health",
    q: "Who should NOT use this app?",
    a: "If you have sudden hearing loss, severe dizziness, strong ear pain, drainage, or a major change in tinnitus, stop and see a doctor or ENT urgently. People with very strong sound sensitivity (hyperacusis) should begin only under professional guidance.",
  },
  {
    category: "Safety & Health",
    q: "Is CalmTinnitus a medical device?",
    a: "No. CalmTinnitus is a self-guided wellness and sound-training tool for adults. It does not diagnose, treat, cure, or prevent any disease and is not a substitute for medical care or professional mental-health support.",
  },
  // Account & Billing
  {
    category: "Account & Billing",
    q: "How does the 14-day free trial work?",
    a: "When you register, you get full access to all CalmTinnitus features for 14 days with no payment required. After the trial, you can subscribe for $8/month via PayPal to continue using the app.",
  },
  {
    category: "Account & Billing",
    q: "How does billing work and can I cancel?",
    a: "CalmTinnitus is offered as a simple monthly subscription at $8/month after the 14-day free trial. You can cancel any time from your PayPal account. Your access will continue until the end of the current billing period.",
  },
  {
    category: "Account & Billing",
    q: "How do I stop or delete my account?",
    a: "Go to Account Settings from the footer menu or navigate to /settings. There you will find a 'Stop / Delete My Account' button. This will permanently remove all your data, session history, and account from CalmTinnitus. The action is instant and automatic through Firebase.",
  },
  {
    category: "Account & Billing",
    q: "What happens to my data when I delete my account?",
    a: "All your data is permanently removed, including your user profile, session logs, therapy notes, and any reviews. Your Firebase authentication account is also deleted. This cannot be undone.",
  },
  {
    category: "Account & Billing",
    q: "Can I use CalmTinnitus on multiple devices?",
    a: "Yes. CalmTinnitus works on any device with a web browser. You can also install it as a progressive web app on your phone or tablet, or use the Android app. Just log in with the same account.",
  },
  // Privacy & Data
  {
    category: "Privacy & Data",
    q: "What data does CalmTinnitus collect?",
    a: "CalmTinnitus collects minimal data: your email, name, and account preferences. Therapy session data is stored locally on your device. We do not collect, store, or share personal therapy content on our servers.",
  },
  {
    category: "Privacy & Data",
    q: "Is my data shared with third parties?",
    a: "No. Your personal data is not shared with third parties. We use Firebase for authentication and data storage, and PayPal for payment processing. Neither receives your therapy session data.",
  },
  {
    category: "Privacy & Data",
    q: "How is my payment information handled?",
    a: "All payments are processed securely by PayPal. CalmTinnitus never sees or stores your credit card or bank details. You can manage your subscription directly from your PayPal account.",
  },
  // Features
  {
    category: "Features",
    q: "What is the pitch matching tool?",
    a: "The pitch matcher helps you find the frequency that most closely matches your tinnitus sound. This frequency becomes the target for your therapy sessions, making the treatment more personalised and effective.",
  },
  {
    category: "Features",
    q: "What is Low Stimulation Mode?",
    a: "Low Stimulation Mode reduces visual animations and contrast on the app for days when you are particularly sensitive. You can toggle it from the home page header.",
  },
  {
    category: "Features",
    q: "What is the 7-30 Day Program?",
    a: "The progressive training program helps you build a consistent therapy habit. It starts with shorter sessions and gradually increases, helping you develop a daily routine that supports long-term tinnitus management.",
  },
];

export default function QaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ALL_FAQS.map((f) => f.category)));
    return ["All", ...cats];
  }, []);

  const filteredFaqs = useMemo(() => {
    let results = ALL_FAQS;

    if (selectedCategory !== "All") {
      results = results.filter((f) => f.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (f) =>
          f.q.toLowerCase().includes(q) ||
          f.a.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }

    return results;
  }, [searchQuery, selectedCategory]);

  return (
    <main className="nq-qa-root">
      <div className="nq-qa-shell">
        {/* HEADER STRIP */}
        <header className="nq-qa-header">
          <a href="/" className="nq-qa-logo-link">
            <img
              src="/CalmTinnitus-Logo.png"
              alt="CalmTinnitus – Silence Starts Now"
              width={140}
              height={140}
              className="nq-qa-logo"
            />
          </a>
          <nav className="nq-qa-nav">
            <a href="/" className="nq-qa-nav-link">
              Home
            </a>
            <a href="/research" className="nq-qa-nav-link">
              Research
            </a>
            <a href="/login" className="nq-qa-nav-link">
              Log in
            </a>
            <a href="/register" className="nq-qa-nav-cta">
              Register
            </a>
          </nav>
        </header>

        {/* HERO AREA */}
        <section className="nq-qa-hero">
          <div className="nq-qa-hero-text">
            <h1>AI-Powered FAQ</h1>
            <p>
              Get instant answers about CalmTinnitus, tinnitus therapy, account
              management, safety, and more. Search or browse by category below.
            </p>
          </div>
          <div className="nq-qa-hero-image">
            <img
              src="/Therapy.png"
              alt="CalmTinnitus therapy interface"
              width={520}
              height={360}
              className="nq-qa-therapy-image"
            />
          </div>
        </section>

        {/* SEARCH BAR */}
        <section className="nq-qa-search-section">
          <div className="nq-qa-search-wrap">
            <input
              type="text"
              className="nq-qa-search-input"
              placeholder="Search for answers… e.g. 'free trial', 'sleep mode', 'delete account'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="nq-qa-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* CATEGORY PILLS */}
          <div className="nq-qa-categories">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`nq-qa-cat-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* FAQ LIST */}
        <section className="nq-qa-faq-section">
          <h2>
            {searchQuery
              ? `${filteredFaqs.length} result${filteredFaqs.length !== 1 ? "s" : ""} found`
              : selectedCategory === "All"
              ? `All questions (${filteredFaqs.length})`
              : `${selectedCategory} (${filteredFaqs.length})`}
          </h2>

          {filteredFaqs.length === 0 ? (
            <div className="nq-qa-no-results">
              <p>No matching questions found.</p>
              <p>Try different keywords or browse all categories.</p>
              <button
                className="nq-qa-reset-btn"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
              >
                Show all questions
              </button>
            </div>
          ) : (
            <div className="nq-qa-faq-list">
              {filteredFaqs.map((item) => (
                <details key={item.q} className="nq-qa-faq-item">
                  <summary className="nq-qa-faq-question">
                    <span className="nq-qa-faq-cat-tag">{item.category}</span>
                    {item.q}
                  </summary>
                  <p className="nq-qa-faq-answer">{item.a}</p>
                </details>
              ))}
            </div>
          )}

          <p className="nq-qa-note">
            CalmTinnitus can be one helpful piece of your toolkit, alongside
            hearing care, stress management, and good sleep habits. If you are
            ever unsure, talk with your doctor, audiologist, or therapist.
          </p>
        </section>
      </div>

      {/* FOOTER */}
      <Footer variant="full" />

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

        /* SEARCH */
        .nq-qa-search-section {
          margin-top: 1.8rem;
          margin-bottom: 1.2rem;
        }

        .nq-qa-search-wrap {
          position: relative;
          max-width: 600px;
        }

        .nq-qa-search-input {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          border-radius: 999px;
          border: 2px solid #bae6fd;
          background: white;
          font-size: 0.95rem;
          outline: none;
          box-shadow: 0 4px 16px rgba(14, 165, 233, 0.12);
          transition: border-color 0.2s;
        }

        .nq-qa-search-input:focus {
          border-color: #0ea5e9;
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.2);
        }

        .nq-qa-search-clear {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.4rem;
          cursor: pointer;
          color: #94a3b8;
          line-height: 1;
        }

        .nq-qa-search-clear:hover {
          color: #475569;
        }

        /* CATEGORIES */
        .nq-qa-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .nq-qa-cat-pill {
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: white;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .nq-qa-cat-pill:hover {
          background: #f1f5f9;
        }

        .nq-qa-cat-pill.active {
          background: #0369a1;
          color: white;
          border-color: #0369a1;
        }

        /* FAQ */
        .nq-qa-faq-section {
          margin-top: 1.6rem;
        }

        .nq-qa-faq-section h2 {
          font-size: 1.3rem;
          margin-bottom: 1rem;
          color: #0f172a;
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
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .nq-qa-faq-cat-tag {
          display: inline-block;
          padding: 0.15rem 0.55rem;
          border-radius: 999px;
          background: #e0f2fe;
          color: #0369a1;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .nq-qa-faq-item summary::-webkit-details-marker {
          display: none;
        }

        .nq-qa-faq-item summary::after {
          content: "+";
          margin-left: auto;
          font-weight: 700;
          color: #64748b;
          flex-shrink: 0;
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

        .nq-qa-no-results {
          text-align: center;
          padding: 2rem 1rem;
          color: #64748b;
        }

        .nq-qa-no-results p {
          margin: 0 0 0.5rem;
        }

        .nq-qa-reset-btn {
          margin-top: 0.75rem;
          padding: 0.5rem 1.2rem;
          border-radius: 999px;
          border: 1px solid #0369a1;
          background: white;
          color: #0369a1;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.88rem;
        }

        .nq-qa-reset-btn:hover {
          background: #f0f9ff;
        }

        .nq-qa-note {
          margin-top: 1.1rem;
          font-size: 0.85rem;
          color: #6b7280;
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
