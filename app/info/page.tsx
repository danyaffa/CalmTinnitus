// /app/info/page.tsx

import Link from "next/link";

export default function InfoSafetyPage() {
  return (
    <main className="info-page">
      <h1>Information &amp; Safety</h1>
      <p className="intro">
        NeuroQuiet uses tinnitus neuromodulation sound approaches (Notch Therapy
        and Coordinated Reset, “CR”). This page explains in plain language what
        they mean and how to use them safely.
      </p>

      <section>
        <h2>1. What does “a narrow hole at your tinnitus pitch” mean?</h2>
        <p>
          Your tinnitus usually has a specific frequency (pitch). Notch Therapy
          plays continuous sound (typically pink noise) but removes a very small
          band of sound exactly around that pitch.
        </p>
        <ul>
          <li>Full pink noise = all frequencies together.</li>
          <li>
            We remove (mute) a tiny band around your tinnitus pitch — this is
            the “hole”.
          </li>
          <li>
            The missing band tells your brain to reduce the hyperactive neurons
            that are locked onto that pitch.
          </li>
        </ul>
        <p>
          Over time, this can help the brain “turn down the gain” on that
          frequency so the tinnitus signal becomes less dominant. It is a
          research-based sound approach, not a guaranteed cure.
        </p>
      </section>

      <section>
        <h2>2. What does CR (Coordinated Reset) mean?</h2>
        <p>
          CR Therapy does not remove sound. Instead, it uses short tone pulses
          at several frequencies close to your tinnitus pitch (some slightly
          below, some slightly above).
        </p>
        <ul>
          <li>Quick pulses stimulate different areas of the auditory cortex.</li>
          <li>
            The aim is to “scramble” the over-synchronised firing pattern that
            keeps tinnitus going.
          </li>
          <li>
            By disturbing this abnormal rhythm, the brain is encouraged to
            reorganise and reduce the tinnitus signal.
          </li>
        </ul>
        <p>
          You can think of CR as knocking several times on the brain&apos;s door
          from different angles to reset the pattern.
        </p>
      </section>

      <section>
        <h2>3. Choosing your background sound</h2>
        <p>
          You can change the background sound to{" "}
          <strong>white noise, pink noise, ocean, wind, rain, or soft music</strong>.
          Simply open the Sound Library in the app and pick what feels most
          comfortable for you.
        </p>
        <p>
          The most important rule: keep the volume{" "}
          <strong>low and comfortable</strong>. You should always be able to
          hear the sound clearly, but it must never feel loud or painful.
        </p>
      </section>

      <section>
        <h2>4. General safety guidelines</h2>
        <ul>
          <li>Use headphones or earphones you find comfortable.</li>
          <li>
            Keep sessions at a low, pleasant volume. If you have to raise your
            voice to talk over the sound, it is too loud.
          </li>
          <li>Take breaks. Do not run long sessions back-to-back.</li>
          <li>
            If your tinnitus becomes more intrusive or uncomfortable, stop and
            rest for the day.
          </li>
          <li>
            For sudden changes in hearing, dizziness, pain, or strong distress,
            seek urgent professional medical care.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Important note</h2>
        <p>
          NeuroQuiet is a self-help sound tool based on tinnitus neuromodulation
          research. It is <strong>not</strong> a medical device and does not
          replace diagnosis or treatment from your doctor or audiologist.
        </p>
      </section>

      <p className="back-link">
        <Link href="/therapy">← Back to therapy screen</Link>
      </p>

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
