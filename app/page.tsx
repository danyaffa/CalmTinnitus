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

// --- TYPE DEFINITIONS ---
type TherapyStatus = "idle" | "tone-testing" | "running";
type TherapyMode = "standard" | "sleep" | "relief";
type TherapyType = "notch" | "cr"; // Notch Therapy or Coordinated Reset

type SessionLog = {
  id: string;
  date: number;
  therapyType: TherapyType;
  mode: TherapyMode;
  duration: number; // in minutes
  tinnitusPitch: number;
};

// --- CONSTANTS ---
const SAFE_TEST_GAIN = 0.05; // Very low volume for testing
const NOTCH_THERAPY_GAIN = 0.12;
const CR_THERAPY_GAIN = 0.1; // Coordinated Reset gain
const SLEEP_MODE_GAIN_MODIFIER = 0.6; // Sleep mode is 60% of standard gain

// --- BROWSER STORAGE HOOK (from Gemini v2) ---
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
    } catch (error) {
      console.error("Error reading from localStorage", error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error("Error writing to localStorage", error);
      }
    }
  }, [key, state]);

  return [state, setState];
}

// --- MAIN APP COMPONENT ---
export default function Home() {
  // --- TABS ---
  const [activeTab, setActiveTab] = useState<"therapy" | "history" | "info">(
    "therapy"
  );

  // --- Persistent State (Saved to localStorage) ---
  const [tinnitusPitch, setTinnitusPitch] = usePersistentState<number | null>(
    "neuroquiet_pitch",
    null
  );
  const [sessionMinutes, setSessionMinutes] = usePersistentState<number>(
    "neuroquiet_sessionMinutes",
    15
  );
  const [sessionHistory, setSessionHistory] = usePersistentState<SessionLog[]>(
    "neuroquiet_sessionHistory",
    []
  );

  // --- Volatile State (Reset on refresh) ---
  const [frequency, setFrequency] = useState(8000); // Slider
  const [status, setStatus] = useState<TherapyStatus>("idle");
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [currentMode, setCurrentMode] = useState<TherapyMode | null>(null);
  const [therapyType, setTherapyType] = useState<TherapyType>("notch");

  // --- AUDIO REFS ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);

  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Therapy-specific refs
  const testToneOscRef = useRef<OscillatorNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const notchFilterRef = useRef<BiquadFilterNode | null>(null);
  const crOscRef = useRef<OscillatorNode | null>(null);
  const crTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- AUDIO CONTEXT MANAGEMENT ---
  const ensureAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const Ctor =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) {
        console.error("Web Audio API not supported");
        return null;
      }
      audioCtxRef.current = new Ctor();
      mainGainRef.current = audioCtxRef.current.createGain();
      mainGainRef.current.connect(audioCtxRef.current.destination);
    }
    return audioCtxRef.current;
  }, []);

  // --- CORE AUDIO CLEANUP FUNCTION ---
  const stopEverything = useCallback(() => {
    // Stop Test Tone
    if (testToneOscRef.current) {
      try {
        testToneOscRef.current.stop();
      } catch (e) {}
      testToneOscRef.current.disconnect();
      testToneOscRef.current = null;
    }

    // Stop Notch Therapy
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
      } catch (e) {}
      noiseSourceRef.current.disconnect();
      noiseSourceRef.current = null;
    }
    if (notchFilterRef.current) {
      notchFilterRef.current.disconnect();
      notchFilterRef.current = null;
    }

    // Stop Coordinated Reset (CR) Therapy
    if (crOscRef.current) {
      try {
        crOscRef.current.stop();
      } catch (e) {}
      crOscRef.current.disconnect();
      crOscRef.current = null;
    }
    if (crTimerRef.current) {
      clearInterval(crTimerRef.current);
      crTimerRef.current = null;
    }

    // Stop Session Timer
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    // Reset gain
    if (mainGainRef.current) {
      mainGainRef.current.gain.value = 1.0;
    }

    setMinutesLeft(null);
    setCurrentMode(null);
    if (status !== "idle") {
      setStatus("idle");
    }
  }, [status]);

  // --- SESSION MANAGEMENT ---
  const logSession = (
    mode: TherapyMode,
    type: TherapyType,
    pitch: number
  ) => {
    let duration = 0;
    if (mode === "relief") duration = 5;
    else if (mode === "sleep") duration = 45;
    else duration = sessionMinutes;

    const newLog: SessionLog = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      date: Date.now(),
      therapyType: type,
      mode,
      duration,
      tinnitusPitch: pitch,
    };

    setSessionHistory((prev) => [newLog, ...prev]);
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
        if (prev === null) return null;
        if (prev <= 1) {
          // Session finished
          stopEverything();
          logSession(mode, type, pitch);
          return null;
        }
        return prev - 1;
      });
    }, 60_000);
  };

  // --- THERAPY: TEST TONE ---
  const startTestTone = () => {
    const ctx = ensureAudioContext();
    if (!ctx || !mainGainRef.current) return;
    stopEverything(); // stop any previous sound

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency;

    mainGainRef.current.gain.value = SAFE_TEST_GAIN;
    osc.connect(mainGainRef.current);
    osc.start();

    testToneOscRef.current = osc;
    setStatus("tone-testing");
  };

  // --- THERAPY: NOTCHED PINK NOISE ---
  const generatePinkNoiseBuffer = (
    ctx: AudioContext,
    durationSeconds = 60
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
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  };

  const startNotchTherapy = (mode: TherapyMode, pitch: number) => {
    const ctx = ensureAudioContext();
    if (!ctx || !mainGainRef.current) return;
    stopEverything();

    const buffer = generatePinkNoiseBuffer(ctx, 60);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
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

  // --- THERAPY: COORDINATED RESET (CR) ---
  const startCRTherapy = (mode: TherapyMode, pitch: number) => {
    const ctx = ensureAudioContext();
    if (!ctx || !mainGainRef.current) return;
    stopEverything();

    // 4 tones around tinnitus pitch
    const tones = [
      pitch * 0.9,
      pitch * 1.1,
      pitch * 0.8,
      pitch * 1.2,
    ].sort(() => Math.random() - 0.5);

    let gainLevel = CR_THERAPY_GAIN;
    if (mode === "sleep") gainLevel *= SLEEP_MODE_GAIN_MODIFIER;
    mainGainRef.current.gain.value = gainLevel;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.connect(mainGainRef.current);
    osc.start();
    crOscRef.current = osc;

    let toneIndex = 0;

    const playNextTone = () => {
      if (!crOscRef.current || !mainGainRef.current) return;
      const freq = tones[toneIndex % tones.length];
      const now = ctx.currentTime;

      crOscRef.current.frequency.setValueAtTime(freq, now);
      mainGainRef.current.gain.setTargetAtTime(gainLevel, now, 0.01);
      mainGainRef.current.gain.setTargetAtTime(0, now + 0.1, 0.01);

      toneIndex++;
      if (toneIndex % tones.length === 0) {
        tones.sort(() => Math.random() - 0.5);
      }
    };

    playNextTone();
    crTimerRef.current = setInterval(playNextTone, 500);
  };

  // --- MAIN THERAPY START HANDLER ---
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

  // --- ON MOUNT: PWA SERVICE WORKER + LOAD PITCH ---
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // ignore errors
      });
    }

    if (tinnitusPitch) {
      setFrequency(tinnitusPitch);
    }

    return () => {
      stopEverything();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- STATUS LABELS ---
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
          <div className="brand-icon">NQ</div>
          <div>
            <div className="brand-title">NeuroQuiet</div>
            <div className="brand-subtitle">
              Silence Starts Now. Prototype neuromodulation tool.
            </div>
          </div>
        </div>
        <div className="badge">
          Leffler International Investments Pty Ltd – Prototype Only
        </div>
      </header>

      {/* --- TABS --- */}
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
          className={`tab-button ${activeTab === "info" ? "active" : ""}`}
          onClick={() => setActiveTab("info")}
        >
          Info & Safety
        </button>
      </div>

      <section className="grid">
        {/* LEFT COLUMN: THERAPY / HISTORY / INFO */}
        {activeTab === "therapy" && (
          <div className="card">
            <h2>1. Match Your Tinnitus Pitch</h2>
            <p>
              Use the slider to match the high-pitched tone you hear. When
              it sounds close to your tinnitus, save it. The app will
              remember it on this device.
            </p>

            <div className="label-row">
              <span>Frequency</span>
              <span>{frequency.toLocaleString()} Hz</span>
            </div>
            <input
              className="slider"
              type="range"
              min={4000}
              max={16000}
              step={50}
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              disabled={status === "running"}
            />

            <div className="button-row">
              {status !== "tone-testing" ? (
                <button
                  className="btn btn-secondary"
                  onClick={startTestTone}
                  disabled={status === "running"}
                >
                  Test Tone
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={stopEverything}
                >
                  Stop Tone
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={() => {
                  setTinnitusPitch(frequency);
                  stopEverything();
                }}
                disabled={status === "running"}
              >
                Save as My Tinnitus Pitch
              </button>
            </div>

            {tinnitusPitch && (
              <p className="small-note">
                Saved tinnitus pitch:{" "}
                <strong>{tinnitusPitch.toLocaleString()} Hz</strong>.
                This value is stored locally in your browser.
              </p>
            )}

            <hr />

            <h2>2. Select Therapy Type</h2>
            <p>
              Notch Therapy uses pink noise with a narrow “hole” at your
              tinnitus pitch. Coordinated Reset (CR) uses short tone pulses
              around your pitch.
            </p>

            <div className="therapy-selector">
              <button
                className={`therapy-button ${
                  therapyType === "notch" ? "active" : ""
                }`}
                onClick={() => setTherapyType("notch")}
                disabled={status === "running"}
              >
                Notch Therapy
              </button>
              <button
                className={`therapy-button ${
                  therapyType === "cr" ? "active" : ""
                }`}
                onClick={() => setTherapyType("cr")}
                disabled={status === "running"}
              >
                Coordinated Reset (CR)
              </button>
            </div>

            <hr />

            <h2>3. Start Therapy Session</h2>
            <p style={{ marginBottom: "0.6rem" }}>
              Keep your device volume low and comfortable. You should be
              able to hear the sound, but it must never feel loud or
              painful.
            </p>

            <div className="label-row">
              <span>Standard Session Length</span>
              <span>{sessionMinutes} min</span>
            </div>
            <input
              className="slider"
              type="range"
              min={5}
              max={45}
              step={5}
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(Number(e.target.value))}
              disabled={status === "running"}
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

            {minutesLeft !== null && status === "running" && (
              <p className="small-note">
                {currentMode === "sleep" ? "Sleep mode" : "Session"} running.
                Time left: <strong>{minutesLeft} min</strong>.
              </p>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="card">
            <h2>Session History</h2>
            <p>
              Every completed session is logged here on this device.
              This is the base for future “Progress” charts.
            </p>

            <div className="history-log">
              {sessionHistory.length === 0 && (
                <p>No completed sessions yet. Start a therapy to log it.</p>
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
            </div>
          </div>
        )}

        {activeTab === "info" && (
          <div className="card">
            <h2>Information & Safety</h2>
            <p>
              NeuroQuiet is an experimental prototype only. It does not
              diagnose, treat, cure, or prevent any disease. Use it only as
              a support tool alongside professional care.
            </p>
            <ul className="safety-list">
              <li>
                Always listen at{" "}
                <strong>low, comfortable volume</strong>. If in doubt, turn it
                down.
              </li>
              <li>
                Start with one or two <strong>10–15 minute</strong> Standard
                sessions per day.
              </li>
              <li>
                Sleep mode should be used with very low background level and
                only if it feels comfortable.
              </li>
              <li>
                <strong>Stop immediately</strong> if you feel discomfort,
                dizziness, headache, or worsening tinnitus.
              </li>
              <li>
                Talk to an ENT specialist or audiologist before making big
                changes to your tinnitus management.
              </li>
            </ul>
            <p className="small-note">
              Current build: <strong>NeuroQuiet v2 – Persistent & Dual-Therapy
              Engine (Notch + CR)</strong> with basic session tracking and PWA
              support.
            </p>
          </div>
        )}

        {/* RIGHT COLUMN: STATUS & QUICK SAFETY SUMMARY */}
        <div className="card">
          <h2>Status & Safety</h2>
          <p>
            This panel shows what the engine is doing right now
            (idle, pitch matching, or running therapy).
          </p>

          <div
            className={`status-pill ${statusClass}`}
            style={{ marginBottom: "0.8rem" }}
          >
            <span className="status-pill-dot" />
            <span>{statusLabel}</span>
          </div>

          <ul className="safety-list">
            <li>Use in a quiet environment so you can keep volume low.</li>
            <li>Take breaks. Do not run back-to-back long sessions.</li>
            <li>
              If your tinnitus becomes more intrusive, stop and rest for the
              day.
            </li>
            <li>
              This is a prototype research tool, not a regulated medical
              device.
            </li>
          </ul>

          <p className="small-note">
            For any medical concerns or sudden changes in your hearing, seek
            urgent professional care.
          </p>
        </div>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} Leffler International Investments Pty Ltd
        – NeuroQuiet. Prototype neuromodulation tool. All rights reserved.
      </footer>
    </main>
  );
}
