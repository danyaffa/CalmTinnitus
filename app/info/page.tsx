// /app/info/page.tsx
"use client";

import Link from "next/link";
import Footer from "../../components/Footer";

export default function InfoSafetyPage() {
  return (
    <main className="info-page">
      <h1>Information &amp; Safety</h1>

      <p className="intro">
        CalmTinnitus uses modern tinnitus neuromodulation approaches:
        <strong> Notch Therapy</strong> and
        <strong> Coordinated Reset (CR Therapy)</strong>.
        Below is a simple explanation of what each method does, why you may hear
        “ticks” or “holes,” and how to use the therapy safely.
      </p>

      {/* --- 1. NOTCH THERAPY --- */}
      <section>
        <h2>1. What does the “hole around your tinnitus pitch” mean?</h2>

        <p>
          Notch Therapy plays a continuous sound (usually pink noise) but
          <strong> removes a very narrow band</strong> of sound exactly where
          your tinnitus pitch is located. This removed band is the “hole.”
        </p>

        <ul>
          <li>Pink noise = all frequencies blended together.</li>
          <li>
            We mute a tiny slice of sound around your tinnitus frequency.
          </li>
          <li>
            This reduction tells the auditory brain to weaken the overactive
            neurons stuck on that pitch.
          </li>
        </ul>

        <p>
          Over time, this helps reduce the “gain” of that specific frequency,
          so the tinnitus signal becomes less dominant.  
          <strong>Notch Therapy does not replace medical care, but it is a
          researched sound tool that may help reduce loudness over time.</strong>
        </p>
      </section>

      {/* --- 2. CR THERAPY --- */}
      <section>
        <h2>2. Why does Relief (CR) Therapy produce ticks, knocks, or gaps?</h2>

        <p>
          CR (Coordinated Reset) Therapy uses short pulses of sound at several
          slightly different frequencies near your tinnitus pitch. These pulses
          happen in patterns — this is why you hear:
        </p>

        <ul>
          <li>Gentle “ticks”</li>
          <li>Soft “knocks”</li>
          <li>Very short interruptions (“holes”)</li>
        </ul>

        <p>
          These are <strong>normal and fully intentional</strong>.  
          Nothing is broken. Nothing is wrong with your speaker or headphones.
        </p>

        <p>
          CR pulses “disrupt” abnormal synchronous firing in the auditory cortex
          — the mechanism believed to sustain tinnitus.  
        </p>

        <p>
          You can think of CR Therapy as:
          <strong> “tapping the brain from different angles”</strong> to break
          the locked-in tinnitus rhythm and allow it to reset.
        </p>

        <p>
          <strong>Standard and Sleep modes do NOT include ticks.</strong>  
          Only Relief (CR) mode includes them because it is the neuromodulation
          mode for long-term improvement.
        </p>
      </section>

      {/* --- 3. BACKGROUND SOUND --- */}
      <section>
        <h2>3. Choosing your background sound</h2>

        <p>
          CalmTinnitus allows you to pick from{" "}
          <strong>pink noise, white noise, brown noise, rain, ocean waves, wind, or Spotify music</strong>.
        </p>

        <p>
          Choose what feels most comfortable — and keep the volume
          <strong> low and pleasant.</strong>
        </p>

        <p>
          You should ALWAYS be able to talk comfortably without raising your
          voice. If you must shout over the sound, it is too loud.
        </p>
      </section>

      {/* --- 4. SAFETY --- */}
      <section>
        <h2>4. Safety Guidelines</h2>

        <ul>
          <li>Use headphones or earphones you find comfortable.</li>
          <li>Keep therapy volume low — comfort is the priority.</li>
          <li>Do not run back-to-back long sessions without breaks.</li>
          <li>
            If your tinnitus becomes sharper or uncomfortable, pause the session
            and return later.
          </li>
          <li>
            For sudden hearing changes, ear pain, dizziness, or worsening
            tinnitus, seek medical help.
          </li>
        </ul>
      </section>

      {/* --- 5. DISCLAIMER --- */}
      <section>
        <h2>5. Important Note</h2>
        <p>
          CalmTinnitus is a self-help sound tool based on tinnitus
          neuromodulation research. It does NOT diagnose, cure, or treat any
          medical condition and is not a substitute for professional medical
          care.
        </p>
      </section>

      {/* --- BACK LINK --- */}
      <p className="back-link">
        <Link href="/therapy">← Back to therapy screen</Link>
      </p>

      <Footer variant="minimal" />

      {/* --- STYLES --- */}
      <style jsx>{`
        .info-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1.25rem 3rem;
          line-height: 1.6;
          font-size: 0.96rem;
        }
        h1 {
          font-size: 1.8rem;
          margin-bottom: 0.75rem;
        }
        h2 {
          font-size: 1.2rem;
          margin-top: 1.6rem;
          margin-bottom: 0.4rem;
        }
        ul {
          padding-left: 1.25rem;
        }
        .intro {
          color: #4b5563;
          margin-bottom: 1.4rem;
        }
        .back-link {
          margin-top: 2rem;
          font-size: 0.9rem;
        }
      `}</style>
    </main>
  );
}
