/**
 * CalmTinnitus - Therapy & Research App
 * Combined build from user provided pages.
 * Features:
 * - Tinnitus Pitch Matching
 * - 3 Therapy Modes: Relief (CR), Standard, Sleep
 * - Procedural Background Generators (Rain, Ocean, White Noise)
 * - Research Information Page
 * - Firebase Persistence
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
// @ts-ignore
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
// @ts-ignore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'calm-tinnitus';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- TYPES ---
type ViewState = "therapy" | "research";
type TherapyMode = "relief" | "standard" | "sleep";
type SessionStatus = "idle" | "running" | "paused";
type BackgroundSoundId = "white" | "none" | "rain" | "ocean";

type SoundProfile = {
  id: BackgroundSoundId;
  label: string;
  description: string;
  type: "noise" | "nature";
};

const SOUND_PROFILES: SoundProfile[] = [
  {
    id: "white",
    label: "White Noise",
    description: "Classic masking sound",
    type: "noise",
  },
  {
    id: "rain",
    label: "Soft Rain",
    description: "Rainy-window style gentle masking",
    type: "nature",
  },
  {
    id: "ocean",
    label: "Ocean Waves",
    description: "Rolling waves and surf",
    type: "nature",
  },
  {
    id: "none",
    label: "No Background",
    description: "Tone only – use with your own music if you like",
    type: "noise",
  },
];

const THERAPY_MODES: {
  key: TherapyMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "relief",
    label: "1) Relief (CR) Therapy",
    description:
      "Special pattern with gentle 'holes' (clicks) intended to support long-term habituation.",
    icon: <span className="text-xl">🧠</span>,
  },
  {
    key: "standard",
    label: "2) Standard Therapy (Comfort)",
    description:
      "Gentle background sound with your matched tone for daily comfort & masking.",
    icon: <span className="text-xl">🎵</span>,
  },
  {
    key: "sleep",
    label: "3) Sleep Support",
    description: "Quieter profile to help you wind down and fall asleep.",
    icon: <span className="text-xl">🌙</span>,
  },
];

// --- AUDIO ENGINE HOOK ---
function useTinnitusAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);

  const toneOscRef = useRef<OscillatorNode | null>(null);
  const toneGainRef = useRef<GainNode | null>(null);

  const crOscillatorsRef = useRef<OscillatorNode[]>([]);
  const crGainsRef = useRef<GainNode[]>([]);
  const crIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestToneVolRef = useRef(0.5);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initAudio = useCallback(() => {
    if (typeof window === "undefined") return null;

    try {
      let ctx = ctxRef.current;
      const hasAudioContext =
        typeof window.AudioContext !== "undefined" ||
        typeof (window as any).webkitAudioContext !== "undefined";

      if (!hasAudioContext) return null;

      if (!ctx || ctx.state === "closed") {
        const Ctx =
          window.AudioContext || (window as any).webkitAudioContext;
        const newCtx: AudioContext = new Ctx();
        ctxRef.current = newCtx;
        ctx = newCtx;

        const masterGain = newCtx.createGain();
        masterGain.connect(newCtx.destination);
        masterGain.gain.value = 0.8;
        masterGainRef.current = masterGain;
      }

      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch((err: any) => console.error("Resume failed:", err));
      }

      return ctx;
    } catch (err) {
      console.error("initAudio failed:", err);
      return null;
    }
  }, []);

  const setMasterVolume = useCallback((vol: number) => {
    try {
      if (masterGainRef.current && ctxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(
          vol,
          ctxRef.current.currentTime,
          0.1
        );
      }
    } catch (err) {}
  }, []);

  const generateNoiseBuffer = (ctx: AudioContext, id: string) => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (id === "white") {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.7;
      }
    } else if (id === "rain") {
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0;
      let envelope = 0.6;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        let pink = (b0 + b1 + b2 + b3 + w * 0.5362) * 0.4;
        if (i % 2000 === 0) envelope = 0.3 + Math.random() * 0.7;
        data[i] = pink * envelope;
      }
    } else if (id === "ocean") {
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.5;
        b6 = w * 0.115926;
      }
    }
    return buffer;
  };

  const stopAll = useCallback(() => {
    try {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
      const now = ctxRef.current?.currentTime || 0;
      if (noiseGainRef.current)
        noiseGainRef.current.gain.setTargetAtTime(0, now, 0.05);
      if (toneGainRef.current)
        toneGainRef.current.gain.setTargetAtTime(0, now, 0.05);
      crGainsRef.current.forEach((g) =>
        g.gain.setTargetAtTime(0, now, 0.05)
      );

      stopTimeoutRef.current = setTimeout(() => {
        try {
          noiseNodeRef.current?.stop();
          noiseNodeRef.current?.disconnect();
          toneOscRef.current?.stop();
          toneOscRef.current?.disconnect();
          crOscillatorsRef.current.forEach((o) => {
            o.stop();
            o.disconnect();
          });
          noiseNodeRef.current = null;
          toneOscRef.current = null;
          crOscillatorsRef.current = [];
          if (crIntervalRef.current) clearInterval(crIntervalRef.current);
        } catch (e) {}
      }, 200);
    } catch (e) {}
  }, []);

  const playNoise = useCallback(
    (id: string, volume: number) => {
      const ctx = initAudio();
      if (!ctx || !masterGainRef.current || id === "none") return;

      if (noiseNodeRef.current) {
        try {
          noiseNodeRef.current.stop();
        } catch {}
      }
      const buffer = generateNoiseBuffer(ctx, id);
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      source.loop = true;

      const effectiveNoise = Math.min(1.2, volume * 1.5);
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(effectiveNoise, ctx.currentTime, 0.1);

      source.connect(gain);
      gain.connect(masterGainRef.current);
      source.start();
      noiseNodeRef.current = source;
      noiseGainRef.current = gain;
    },
    [initAudio]
  );

  const playTone = useCallback(
    (freq: number, volume: number) => {
      const ctx = initAudio();
      if (!ctx || !masterGainRef.current) return;

      if (toneOscRef.current) {
        try {
          toneOscRef.current.stop();
        } catch {}
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
      osc.connect(gain);
      gain.connect(masterGainRef.current);
      osc.start();
      toneOscRef.current = osc;
      toneGainRef.current = gain;
    },
    [initAudio]
  );

  const playCR = useCallback(
    (baseFreq: number, volume: number) => {
      const ctx = initAudio();
      if (!ctx || !masterGainRef.current) return;
      stopAll(); // Ensure clean slate for CR

      latestToneVolRef.current = volume;
      const freqs = [0.9, 1.0, 1.1, 1.2].map((m) => baseFreq * m);
      const oscillators: OscillatorNode[] = [];
      const gains: GainNode[] = [];

      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(masterGainRef.current!);
        osc.start();
        oscillators.push(osc);
        gains.push(gain);
      });

      crOscillatorsRef.current = oscillators;
      crGainsRef.current = gains;

      let idx = 0;
      crIntervalRef.current = setInterval(() => {
        if (!ctx) return;
        const now = ctx.currentTime;
        const currentVol = latestToneVolRef.current;
        gains.forEach((g, i) => {
          const target = i === idx ? currentVol : 0;
          g.gain.setTargetAtTime(target, now, 0.02);
        });
        idx = (idx + 1) % gains.length;
      }, 250);
    },
    [initAudio, stopAll]
  );

  const updateVolumes = useCallback((noiseVol: number, toneVol: number) => {
    const now = ctxRef.current?.currentTime || 0;
    const effectiveNoise = Math.min(1.2, noiseVol * 1.5);
    if (noiseGainRef.current)
      noiseGainRef.current.gain.setTargetAtTime(effectiveNoise, now, 0.1);
    if (toneGainRef.current)
      toneGainRef.current.gain.setTargetAtTime(toneVol, now, 0.1);
    latestToneVolRef.current = toneVol;
  }, []);

  return useMemo(
    () => ({
      initAudio,
      playNoise,
      playTone,
      playCR,
      stopAll,
      setMasterVolume,
      updateVolumes,
      ctxRef,
    }),
    [initAudio, playNoise, playTone, playCR, stopAll, setMasterVolume, updateVolumes]
  );
}

// --- SUB-VIEWS ---

// 1. Research View
const ResearchView = ({ onBack }: { onBack: () => void }) => {
  const year = new Date().getFullYear();
  return (
    <div className="nq-research">
      <header className="nq-research-header">
        <h1>Tinnitus neuromodulation research</h1>
        <p>
          This page summarizes some of the published research behind sound-based
          neuromodulation for tinnitus, including notched-sound therapy, acoustic
          coordinated reset (CR) neuromodulation, and related sound therapies.
          It is informational only and not medical advice.
        </p>
        <div className="nq-research-back">
          <button onClick={onBack} className="nq-link flex items-center gap-1">
            <span className="w-4 h-4">🏠</span> Back to CalmTinnitus home
          </button>
        </div>
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
            Recent systematic reviews suggest notched music / sound therapy is a{" "}
            <strong>promising, non-invasive option</strong> for some people.
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
        </ul>
      </section>

      <section className="nq-research-section nq-research-note">
        <h2>What this means for CalmTinnitus</h2>
        <p>
          CalmTinnitus is inspired by these neuromodulation approaches. It brings
          together tinnitus pitch matching, notched-style and CR-style sound
          patterns, and soothing soundscapes into a tool you can use at home.
        </p>
      </section>

      <footer className="nq-research-footer">
        <p>© {year} Leffler International Investments Pty Ltd. CalmTinnitus™</p>
      </footer>

      <style>{`
        .nq-research { max-width: 960px; margin: 0 auto; padding: 1.5rem 1rem 2.5rem; font-family: system-ui, sans-serif; }
        .nq-research-header h1 { font-size: 1.8rem; margin-bottom: 0.6rem; color: #0f172a; font-weight: 700; }
        .nq-research-header p { font-size: 0.98rem; color: #4b5563; line-height: 1.5; }
        .nq-research-back { margin-top: 1rem; }
        .nq-link { color: #0369a1; text-decoration: underline; background: none; border: none; cursor: pointer; padding: 0; font-size: 1rem; }
        .nq-research-section { margin-top: 1.75rem; font-size: 0.96rem; color: #374151; line-height: 1.6; }
        .nq-research-section h2 { font-size: 1.25rem; margin-bottom: 0.4rem; font-weight: 600; color: #1e293b; }
        .nq-research-section ul { margin: 0.5rem 0 0; padding-left: 1.3rem; list-style-type: disc; }
        .nq-research-section li { margin-bottom: 0.5rem; }
        .nq-research-section a { color: #0369a1; }
        .nq-research-note { background: #f3f4f6; border-radius: 0.9rem; padding: 1rem; }
        .nq-research-footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 0.8rem; color: #6b7280; }
      `}</style>
    </div>
  );
};

// 2. Therapy View
const TherapyView = ({
  user,
  goToResearch,
}: {
  user: User | null;
  goToResearch: () => void;
}) => {
  const [tinnitusPitch, setTinnitusPitch] = useState(8000);
  const [selectedSound, setSelectedSound] = useState(SOUND_PROFILES[0]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [selectedMode, setSelectedMode] = useState<TherapyMode>("relief");
  const [sessionDuration, setSessionDuration] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const [profileName, setProfileName] = useState("");
  const [saveBtnText, setSaveBtnText] = useState("Save Profile");
  const [saveBtnClass, setSaveBtnClass] = useState("nq-btn-save");

  const MAX_TONE_VOL = 0.4;
  const clampTone = (val: number) => Math.min(val, MAX_TONE_VOL);

  const [masterVol, setMasterVol] = useState(0.8);
  const [noiseVol, setNoiseVol] = useState(0);
  const [toneVol, setToneVol] = useState(0.3);

  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const audio = useTinnitusAudio();

  // Load from local storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const pitch = window.localStorage.getItem("calmtinnitus_pitch");
      const soundId = window.localStorage.getItem("calmtinnitus_soundId");
      if (pitch) setTinnitusPitch(Number(pitch) || 8000);
      if (soundId) {
        const s = SOUND_PROFILES.find((p) => p.id === soundId);
        if (s) setSelectedSound(s);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    audio.setMasterVolume(masterVol);
  }, [masterVol, audio]);

  useEffect(() => {
    if (sessionStatus === "running") {
      audio.updateVolumes(noiseVol, clampTone(toneVol));
    }
  }, [noiseVol, toneVol, sessionStatus, audio]);

  useEffect(() => {
    if (sessionStatus === "running") {
      audio.playNoise(selectedSound.id, noiseVol);
    }
  }, [selectedSound, sessionStatus, noiseVol, audio]);

  const saveProfile = async () => {
    setSaveBtnText("Saving...");
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "calmtinnitus_pitch",
          String(tinnitusPitch)
        );
        window.localStorage.setItem(
          "calmtinnitus_soundId",
          selectedSound.id
        );
      }

      if (user) {
        // Create Saved Profile directly in Firestore
        await addDoc(
          collection(
            db,
            "artifacts",
            appId,
            "users",
            user.uid,
            "data",
            "profiles",
            "items"
          ),
          {
            label: profileName || "My Tinnitus Profile",
            earSide: "both",
            frequencyHz: tinnitusPitch,
            baseVolume: masterVol,
            createdAt: serverTimestamp(),
            mode: selectedMode,
          }
        );
      }

      setSaveBtnText("✅ Saved!");
      setSaveBtnClass("nq-btn-save saved");
      setTimeout(() => {
        setSaveBtnText("Save Profile");
        setSaveBtnClass("nq-btn-save");
      }, 2000);
    } catch (e) {
      console.error(e);
      setSaveBtnText("❌ Error");
      setTimeout(() => setSaveBtnText("Save Profile"), 2000);
    }
  };

  const toggleTestTone = () => {
    if (isPlayingTest) {
      audio.stopAll();
      setIsPlayingTest(false);
    } else {
      audio.initAudio();
      const testVol = clampTone(toneVol || MAX_TONE_VOL * 0.8);
      audio.playTone(tinnitusPitch, testVol);
      setIsPlayingTest(true);
    }
  };

  const speakSessionEnded = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(
        "Your Calm Tinnitus session has finished."
      );
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
  };

  const stopSession = (reason: "user" | "auto" = "user") => {
    audio.stopAll();
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    setSessionStatus("idle");
    setTimeRemaining(null);
    if (reason === "auto") speakSessionEnded();
  };

  const startSession = () => {
    audio.initAudio();
    if (isPlayingTest) {
      audio.stopAll();
      setIsPlayingTest(false);
    }

    const safeTone = clampTone(toneVol);
    setTimeout(() => {
      audio.playNoise(selectedSound.id, noiseVol);
      if (selectedMode === "relief") {
        audio.playCR(tinnitusPitch, safeTone);
      } else {
        audio.playTone(tinnitusPitch, safeTone);
      }
      audio.updateVolumes(noiseVol, safeTone);

      setSessionStatus("running");
      setTimeRemaining(sessionDuration);
      sessionStartTimeRef.current = Date.now();

      const end = Date.now() + sessionDuration * 60000;
      sessionTimerRef.current = setInterval(() => {
        const left = (end - Date.now()) / 60000;
        if (left <= 0) stopSession("auto");
        else setTimeRemaining(left);
      }, 1000);
    }, 250);
  };

  const formatTime = (m: number | null) => {
    if (!m) return "--:--";
    const min = Math.floor(m);
    const sec = Math.round((m - min) * 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="nq-container">
      {/* HEADER */}
      <div className="nq-header">
        <div>
          <h1 className="nq-brand">CalmTinnitus</h1>
          <span className="nq-subtitle">Therapy Dashboard</span>
        </div>
        <button
          onClick={goToResearch}
          className="nq-btn-icon"
          title="Read Research"
        >
          <span className="w-6 h-6 text-slate-500 hover:text-blue-500">📖</span>
        </button>
      </div>

      {/* GUIDE */}
      <div className="nq-guide">
        <div className="mb-4">
          <strong>Quick Start:</strong>
          <div className="nq-guide-steps">
            <span>1. Match your tinnitus pitch below &amp; Save.</span>
            <span>2. Select a therapy mode.</span>
            <span>3. Choose a background sound &amp; start.</span>
          </div>
        </div>
        <div className="pt-4 border-t border-blue-200/20">
          <strong>📅 Recommended:</strong> Use 2 sessions/day for 3–6 months for
          habituation.
        </div>
      </div>

      {/* STATUS BANNER */}
      {sessionStatus !== "idle" && (
        <div className="nq-banner">
          <div className="nq-timer">{formatTime(timeRemaining)}</div>
          <div className="nq-status-text">
            {THERAPY_MODES.find((m) => m.key === selectedMode)?.label} is Active
          </div>
          <button
            onClick={() => stopSession("user")}
            className="nq-btn-stop"
          >
            ⏹ Stop Session
          </button>
        </div>
      )}

      {/* CONTROLS */}
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="nq-panel nq-step-1">
          <div className="nq-panel-header">
            <h3>Step 1: Match Your Tinnitus Pitch</h3>
            <div className="nq-pitch-display">
              <span className="nq-hz">{Math.round(tinnitusPitch)} Hz</span>
              <button
                onClick={toggleTestTone}
                className={`nq-btn-test ${isPlayingTest ? "active" : ""}`}
              >
                <span className="w-4 h-4">
                  {isPlayingTest ? "⏸" : "▶"}
                </span>
                {isPlayingTest ? "Stop" : "Test"}
              </button>
            </div>
          </div>
          <div className="nq-range-wrap">
            <span className="nq-range-label">Low</span>
            <input
              type="range"
              min="200"
              max="12000"
              step="50"
              value={tinnitusPitch}
              onChange={(e) => setTinnitusPitch(Number(e.target.value))}
              className="nq-main-slider"
            />
            <span className="nq-range-label">High</span>
          </div>
          <div className="nq-save-section">
            <input
              type="text"
              placeholder="Profile Name"
              className="nq-input-profile"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
            <button onClick={saveProfile} className={saveBtnClass}>
              <span className="w-4 h-4">💾</span> {saveBtnText}
            </button>
          </div>
        </div>

        <div className="nq-controls-grid">
          {/* Step 2 */}
          <div className="nq-panel">
            <h3>Step 2: Therapy Mode</h3>
            <div className="nq-list">
              {THERAPY_MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMode(m.key)}
                  disabled={sessionStatus !== "idle"}
                  className={`nq-list-item ${
                    selectedMode === m.key ? "active" : ""
                  }`}
                >
                  <span className="nq-icon">{m.icon}</span>
                  <div className="text-left">
                    <strong>{m.label}</strong>
                    <p className="text-xs text-slate-500 mt-1">
                      {m.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3 */}
          <div className="nq-panel">
            <h3>Step 3: Sound &amp; Mixer</h3>
            <div className="nq-slider-group mt-4">
              <label>Background Sound</label>
              <select
                className="nq-select"
                value={selectedSound.id}
                onChange={(e) => {
                  const s = SOUND_PROFILES.find(
                    (p) => p.id === e.target.value
                  );
                  if (s) setSelectedSound(s);
                }}
              >
                {SOUND_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="nq-mixer">
              <div className="nq-slider-group">
                <label>Background Vol</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={noiseVol}
                  onChange={(e) => setNoiseVol(Number(e.target.value))}
                />
              </div>
              <div className="nq-slider-group">
                <label>Therapy Tone Vol</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={toneVol}
                  onChange={(e) =>
                    setToneVol(clampTone(Number(e.target.value)))
                  }
                />
              </div>
            </div>

            <div className="nq-duration-group">
              {[15, 30, 45, 60].map((t) => (
                <button
                  key={t}
                  onClick={() => setSessionDuration(t)}
                  className={`nq-chip ${sessionDuration === t ? "active" : ""}`}
                >
                  {t}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {sessionStatus === "idle" && (
          <button onClick={startSession} className="nq-btn-big">
            ▶ Start Session
          </button>
        )}
      </div>

      <Style />
    </div>
  );
};

// --- STYLES ---
function Style() {
  return (
    <style>{`
      :root { --primary: #0ea5e9; --success: #22c55e; --bg: #f8fafc; --card: #ffffff; --text: #0f172a; --text-dim: #64748b; }
      .nq-container { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, sans-serif; color: var(--text); background: #f8fafc; min-height: 100vh; }
      .nq-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
      .nq-brand { margin: 0; font-size: 1.5rem; font-weight: 800; background: linear-gradient(to right, #0ea5e9, #3b82f6); -webkit-background-clip: text; color: transparent; }
      .nq-subtitle { font-size: 0.9rem; color: var(--text-dim); }
      .nq-guide { background: #f0f9ff; border: 1px solid #bae6fd; padding: 1rem; border-radius: 0.75rem; margin-bottom: 2rem; font-size: 0.9rem; color: #0369a1; }
      .nq-guide-steps { display: flex; flex-direction: column; margin-top: 0.5rem; gap: 0.25rem; font-weight: 500; }
      .nq-panel { background: white; padding: 1.5rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
      .nq-step-1 { border: 2px solid #e2e8f0; }
      .nq-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
      .nq-panel-header h3 { margin: 0; font-weight: 600; }
      .nq-pitch-display { display: flex; align-items: center; gap: 1rem; }
      .nq-hz { font-size: 1.5rem; font-weight: 800; color: var(--primary); min-width: 80px; text-align: right; }
      .nq-btn-test { background: #0f172a; color: white; border: none; padding: 0.5rem 1.2rem; border-radius: 99px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; }
      .nq-btn-test.active { background: #ef4444; }
      .nq-range-wrap { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
      .nq-range-label { font-size: 0.8rem; color: var(--text-dim); }
      .nq-main-slider { flex: 1; height: 8px; border-radius: 4px; appearance: none; background: #e2e8f0; }
      .nq-main-slider::-webkit-slider-thumb { appearance: none; width: 24px; height: 24px; border-radius: 50%; background: var(--primary); cursor: pointer; border: 2px solid white; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); }
      .nq-save-section { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 1rem; display: flex; gap: 0.5rem; justify-content: center; align-items: center; flex-wrap: wrap; }
      .nq-input-profile { padding: 0.6rem 1rem; border: 1px solid #cbd5e1; border-radius: 99px; font-size: 0.9rem; width: 200px; }
      .nq-btn-save { background: #e2e8f0; color: #334155; border: none; padding: 0.6rem 1.5rem; border-radius: 99px; cursor: pointer; font-weight: 700; transition: 0.3s; display: flex; align-items: center; gap: 6px; }
      .nq-btn-save:hover { background: #cbd5e1; }
      .nq-btn-save.saved { background: #22c55e; color: white; }
      .nq-controls-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
      @media (max-width: 768px) { .nq-controls-grid { grid-template-columns: 1fr; } }
      .nq-list { display: grid; gap: 0.5rem; }
      .nq-list-item { display: flex; align-items: flex-start; gap: 1rem; text-align: left; width: 100%; background: white; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 0.75rem; cursor: pointer; transition: 0.2s; }
      .nq-list-item:hover { border-color: var(--primary); }
      .nq-list-item.active { border: 2px solid var(--primary); background: #f0f9ff; }
      .nq-slider-group { margin-bottom: 1rem; }
      .nq-slider-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem; }
      .nq-select { width: 100%; padding: 0.6rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; font-size: 1rem; }
      input[type="range"] { width: 100%; accent-color: var(--primary); }
      .nq-mixer { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; margin-bottom: 1rem; }
      .nq-duration-group { display: flex; gap: 0.5rem; }
      .nq-chip { flex: 1; border: 1px solid #e2e8f0; background: white; padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; }
      .nq-chip.active { background: var(--primary); color: white; border-color: var(--primary); }
      .nq-banner { background: linear-gradient(135deg, var(--primary), var(--success)); color: white; padding: 1.5rem; border-radius: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-bottom: 2rem; box-shadow: 0 10px 25px -5px rgba(14, 165, 233, 0.4); }
      .nq-timer { font-size: 2.5rem; font-weight: 800; line-height: 1; }
      .nq-btn-stop { background: rgba(255, 255, 255, 0.2); border: none; color: white; padding: 0.5rem 1.25rem; border-radius: 99px; cursor: pointer; font-weight: 600; margin-top: 0.5rem; }
      .nq-btn-stop:hover { background: rgba(255, 255, 255, 0.3); }
      .nq-btn-big { width: 100%; background: var(--primary); color: white; border: none; padding: 1.2rem; border-radius: 1rem; font-size: 1.2rem; font-weight: 700; cursor: pointer; box-shadow: 0 10px 20px rgba(14, 165, 233, 0.2); transition: 0.2s; }
      .nq-btn-big:hover { transform: translateY(-2px); box-shadow: 0 15px 25px rgba(14, 165, 233, 0.3); }
      .nq-btn-icon { background: none; border: none; cursor: pointer; padding: 0.5rem; border-radius: 50%; transition: background 0.2s; }
      .nq-btn-icon:hover { background: #e2e8f0; }
    `}</style>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [view, setView] = useState<ViewState>("therapy");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      await signInAnonymously(auth);
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  if (view === "research") {
    return <ResearchView onBack={() => setView("therapy")} />;
  }

  return <TherapyView user={user} goToResearch={() => setView("research")} />;
}
