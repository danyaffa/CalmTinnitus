"use client";

import React from "react";

const InfoPage: React.FC = () => {
  return (
    <main className="page">
      <section className="card">
        <h1 className="page-title">Therapy Information</h1>
        <p className="page-subtitle">
          How Notch Therapy and Coordinated Reset (CR) work, and how to choose
          your sound.
        </p>

        <div className="info-block">
          <h2>✅ Explanation For The User</h2>

          <h3>1. What does “a narrow hole at your tinnitus pitch” mean?</h3>
          <p>
            Your tinnitus has a specific frequency (pitch). Notch Therapy plays
            continuous sound (usually pink noise), but{" "}
            <strong>carves out a small “hole” exactly at the frequency</strong>{" "}
            of your tinnitus.
          </p>
          <p>Think of it this way:</p>
          <ul>
            <li>Full pink noise = all frequencies</li>
            <li>
              We remove (mute) a tiny band around{" "}
              <strong>your tinnitus pitch</strong>
            </li>
            <li>
              This “absence” of sound tells your brain to{" "}
              <strong>reduce the hyperactive neurons</strong> causing tinnitus
            </li>
            <li>
              Over time, the brain learns to{" "}
              <strong>turn down the gain on that pitch</strong>
            </li>
          </ul>
          <p>
            👉 <strong>The hole</strong> = the missing frequency band centered
            on your tinnitus tone. This is scientifically used to weaken the
            tinnitus signal by reducing abnormal neural firing.
          </p>

          <h3>2. What does CR (Coordinated Reset) mean?</h3>
          <p>
            <strong>CR Therapy (Coordinated Reset)</strong> does not remove
            sound. Instead, it uses <strong>short tone pulses</strong>,
            delivered at several frequencies <strong>near your tinnitus pitch</strong>{" "}
            (slightly below and slightly above).
          </p>
          <p>The goal:</p>
          <ul>
            <li>
              Stimulate the auditory cortex with quick, precisely timed pulses
            </li>
            <li>
              “Scramble” the over-synchronized firing pattern of tinnitus
              neurons
            </li>
            <li>Break the abnormal rhythm</li>
            <li>
              Encourage the brain to <strong>reorganize</strong> and reduce the
              tinnitus signal
            </li>
          </ul>
          <p>
            CR is like <strong>knocking several times on the brain’s door</strong>{" "}
            from different angles to reset the abnormal pattern.
          </p>

          <h3>
            3. Changing the sound: white noise, ocean, wind, music and more
          </h3>
          <p>
            You can run therapy on top of different background sounds. In this
            prototype you can:
          </p>
          <ul>
            <li>
              Open the <strong>Sound Library</strong> on the Therapy page.
            </li>
            <li>
              Choose your preferred background such as{" "}
              <strong>white noise, pink noise, ocean, wind, rain,</strong> or{" "}
              <strong>soft music</strong>.
            </li>
          </ul>
          <p>
            The therapy (Notch or CR) still targets your tinnitus pitch in the
            same way — the background sound just lets you choose what feels most
            comfortable and relaxing while the neuromodulation runs.
          </p>
        </div>
      </section>

      <style jsx>{`
        .page {
          max-width: 1040px;
          margin: 0 auto;
          padding: 2rem 1.25rem 3rem;
        }

        .card {
          background: #ffffff;
          border-radius: 0.75rem;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          padding: 1.75rem 1.75rem 2rem;
        }

        .page-title {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .page-subtitle {
          font-size: 0.95rem;
          color: #4b5563;
          margin-bottom: 1.5rem;
        }

        .info-block h2 {
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }

        .info-block h3 {
          font-size: 1rem;
          margin-top: 1.2rem;
          margin-bottom: 0.35rem;
        }

        .info-block p {
          font-size: 0.92rem;
          color: #374151;
          line-height: 1.55;
        }

        .info-block ul {
          margin: 0.35rem 0 0.75rem 1.25rem;
          padding: 0;
          font-size: 0.9rem;
          color: #374151;
        }

        .info-block li {
          margin-bottom: 0.25rem;
        }
      `}</style>
    </main>
  );
};

export default InfoPage;
