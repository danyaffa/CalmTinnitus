// /app/therapy/page.tsx
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
} from "../../components/SoundLibraryMenu";
import { firebaseGoogleSignIn, firebaseSignOut } from "../../lib/firebase";
import {
  useAuthCtx,
  SessionLog,
  TherapyMode,
  TherapyType,
} from "../AuthProvider";
import { useMediaSession } from "../../hooks/useMediaSession";

//
// LOCAL STORAGE HOOK
function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
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

//
// MAIN PAGE COMPONENT
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
  const croscRef = useRef<OscillatorNode | null>(null);
  const crGainRef = useRef<GainNode | null>(null);
  const crTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedSound, setSelectedSound] = useState<SoundProfile | null>(null);
  const [isSoundLibraryOpen, setIsSoundLibraryOpen] = useState(false);

  const NOTCH_THERAPY_GAIN = 0.12;
  const SLEEP_MODE_GAIN_MODIFIER = 0.7;
  const CR_THERAPY_GAIN = 0.08;

  //
  // AUDIO CONTEXT  (TS-safe)
  const ensureAudioContext = useCallback((): AudioContext | null => {
    if (!audioCtxRef.current) {
      const AC =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      audioCtxRef.current = ctx;

      mainGainRef.current = ctx.createGain();
      mainGainRef.current!.connect(ctx.destination);
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
    if (croscRef.current) {
      try {
        croscRef.current.stop();
      } catch {}
      croscRef.current.disconnect();
      croscRef.current = null;
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

  //
  // PINK NOISE GENERATOR
  const generatePinkNoiseBuffer = (
    ctx: AudioContext,
    durationSeconds = 600
  ) => {
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
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.11;
    }

    return buffer;
  };

  //
  // TEST TONE
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

  //
  // NOTCH THERAPY
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

  //
  // CR THERAPY
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

      croscRef.current = osc;
    };

    playNextTone();
    crTimerRef.current = setInterval(playNextTone, 300);
  };

  //
  // SAVE SESSION
  const saveSession = () => {
    // TypeScript-safe by loosening the annotation – runtime behaviour unchanged
    const baseLog: any = {
      date: Date.now(),
      mode: currentMode || "standard",
      therapy: therapyType,
      duration: sessionMinutes - (minutesLeft || sessionMinutes),
      frequency: tinnitusPitch || 0,
    };

    const localKey = "neuroquiet_sessionHistory";
    try {
      const current =
        (JSON.parse(
          window.localStorage.getItem(localKey) || "[]"
        ) as SessionLog[]) || [];
      const newLocal: SessionLog = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...(baseLog as SessionLog),
      };
      const updated = [newLocal, ...current];
      window.localStorage.setItem(localKey, JSON.stringify(updated));
      setSessionHistory(updated);
    } catch {}

    try {
      saveSessionToCloud(baseLog);
    } catch (e) {
      console.error("Error saving session to cloud", e);
    }
  };

  //
  // START SESSION
  const startSession = (mode: TherapyMode) => {
    if (!tinnitusPitch) {
      alert("Please match and save your tinnitus pitch first.");
      return;
    }

    stopEverything();
    setCurrentMode(mode);

    if (therapyType === "notch") {
      startNotchTherapy(mode, tinnitusPitch);
    } else {
      startCRTherapy(mode, tinnitusPitch);
    }

    setStatus("running");
    setMinutesLeft(sessionMinutes);

    sessionTimerRef.current = setInterval(() => {
      setMinutesLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          stopEverything();
          saveSession();
          return null;
        }
        return prev - 1;
      });
    }, 60000);
  };

  //
  // HANDLE SELECTED SOUND (LIBRARY)
  const applySelectedSound = useCallback(
    async (sound: SoundProfile | null) => {
      if (!sound) {
        stopEverything();
        return;
      }

      const ctx = ensureAudioContext();
      if (!ctx || !mainGainRef.current) return;

      try {
        const response = await fetch(sound.src);
        const arrayBuffer = await response.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuffer);

        stopEverything();

        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.loop = true;

        let gainLevel = 0.1;
        if (currentMode === "sleep") gainLevel *= SLEEP_MODE_GAIN_MODIFIER;

        mainGainRef.current.gain.value = gainLevel;
        src.connect(mainGainRef.current);
        src.start();

        noiseSourceRef.current = src;
        setSelectedSound(sound);
      } catch (err) {
        console.error("Error loading sound: ", err);
      }
    },
    [ensureAudioContext, stopEverything, currentMode]
  );

  useMediaSession(status, selectedSound);

  //
  // UI HANDLERS
  const handleLogout = async () => {
    try {
      await firebaseSignOut();
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await firebaseGoogleSignIn();
    } catch (err) {
      console.error("Login error", err);
    }
  };

  //
  // RENDER
  return (
    <main className="therapy-page">
      <header className="top-header">
        <h1 className="app-title">NeuroQuiet Therapy</h1>
        <nav className="nav-tabs">
          <button
            className={activeTab === "therapy" ? "active" : ""}
            onClick={() => setActiveTab("therapy")}
          >
            Therapy
          </button>
          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
          <button
            className={activeTab === "progress" ? "active" : ""}
            onClick={() => setActiveTab("progress")}
          >
            Progress
          </button>
          <button
            className={activeTab === "info" ? "active" : ""}
            onClick={() => setActiveTab("info")}
          >
            Info
          </button>
        </nav>
      </header>

      {activeTab === "therapy" && (
        <section className="therapy-section">
          <div className="therapy-controls">
            <h2>Match Your Tinnitus Pitch</h2>
            <div className="slider-row">
              <input
                type="range"
                min="100"
                max="16000"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
              />
              <span>{frequency} Hz</span>
            </div>
            <button
              className="btn-test-tone"
              onClick={() => playTestTone(frequency)}
            >
              Test Tone
            </button>
            <button className="btn-save-pitch" onClick={saveTinnitusPitch}>
              Save Pitch
            </button>
          </div>

          <div className="therapy-type-select">
            <h3>Select Therapy Type</h3>
            <div className="type-buttons">
              <button
                className={therapyType === "notch" ? "active" : ""}
                onClick={() => setTherapyType("notch")}
              >
                Notch Therapy
              </button>
              <button
                className={therapyType === "cr" ? "active" : ""}
                onClick={() => setTherapyType("cr")}
              >
                Coordinated Reset (CR)
              </button>
            </div>
          </div>

          <div className="session-controls">
            <h3>Session Length: {sessionMinutes} minutes</h3>
            <input
              type="range"
              min="5"
              max="60"
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(Number(e.target.value))}
            />
          </div>

          <div className="start-buttons">
            <button onClick={() => startSession("standard")}>
              Start Standard
            </button>
            <button onClick={() => startSession("sleep")}>
              Start Sleep Mode
            </button>
            <button onClick={() => startSession("relief")}>
              Start Relief Mode
            </button>
          </div>

          {status === "running" && (
            <div className="session-status">
              <p>Session running… {minutesLeft} minutes left</p>
              <button onClick={stopEverything}>Stop Session</button>
            </div>
          )}

          <div className="sound-library">
            <button onClick={() => setIsSoundLibraryOpen(!isSoundLibraryOpen)}>
              {isSoundLibraryOpen ? "Close Sound Library" : "Open Sound Library"}
            </button>
            {isSoundLibraryOpen && (
              <SoundLibraryMenu
                onSelectSound={applySelectedSound}
                selectedSound={selectedSound}
              />
            )}
          </div>
        </section>
      )}

      {activeTab === "history" && (
        <section className="history-section">
          <h2>Session History</h2>
          {sessionHistory.length === 0 ? (
            <p>No sessions recorded yet.</p>
          ) : (
            <ul className="history-list">
              {sessionHistory.map((log) => (
                <li key={log.id} className="history-item">
                  <div>
                    <strong>{new Date(log.date).toLocaleString()}</strong>
                  </div>
                  <div>Therapy: {(log as any).therapy}</div>
                  <div>Mode: {log.mode}</div>
                  <div>Duration: {log.duration} min</div>
                  <div>Frequency: {log.frequency} Hz</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === "progress" && (
        <section className="progress-section">
          <h2>Progress Overview</h2>
          <p>
            Track trends in your tinnitus therapy usage over time. More visual
            charts and deeper progress insights will appear here in future
            updates.
          </p>
          <div className="progress-placeholder">
            <p>Progress charts coming soon…</p>
          </div>
        </section>
      )}

      {activeTab === "info" && (
        <section className="info-section">
          <h2>Information &amp; Safety</h2>
          <p>
            Learn how Notch Therapy and Coordinated Reset (CR) patterns are used
            in tinnitus sound training. Always listen at a comfortable level.
          </p>
          <Link href="/info" className="info-link">
            Read full details
          </Link>
        </section>
      )}

      <footer className="footer">
        {!user ? (
          <button className="google-login" onClick={handleGoogleLogin}>
            Login with Google
          </button>
        ) : (
          <button className="google-logout" onClick={handleLogout}>
            Logout
          </button>
        )}
      </footer>

      <style jsx>{`
        .therapy-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem 1.25rem 3rem;
        }
        .top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }
        .app-title {
          font-size: 1.7rem;
          font-weight: 600;
        }
        .nav-tabs button {
          background: none;
          border: none;
          margin-right: 1rem;
          padding: 0.4rem 0.75rem;
          font-size: 1rem;
          cursor: pointer;
          opacity: 0.6;
        }
        .nav-tabs button.active {
          opacity: 1;
          font-weight: bold;
          border-bottom: 2px solid #087a93;
        }
        .therapy-section,
        .history-section,
        .progress-section,
        .info-section {
          margin-top: 1.5rem;
        }
        .therapy-controls {
          margin-bottom: 1.5rem;
        }
        .slider-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        input[type="range"] {
          width: 100%;
        }
        .btn-test-tone,
        .btn-save-pitch {
          background: #087a93;
          color: #fff;
          padding: 0.5rem 1rem;
          margin-right: 0.75rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .therapy-type-select {
          margin-top: 2rem;
        }
        .type-buttons button {
          margin-right: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border: 1px solid #999;
          cursor: pointer;
          background: #f3f3f3;
        }
        .type-buttons button.active {
          background: #087a93;
          color: white;
          border-color: #087a93;
        }
        .session-controls {
          margin-top: 2rem;
        }
        .start-buttons button {
          margin-right: 1rem;
          padding: 0.7rem 1.4rem;
          background: #087a93;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .session-status {
          margin-top: 1.5rem;
          padding: 1rem;
          background: #f0f8ff;
          border-left: 4px solid #087a93;
        }
        .sound-library {
          margin-top: 2rem;
        }
        .history-list {
          list-style: none;
          padding: 0;
        }
        .history-item {
          padding: 1rem;
          border-bottom: 1px solid #eee;
        }
        .progress-placeholder {
          padding: 2rem;
          background: #fafafa;
          border: 1px dashed #bbb;
        }
        .info-link {
          display: inline-block;
          margin-top: 1rem;
          padding: 0.6rem 1rem;
          background: #087a93;
          color: white;
          border-radius: 6px;
        }
        .footer {
          margin-top: 2rem;
          text-align: center;
        }
        .google-login,
        .google-logout {
          padding: 0.7rem 1.2rem;
          background: #087a93;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
      `}</style>
    </main>
  );
};

export default NeuroQuietPage;
