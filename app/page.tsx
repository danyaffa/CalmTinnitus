// /app/page.tsx
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SoundLibraryMenu,
  SoundProfile,
} from "../components/SoundLibraryMenu";
import { firebaseGoogleSignIn, firebaseSignOut } from "../lib/firebase";
import {
  useAuthCtx,
  SessionLog,
  TherapyMode,
  TherapyType,
} from "./AuthProvider";
import { useMediaSession } from "../hooks/useMediaSession";

// --- LOCAL STORAGE HOOK ---
function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [key, state]);

  return [state, setState];
}

// --- MAIN PAGE COMPONENT ---
const NeuroQuietPage: React.FC = () => {
  const {
    user,
    loading,
    sessionHistory,
    setSessionHistory,
    saveSessionToCloud,
  } = useAuthCtx();

  const [activeTab, setActiveTab] = useState<
    "therapy" | "history" | "progress" | "info"
  >("therapy");

  const [tinnitusPitch, setTinnitusPitch] = usePersistentState<number | null>(
    "neuroquiet_pitch",
    null
  );
  const [sessionMinutes, setSessionMinutes] = usePersistentState<number>(
    "neuroquiet_sessionMinutes",
    15
  );

  const [frequency, setFrequency] = useState(8000);
  const [status, setStatus] = useState<"idle" | "tone-testing" | "running">(
    "idle"
  );
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [currentMode, setCurrentMode] = useState<TherapyMode | null>(null);
  const [therapyType, setTherapyType] = useState<TherapyType>("notch");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const testToneOscRef = useRef<OscillatorNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const notchFilterRef = useRef<BiquadFilterNode | null>(null);
  const crOscRef = useRef<OscillatorNode | null>(null);
  const crGainRef = useRef<GainNode | null>(null);
  const crTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedSound, setSelectedSound] = useState<SoundProfile | null>(
    null
  );
  const [isSoundLibraryOpen, setIsSoundLibraryOpen] = useState(false);

  const NOTCH_THERAPY_GAIN = 0.12;
  const SLEEP_MODE_GAIN_MODIFIER = 0.7;
  const CR_THERAPY_GAIN = 0.08;

  // --- AUDIO CONTEXT ---
  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AC =
        window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AC();
      mainGainRef.current = audioCtxRef.current.createGain();
      mainGainRef.current.connect(audioCtxRef.current.destination);
    }
    return audioCtxRef.current;
  }, []);

  const stopEverything = useCallback(() => {
    if (testToneOscRef.current) {
      try {
        testToneOscRef.current.stop();
      } catch {}
      testToneOscRef.current.disconnect();
      testToneOscRef.current = null;
    }
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
      } catch {}
      noiseSourceRef.current.disconnect();
      noiseSourceRef.current = null;
    }
    if (notchFilterRef.current) {
      notchFilterRef.current.disconnect();
      notchFilterRef.current = null;
    }
    if (crOscRef.current) {
      try {
        crOscRef.current.stop();
      } catch {}
      crOscRef.current.disconnect();
      crOscRef.current = null;
    }
    if (crGainRef.current) {
      crGainRef.current.disconnect();
      crGainRef.current = null;
    }
    if (crTimerRef.current) {
      clearInterval(crTimerRef.current);
      crTimerRef.current = null;
    }
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (mainGainRef.current) {
      mainGainRef.current.gain.value = 0;
    }
    setStatus("idle");
    setMinutesLeft(null);
    setCurrentMode(null);
  }, []);

  const generatePinkNoiseBuffer = (ctx: AudioContext, durationSeconds = 60) => {
    const length = durationSeconds * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink =
        b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.11;
    }

    return buffer;
  };

  // --- TEST TONE ---
  const playTestTone = useCallback(
    (freq: number) => {
      stopEverything();
      const ctx = ensureAudioContext();
      if (!ctx || !mainGainRef.current) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.05;

      osc.connect(gain);
      gain.connect(mainGainRef.current);

      osc.start();
      testToneOscRef.current = osc;
      setStatus("tone-testing");
    },
    [ensureAudioContext, stopEverything]
  );

  const saveTinnitusPitch = () => {
    setTinnitusPitch(frequency);
    stopEverything();
  };

  // --- NOTCH THERAPY ---
  const startNotchTherapy = (mode: TherapyMode, pitch: number) => {
    stopEverything();
    const ctx = ensureAudioContext();
    if (!ctx || !mainGainRef.current) return;

    const noiseBuffer = generatePinkNoiseBuffer(ctx, 60 * 10);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;

    const notch = ctx.createBiquadFilter();
    notch.type = "notch";
    notch.frequency.value = pitch;
    notch.Q.value = 10;

    src.connect(notch);

    let gainLevel = NOTCH_THERAPY_GAIN;
    if (mode === "sleep") gainLevel *= SLEEP_MODE_GAIN_MODIFIER;
    mainGainRef.current.gain.value = gainLevel;

    notch.connect(mainGainRef.current);
    src.start();

    noiseSourceRef.current = src;
    notchFilterRef.current = notch;
  };

  // --- CR THERAPY ---
  const startCRTherapy = (mode: TherapyMode, pitch: number) => {
    stopEverything();
    const ctx = ensureAudioContext();
    if (!ctx || !mainGainRef.current) return;

    const gainNode = ctx.createGain();
    let gainLevel = CR_THERAPY_GAIN;
    if (mode === "sleep") gainLevel *= SLEEP_MODE_GAIN_MODIFIER;
    gainNode.gain.value = gainLevel;
    gainNode.connect(mainGainRef.current);
    crGainRef.current = gainNode;

    const freqs = [
      pitch * 0.9,
      pitch * 0.95,
      pitch,
      pitch * 1.05,
      pitch * 1.1,
    ];

    const tones = freqs.map((f) => ({ freq: f, phase: 0 }));

    const playNextTone = () => {
      if (!crGainRef.current || !audioCtxRef.current) return;
      const osc = audioCtxRef.current.createOscillator();
      osc.type = "sine";
      const { freq } = tones[Math.floor(Math.random() * tones.length)];
      osc.frequency.value = freq;
      osc.connect(crGainRef.current);
      osc.start();
      setTimeout(() => {
        try {
          osc.stop();
        } catch {}
        osc.disconnect();
      }, 150);
      crOscRef.current = osc;
    };

    playNextTone();
    crTimerRef.current = setInterval(playNextTone, 500);
  };

  // --- SESSION LOGIC ---
  const logSessionLocal = (
    mode: TherapyMode,
    type: TherapyType,
    pitch: number
  ) => {
    let duration = 0;
    if (mode === "relief") duration = 5;
    else if (mode === "sleep") duration = 45;
    else duration = sessionMinutes;

    const baseLog: Omit<SessionLog, "id"> = {
      date: Date.now(),
      therapyType: type,
      mode,
      duration,
      tinnitusPitch: pitch,
    };

    saveSessionToCloud(baseLog).catch(() => {});

    const localKey = "neuroquiet_sessionHistory";
    try {
      const current = JSON.parse(
        window.localStorage.getItem(localKey) || "[]"
      ) as SessionLog[];
      const newLocal: SessionLog = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...baseLog,
      };
      const updated = [newLocal, ...current];
      window.localStorage.setItem(localKey, JSON.stringify(updated));
    } catch {}
  };

  const startSessionTimer = (
    totalMinutes: number,
    mode: TherapyMode,
    type: TherapyType,
    pitch: number
  ) => {
    setMinutesLeft(totalMinutes);
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    sessionTimerRef.current = setInterval(() => {
      setMinutesLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          if (sessionTimerRef.current) {
            clearInterval(sessionTimerRef.current);
            sessionTimerRef.current = null;
          }
          stopEverything();
          logSessionLocal(mode, type, pitch);
          return null;
        }
        return prev - 1;
      });
    }, 60_000);
  };

  const handleStartTherapy = (mode: TherapyMode) => {
    if (!tinnitusPitch || status === "running") return;

    let totalMinutes = 0;
    if (mode === "relief") totalMinutes = 5;
    else if (mode === "sleep") totalMinutes = 45;
    else totalMinutes = sessionMinutes;

    if (therapyType === "notch") {
      startNotchTherapy(mode, tinnitusPitch);
    } else {
      startCRTherapy(mode, tinnitusPitch);
    }

    setStatus("running");
    setCurrentMode(mode);
    startSessionTimer(totalMinutes, mode, therapyType, tinnitusPitch);
  };

  useMediaSession({
    title: "NeuroQuiet – Tinnitus Session",
    artist: "NeuroQuiet",
    album: "Tinnitus Sound Training",
    onPlay: () => {
      if (status !== "running" && tinnitusPitch) {
        const modeToUse: TherapyMode = currentMode ?? "standard";
        handleStartTherapy(modeToUse);
      }
    },
    onPause: () => {
      if (status === "running") {
        stopEverything();
      }
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (tinnitusPitch) setFrequency(tinnitusPitch);

    return () => {
      stopEverything();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel =
    status === "idle"
      ? "Idle"
      : status === "tone-testing"
      ? "Matching Pitch"
      : "Therapy Running";

  const statusClass =
    status === "idle"
      ? ""
      : status === "tone-testing"
      ? "testing"
      : "running";

  return (
    <main className="main-shell">
      <header className="header">
        <div className="brand-block">
          <Image
            src="/icons/icon-192x192.png"
            alt="NeuroQuiet logo"
            width={32}
            height={32}
            className="logo-image"
          />
          <div>
            <div className="brand-title">NeuroQuiet</div>
            <div className="brand-subtitle">
              Silence Starts Now. Tinnitus neuromodulation tool.
            </div>
          </div>
        </div>
        <div className="header-right">
          <nav className="top-nav">
            <Link href="/review-us">Review Us</Link>
            <Link href="/company-policy">Policy</Link>
            <Link href="/legal">Legal</Link>
            <Link href="/disclaimers">Disclaimers</Link>
            <Link href="/feedback">Feedback</Link>
          </nav>
          <div className="auth-chip">
            {loading ? (
              <span>Loading...</span>
            ) : user ? (
              <>
                <span className="user-email">
                  {user.email || "Signed in"}
                </span>
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => firebaseSignOut()}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-link">
                  Login
                </Link>
                <Link href="/register" className="btn-link">
                  Register
                </Link>
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => firebaseGoogleSignIn()}
                >
                  Sign in with Google
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="tab-container">
        <button
          className={`tab-button ${
            activeTab === "therapy" ? "active" : ""
          }`}
          onClick={() => setActiveTab("therapy")}
        >
          Therapy
        </button>
        <button
          className={`tab-button ${
            activeTab === "history" ? "active" : ""
          }`}
          onClick={() => setActiveTab("history")}
        >
          Session History ({sessionHistory.length})
        </button>
        <button
          className={`tab-button ${
            activeTab === "progress" ? "active" : ""
          }`}
          onClick={() => setActiveTab("progress")}
        >
          Progress
        </button>
        <button
          className={`tab-button ${activeTab === "info" ? "active" : ""}`}
          onClick={() => setActiveTab("info")}
        >
          Info &amp; Safety
        </button>
      </div>

      <section className="grid">
        {activeTab === "therapy" && (
          <div className="card">
            <h2>1. Match Your Tinnitus Pitch</h2>
            <p>
              Use the slider to match the high-pitched tone you hear. When it
              sounds close to your tinnitus, save it.
            </p>

            <div className="label-row">
              <span>Frequency</span>
              <span>{frequency.toLocaleString()} Hz</span>
            </div>
            <input
              type="range"
              min={4000}
              max={12000}
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="slider"
            />

            <div className="button-row">
              <button
                className="btn btn-secondary"
                onClick={() => playTestTone(frequency)}
              >
                Test Tone
              </button>
              <button
                className="btn btn-primary"
                onClick={saveTinnitusPitch}
              >
                Save as My Tinnitus Pitch
              </button>
            </div>

            <hr />
            <h2>2. Select Therapy Type</h2>
            <p>
              Notch Therapy uses pink noise with a narrow “hole” at your
              tinnitus pitch. CR uses short tone pulses around your pitch.
            </p>

            <div className="therapy-selector">
              <button
                className={`therapy-button ${
                  therapyType === "notch" ? "active" : ""
                }`}
                onClick={() => setTherapyType("notch")}
              >
                Notch Therapy
              </button>
              <button
                className={`therapy-button ${
                  therapyType === "cr" ? "active" : ""
                }`}
                onClick={() => setTherapyType("cr")}
              >
                Coordinated Reset (CR)
              </button>
            </div>

            <div className="sound-library-row">
              <button
                className="btn btn-outline"
                onClick={() => setIsSoundLibraryOpen(true)}
              >
                Open Sound Library
              </button>
              {selectedSound && (
                <span className="sound-selected-label">
                  Background: {selectedSound.label}
                </span>
              )}
            </div>

            <hr />
            <h2>3. Start Therapy Session</h2>
            <p>
              Keep your device volume low and comfortable. You should be able
              to hear the sound, but it must never feel loud or painful.
            </p>

            <div className="label-row">
              <span>Standard Session Length</span>
              <span>{sessionMinutes} min</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(Number(e.target.value))}
              className="slider"
            />

            <div className="button-row">
              <button
                className="btn btn-primary"
                disabled={!tinnitusPitch || status === "running"}
                onClick={() => handleStartTherapy("standard")}
              >
                Standard Session
              </button>
              <button
                className="btn btn-secondary"
                disabled={!tinnitusPitch || status === "running"}
                onClick={() => handleStartTherapy("sleep")}
              >
                Sleep Mode (45 min)
              </button>
              <button
                className="btn btn-secondary"
                disabled={!tinnitusPitch || status === "running"}
                onClick={() => handleStartTherapy("relief")}
              >
                Instant Relief (5 min)
              </button>
              <button
                className="btn btn-secondary"
                disabled={status !== "running"}
                onClick={stopEverything}
              >
                Stop Therapy
              </button>
            </div>

            {minutesLeft !== null && (
              <p className="session-timer">
                Session time remaining: {minutesLeft} min
              </p>
            )}
          </div>
        )}

        {/* RIGHT COLUMN */}
        <div className="card status-card">
          {activeTab === "therapy" && (
            <>
              <h2>Status &amp; Safety</h2>
              <p>Shows what the engine is doing right now.</p>

              <div className={`status-pill ${statusClass}`}>
                <span className="dot" />
                <span>{statusLabel}</span>
              </div>

              <ul className="safety-list">
                <li>Use in a quiet environment so you can keep volume low.</li>
                <li>Take breaks. Do not run back-to-back long sessions.</li>
                <li>
                  If your tinnitus becomes more intrusive, stop and rest for
                  the day.
                </li>
                <li>
                  For medical concerns or sudden changes in hearing, seek urgent
                  professional care.
                </li>
              </ul>
            </>
          )}

          {activeTab === "history" && (
            <>
              <h2>Session History</h2>
              {loading && <p>Loading your sessions…</p>}
              {!loading && sessionHistory.length === 0 && (
                <p>
                  No sessions logged yet. Your future sessions will appear here.
                </p>
              )}
              {sessionHistory.length > 0 && (
                <p className="history-note">
                  Most recent sessions shown first. Stored securely and also
                  locally on this device.
                </p>
              )}
              {sessionHistory.map((log) => (
                <div key={log.id} className="history-item">
                  <h3 className="history-item-title">
                    {log.duration} min{" "}
                    {log.therapyType === "notch"
                      ? "Notch Therapy"
                      : "Coordinated Reset (CR)"}
                  </h3>
                  <p className="history-item-details">
                    {new Date(log.date).toLocaleString()} | Mode: {log.mode} |
                    Pitch: {log.tinnitusPitch.toLocaleString()} Hz
                  </p>
                </div>
              ))}
            </>
          )}

          {activeTab === "progress" && (
            <>
              <h2>Progress (coming soon)</h2>
              <p>
                Over time, NeuroQuiet will help you track how often you use each
                mode, your average tinnitus pitch, and trends in your tinnitus
                intrusiveness.
              </p>
              <p>
                This section will show charts and summaries so you and your
                clinician (if you share it) can see the bigger picture.
              </p>
            </>
          )}

          {activeTab === "info" && (
            <>
              <h2>Info &amp; Safety</h2>
              <p>
                Learn how Notch Therapy and Coordinated Reset (CR) use sound
                patterns to gently train your brain away from your tinnitus
                tone, plus important safety notes.
              </p>
              <p>
                For full details, visit the{" "}
                <Link href="/info" className="inline-link">
                  Information &amp; Safety page
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </section>

      <SoundLibraryMenu
        isOpen={isSoundLibraryOpen}
        onClose={() => setIsSoundLibraryOpen(false)}
        selectedSound={selectedSound}
        onSelectSound={setSelectedSound}
      />

      <footer className="footer">
        © {new Date().getFullYear()} Leffler International Investments Pty Ltd —
        NeuroQuiet. All rights reserved.
      </footer>
    </main>
  );
};

export default NeuroQuietPage;
