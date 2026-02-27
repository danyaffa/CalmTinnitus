// app/research/page.tsx
"use client";

import Link from "next/link";
import Footer from "../../components/Footer";

export default function ResearchPage() {
  return (
    <main className="nq-research">
      <header className="nq-research-header">
        <h1>Tinnitus neuromodulation research</h1>
        <p>
          This page summarizes key research behind sound-based neuromodulation
          for tinnitus, including notched-sound therapy, acoustic coordinated
          reset (CR) neuromodulation, residual inhibition, and stress-reduction
          approaches. It is informational only and not medical advice.
        </p>
        <p className="nq-research-back">
          <Link href="/" className="nq-link">
            ← Back to CalmTinnitus home
          </Link>
        </p>
      </header>

      {/* 1. Notched sound / notched music */}
      <section className="nq-research-section">
        <h2>1. Notched sound / notched music therapy</h2>
        <p>
          Notched sound therapy plays pleasant audio (often music or noise) with
          a “notch” removed around the person&apos;s tinnitus frequency. The
          goal is to reduce over-activity of neurons tuned to that frequency
          over time (lateral inhibition).
        </p>
        <ul>
          <li>
            Early work showed that tailor-made notched music could reduce
            tinnitus loudness and related auditory cortex activity after weeks
            of daily listening
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
            everyone
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
            <strong>promising, non-invasive option</strong> for a subset of
            people, but more high-quality trials are still needed.
          </li>
        </ul>
      </section>

      {/* 2. Acoustic CR neuromodulation */}
      <section className="nq-research-section">
        <h2>2. Acoustic coordinated reset (CR) neuromodulation</h2>
        <p>
          Acoustic CR plays brief tones around the tinnitus frequency in a
          specific timing pattern, aiming to “desynchronize” overly synchronous
          brain activity linked to tinnitus.
        </p>
        <ul>
          <li>
            Real-world and clinical studies have reported reductions in tinnitus
            loudness and handicap scores after weeks to months of daily CR sound
            therapy in many patients
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
            network connectivity in tinnitus models
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
            Reviews conclude that CR neuromodulation is generally{" "}
            <strong>safe and well tolerated</strong>, with many patients
            reporting improvement, but results vary and larger independent
            trials are still required.
          </li>
        </ul>
      </section>

      {/* 3. Residual inhibition & masking / coloured noise */}
      <section className="nq-research-section">
        <h2>3. Residual inhibition & coloured-noise masking</h2>
        <p>
          Many people notice that tinnitus becomes quieter for a short time
          after listening to another sound. This effect is called{" "}
          <strong>residual inhibition (RI)</strong>.
        </p>
        <ul>
          <li>
            RI is thought to occur when external sound temporarily overrides
            abnormal activity in the auditory system; after the sound stops,
            tinnitus can remain reduced for seconds to minutes in some people.
          </li>
          <li>
            Coloured noises (white, pink, brown) distribute energy differently
            across frequencies. Deeper sounds such as{" "}
            <strong>brown noise</strong> are often reported as especially
            soothing and useful for “masking” high-pitch tinnitus and for
            sleep-onset.
          </li>
          <li>
            Reviews of sound therapy report that regular, comfortable sound
            exposure can reduce tinnitus distress for many people, especially
            when combined with education and counselling.
          </li>
        </ul>
      </section>

      {/* 4. Phase cancellation vs. neural inhibition */}
      <section className="nq-research-section">
        <h2>4. “Phase cancellation” versus brain-based mechanisms</h2>
        <p>
          In acoustics, phase cancellation means playing an opposite (“anti-
          phase”) sound wave to physically cancel an external sound. Subjective
          tinnitus is different: it is generated inside the brain, not in the
          air in front of the ear.
        </p>
        <ul>
          <li>
            Because tinnitus is a neural signal, there is no external sound wave
            that can be physically “cancelled” by playing an opposite phase
            signal. Noise-cancelling headphones can reduce outside noise, but
            they do <em>not</em> erase tinnitus and can even make it more
            obvious in very quiet environments.
          </li>
          <li>
            Several clinical studies have tested “phase-shift” or
            phase-cancellation style tone therapies. When properly controlled,
            these approaches generally do{" "}
            <strong>no better than ordinary tones</strong>, and in a few cases
            have even increased perceived loudness for some users.
          </li>
          <li>
            Modern tinnitus apps therefore focus on{" "}
            <strong>neural modulation</strong> mechanisms instead: lateral
            inhibition (notched sound), residual inhibition, and rhythmic
            entrainment, rather than literal acoustic cancellation.
          </li>
        </ul>
      </section>

      {/* 5. Brain rhythms, entrainment & stress / CBT */}
      <section className="nq-research-section">
        <h2>5. Brain rhythms, stress and CBT-based support</h2>
        <p>
          Tinnitus is not only a hearing issue; it is strongly linked to
          attention, stress and the brain&apos;s rhythmic activity.
        </p>
        <ul>
          <li>
            EEG studies suggest that many people with bothersome tinnitus show
            reduced calming <strong>alpha</strong> activity (around 8–12 Hz) and
            increased fast <strong>gamma</strong> activity in auditory areas.
            Sound that is gently modulated at about 10 Hz may help “entrain”
            more normal alpha rhythms in some users.
          </li>
          <li>
            Cognitive-behavioural therapy (CBT) and related approaches (such as
            acceptance-based and mindfulness-based therapies) have a strong
            evidence base for <strong>reducing tinnitus distress</strong> even
            when the sound itself does not disappear. They work by changing the
            way the brain interprets the tinnitus signal and by reducing
            arousal.
          </li>
          <li>
            Short “micro-calm” exercises—breathing, muscle relaxation, brief
            reframing prompts—are increasingly used in apps to help users break
            the stress–tinnitus cycle in day-to-day life.
          </li>
        </ul>
      </section>

      {/* 6. Stochastic Resonance */}
      <section className="nq-research-section">
        <h2>6. Stochastic resonance &amp; near-threshold noise</h2>
        <p>
          Stochastic resonance (SR) is a phenomenon where adding a small amount
          of noise to a system can actually improve signal detection. In the
          context of tinnitus, the brain may upregulate internal neural noise to
          compensate for hearing loss &mdash; and this upregulated noise may be
          perceived as tinnitus.
        </p>
        <ul>
          <li>
            Providing external acoustic noise spectrally shaped to the
            individual&apos;s hearing loss profile at near-threshold levels may
            substitute for internally generated noise, reducing tinnitus
            perception
            <a href="https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2022.831581/full" target="_blank" rel="noreferrer"> (Tziridis et al., 2022)</a>.
          </li>
          <li>
            In proof-of-concept testing, <strong>21 of 24 patients</strong> experienced
            tinnitus loudness attenuation, with 6 reporting complete silencing during stimulation.
          </li>
          <li>
            A 2025 blinded crossover trial using cross-frequency de-correlating sound
            modulation found statistically significant tinnitus loudness reduction
            <a href="https://pubmed.ncbi.nlm.nih.gov/40505169/" target="_blank" rel="noreferrer"> (Yukhnovich &amp; Sedley et al., 2025)</a>.
          </li>
        </ul>
      </section>

      {/* 7. MBCT */}
      <section className="nq-research-section">
        <h2>7. Mindfulness-Based Cognitive Therapy (MBCT) for tinnitus</h2>
        <p>
          MBCT adapts mindfulness meditation techniques specifically for people
          with tinnitus, teaching non-reactive awareness and reducing emotional distress.
        </p>
        <ul>
          <li>
            A systematic review of 7 studies (425 patients) found statistically
            significant reductions in tinnitus distress in multiple RCTs
            <a href="https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2019.01135/full" target="_blank" rel="noreferrer"> (Rademaker et al., 2019)</a>.
          </li>
          <li>
            The key RCT (McKenna et al., 2017) found MBCT produced <strong>significantly
            greater tinnitus severity reduction</strong> than relaxation training alone.
          </li>
          <li>
            MBCT&apos;s acceptance-based approach is complementary to CBT and can be
            delivered effectively via digital apps.
          </li>
        </ul>
      </section>

      {/* 8. PTM */}
      <section className="nq-research-section">
        <h2>8. Progressive Tinnitus Management (PTM)</h2>
        <p>
          PTM is a stepped-care model developed by the VA, combining education,
          sound therapy guidance, and coping skills at levels matched to severity.
        </p>
        <ul>
          <li>
            Two RCTs validated PTM, with a telehealth trial (n=205) achieving
            <strong> large effect sizes (d=1.06&ndash;1.20)</strong> at 3&ndash;6 months
            <a href="https://pubmed.ncbi.nlm.nih.gov/29847413/" target="_blank" rel="noreferrer"> (Henry et al., 2019)</a>.
          </li>
          <li>
            PTM emphasises that <strong>education is the most powerful ingredient</strong>
            in tinnitus management.
          </li>
        </ul>
      </section>

      {/* 9. App trials */}
      <section className="nq-research-section">
        <h2>9. App-based tinnitus therapy: 2024&ndash;2025 clinical trials</h2>
        <p>
          Multiple recent RCTs have validated smartphone-based delivery of tinnitus interventions.
        </p>
        <ul>
          <li>
            The Kalmeda app RCT (n=187) reported <strong>d=1.38</strong> at 9 months
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11888023/" target="_blank" rel="noreferrer"> (Walter et al., 2025)</a>.
          </li>
          <li>
            The UNITI multicentre trial (n=461) found combination treatments outperformed single treatments
            <a href="https://www.nature.com/articles/s41467-025-66165-1" target="_blank" rel="noreferrer"> (Schoisswohl et al., 2025)</a>.
          </li>
          <li>
            These trials confirm that <strong>consistent daily app use over months</strong> is the key
            predictor of improvement.
          </li>
        </ul>
      </section>

      {/* What this means for CalmTinnitus */}
      <section className="nq-research-section nq-research-note">
        <h2>What this means for CalmTinnitus</h2>
        <p>
          CalmTinnitus is inspired by these neuromodulation approaches. The app
          first helps you <strong>match your tinnitus pitch</strong> using a
          guided calibration. That frequency then drives the sound modes.
        </p>
        <p>The therapy modes in CalmTinnitus are designed to align with the research above:</p>
        <ul>
          <li><strong>Relief (CR) Therapy</strong> &mdash; coordinated reset patterns for neural desynchronisation and habituation.</li>
          <li><strong>Standard Therapy (Comfort)</strong> &mdash; gentle background sound with coloured-noise masking for residual inhibition.</li>
          <li><strong>Sleep Support</strong> &mdash; quieter profiles designed for overnight use.</li>
          <li><strong>Stochastic Resonance (SR)</strong> &mdash; near-threshold noise shaped to your hearing profile (section 6).</li>
          <li><strong>Mindfulness (MBCT) Program</strong> &mdash; 8-week guided mindfulness with tinnitus-specific exercises (section 7).</li>
          <li><strong>Screening &amp; Education (PTM)</strong> &mdash; severity screening with stepped recommendations and educational modules (section 8).</li>
          <li><strong>Play your own audio</strong> &mdash; combine therapy with your preferred music, podcasts or nature sounds.</li>
        </ul>
        <p>
          Research shows that <strong>regular, comfortable use over time</strong>{" "}
          is more important than any single session. Results vary between
          individuals, and no sound app is a guaranteed cure &mdash; but for many
          people, sound-based training plus mindfulness and education tools are a
          helpful part of long-term tinnitus management.
        </p>
      </section>


      <Footer variant="full" />

      {/* Styles */}
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
