// app/research/page.tsx
"use client";

import Link from "next/link";

export default function ResearchPage() {
  const year = new Date().getFullYear();

  return (
    <main className="nq-research">
      <header className="nq-research-header">
        <h1>Tinnitus neuromodulation research</h1>
        <p>
          This page summarizes some of the published research behind sound-based
          neuromodulation for tinnitus, including notched-sound therapy, acoustic
          coordinated reset (CR) neuromodulation, and related sound therapies.
          It is informational only and not medical advice.
        </p>
        <p className="nq-research-back">
          <Link href="/" className="nq-link">
            ← Back to CalmTinnitus home
          </Link>
        </p>
      </header>

      <section className="nq-research-section">
        <h2>1. Notched sound / notched music therapy</h2>
        <p>
          Notched sound therapy plays pleasant audio (usually music) with a
          “notch” removed around the person&apos;s tinnitus frequency. The idea
          is to reduce over-activity of neurons tuned to that frequency over
          time.
        </p>
        <ul>
          <li>
            Early work showed that tailor-made notched music could reduce
            tinnitus loudness and related auditory cortex activity after weeks
            of daily listening.
            <a
              href="https://www.pnas.org/doi/10.1073/pnas.0911268107"
              target="_blank"
              rel="noreferrer"
            >
              {" "}
              (Okamoto et al., 2010)
            </a>
            .
          </li>
          <li>
            Later randomized trials found that notched music can help some
            patients, but does not always clearly outperform ordinary music for
            everyone.
            <a
              href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9450089/"
              target="_blank"
              rel="noreferrer"
            >
              {" "}
              (Therdphaothai et al., 2021)
            </a>
            .
          </li>
          <li>
            Recent systematic reviews suggest notched music / sound therapy is a{" "}
            <strong>promising, non-invasive option</strong> for some people, but
            more high-quality trials are still needed.
          </li>
        </ul>
      </section>

      <section className="nq-research-section">
        <h2>2. Acoustic coordinated reset (CR) neuromodulation</h2>
        <p>
          Acoustic CR plays brief tones around the tinnitus frequency in a
          specific pattern, aiming to “desynchronize” over-synchronous brain
          activity linked to tinnitus.
        </p>
        <ul>
          <li>
            Real-world and clinical studies have reported reductions in tinnitus
            loudness and handicap scores after weeks to months of daily CR sound
            therapy in many patients.
            <a
              href="https://www.hindawi.com/journals/ijoto/2015/569052/"
              target="_blank"
              rel="noreferrer"
            >
              {" "}
              (Hauptmann et al., 2015)
            </a>
            .
          </li>
          <li>
            EEG and modelling work shows CR patterns can weaken pathological
            network connectivity in tinnitus models.
            <a
              href="https://www.sciencedirect.com/science/article/pii/S1053811913002553"
              target="_blank"
              rel="noreferrer"
            >
              {" "}
              (Silchenko et al., 2013)
            </a>
            .
          </li>
          <li>
            Systematic reviews conclude that CR neuromodulation is generally{" "}
            <strong>safe and well tolerated</strong>, with many patients
            reporting improvement, but results vary and larger independent
            trials are still required.
          </li>
        </ul>
      </section>

      <section className="nq-research-section">
        <h2>3. General sound therapy & music-based approaches</h2>
        <p>
          Beyond specific algorithms, many studies and reviews look at sound
          therapy more broadly: masking sounds, enriched sound environments, and
          structured music-based programs.
        </p>
        <ul>
          <li>
            Reviews of sound therapy report that regular, personalized sound
            exposure can reduce tinnitus distress for many people, especially
            when combined with counselling or CBT.
          </li>
          <li>
            Meta-analyses of music therapy find overall reductions in tinnitus
            loudness and annoyance, though protocols differ between studies.
          </li>
          <li>
            A 2024 review of neuromodulation treatments notes that tinnitus is
            highly individual: techniques may help some patients a lot and
            others very little, and most work best as part of a{" "}
            <strong>multidisciplinary approach</strong> including hearing care,
            psychology, and coping strategies.
          </li>
        </ul>
      </section>

      <section className="nq-research-section nq-research-note">
        <h2>What this means for CalmTinnitus</h2>
        <p>
          CalmTinnitus is inspired by these neuromodulation approaches. It brings
          together tinnitus pitch matching, notched-style and CR-style sound
          patterns, and soothing soundscapes into a tool you can use at home.
        </p>
        <p>
          Research shows that <strong>regular, comfortable use over time</strong>{" "}
          is more important than any single session. Results can vary, and no
          sound app is a guaranteed cure — but for many people, sound-based
          training is one helpful part of long-term tinnitus management.
        </p>
      </section>

      <footer className="nq-research-footer">
        <p>
          © {year} Leffler International Investments Pty Ltd. CalmTinnitus™ is not
          a medical device and does not replace professional diagnosis or
          treatment.
        </p>
      </footer>

      <style jsx>{`
        .nq-research {
          max-width: 960px;
          margin: 0 auto;
          padding: 1.5rem 1rem 2.5rem;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .nq-research-header h1 {
          font-size: 1.8rem;
          margin-bottom: 0.6rem;
        }

        .nq-research-header p {
          font-size: 0.98rem;
          color: #4b5563;
          line-height: 1.5;
        }

        .nq-research-back {
          margin-top: 0.75rem;
        }

        .nq-link {
          color: #0369a1;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .nq-research-section {
          margin-top: 1.75rem;
          font-size: 0.96rem;
          color: #374151;
          line-height: 1.6;
        }

        .nq-research-section h2 {
          font-size: 1.25rem;
          margin-bottom: 0.4rem;
        }

        .nq-research-section ul {
          margin: 0.5rem 0 0;
          padding-left: 1.3rem;
        }

        .nq-research-section li + li {
          margin-top: 0.4rem;
        }

        .nq-research-section a {
          color: #0369a1;
        }

        .nq-research-section a:hover {
          text-decoration: underline;
        }

        .nq-research-note {
          background: #f3f4f6;
          border-radius: 0.9rem;
          padding: 1rem 1rem 1.1rem;
        }

        .nq-research-footer {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
          font-size: 0.8rem;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .nq-research {
            padding: 1.25rem 0.85rem 2.2rem;
          }

          .nq-research-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </main>
  );
}
