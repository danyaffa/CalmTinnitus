// FILE: app/therapy/page.tsx

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// --- FIREBASE IMPORTS ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// --- TYPES ---
type TherapyMode = "standard" | "relief" | "sleep";
type SessionStatus = "idle" | "running" | "paused";

type SoundProfile = {
  id: string;
  label: string;
  description: string;
  type: "noise" | "nature" | "external";
  color?: string;
  icon?: string;
  defaultLink?: string;
};

// --- CONSTANTS ---
const SOUND_PROFILES: SoundProfile[] = [
  {
    id: "spotify",
    label: "Spotify",
    description: "Best for Music & Playlists",
    type: "external",
    color: "#1DB954",
    icon: "🟢",
    defaultLink: "https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp",
  },
  { id: "pink", label: "Pink Noise", description: "Soft, gentle sound", type: "noise" },
  { id: "white", label: "White Noise", description: "Classic masking sound", type: "noise" },
  { id: "brown", label: "Brown Noise", description: "Deep, rumbling sound", type: "noise" },
  { id: "rain", label: "Rain", description: "Gentle rainfall", type: "nature" },
  { id: "ocean", label: "Ocean Waves", description: "Rolling surf", type: "nature" },
];

const THERAPY_MODES = [
  {
    key: "relief" as TherapyMode,
    label: "1) Relief (CR) Therapy – Recommended",
    description:
      "Best for long-term tinnitus reduction. Creates clear ticks / short gaps in the tone to desynchronise tinnitus activity.",
    icon: "✨",
  },
  {
    key: "standard" as TherapyMode,
    label: "2) Standard Therapy (Comfort)",
    description: "Gentle background sound with your matched tone for daily comfort & masking.",
    icon: "🎧",
  },
  {
    key: "sleep" as TherapyMode,
    label: "3) Sleep Support",
    description: "Quieter profile to help you wind down and fall asleep.",
    icon: "🌙",
  },
];

// --- AUDIO ENGINE HOOK (stable) ---
function useTinnitusAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const toneOscRef = useRef<OscillatorNode | null>(null);
  const toneGainRef = useRef<GainNode | null>(null);

  const crOscillatorsRef = useRef<OscillatorNode[]>([]);
  const crGainsRef = useRef<GainNode[]>([]);
  const crIntervalRef = useRef<number | null>(null);
  const crVolumeRef = useRef<number>(0.6); // 🔵 live CR volume

  const initAudio = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const setMasterVolume = (vol: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        vol,
        ctxRef.current?.currentTime || 0,
        0.1,
      );
    }
  };

  const generateNoiseBuffer = (ctx: AudioContext, type: string) => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === "white") {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === "pink") {
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
        data[i] =
          (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * w) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
    }
    return buffer;
  };

  const stopAll = useCallback(() => {
    const now = ctxRef.current?.currentTime || 0;
    if (noiseGainRef.current)
      noiseGainRef.current.gain.setTargetAtTime(0, now, 0.05);
    if (toneGainRef.current)
      toneGainRef.current.gain.setTargetAtTime(0, now, 0.05);
    crGainsRef.current.forEach((g) =>
      g.gain.setTargetAtTime(0, now, 0.05),
    );

    setTimeout(() => {
      noiseNodeRef.current?.stop();
      noiseNodeRef.current?.disconnect();
      toneOscRef.current?.stop();
      toneOscRef.current?.disconnect();
      crOscillatorsRef.current.forEach((o) => o.stop());
      noiseNodeRef.current = null;
      toneOscRef.current = null;
      crOscillatorsRef.current = [];

      if (crIntervalRef.current) {
        clearInterval(crIntervalRef.current);
        crIntervalRef.current = null;
      }
    }, 200);
  }, []);

  const playNoise = useCallback(
    (type: string, volume: number) => {
      const ctx = initAudio();
      if (noiseNodeRef.current) noiseNodeRef.current.stop();

      const buffer = generateNoiseBuffer(ctx, type);
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();

      source.buffer = buffer;
      source.loop = true;
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);

      source.connect(gain);
      gain.connect(masterGainRef.current!);
      source.start();

      noiseNodeRef.current = source;
      noiseGainRef.current = gain;
    },
    [initAudio],
  );

  const playTone = useCallback(
    (freq: number, volume: number) => {
      const ctx = initAudio();
      if (toneOscRef.current) toneOscRef.current.stop();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);

      osc.connect(gain);
      gain.connect(masterGainRef.current!);
      osc.start();

      toneOscRef.current = osc;
      toneGainRef.current = gain;
    },
    [initAudio],
  );

  // CR therapy
  const playCR = useCallback(
    (baseFreq: number, volume: number) => {
      const ctx = initAudio();
      stopAll();

      crVolumeRef.current = volume; // start with slider value

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
      crIntervalRef.current = window.setInterval(() => {
        const now = ctx.currentTime;
        gains.forEach((g, i) => {
          const target = i === idx ? crVolumeRef.current : 0;
          g.gain.setTargetAtTime(target, now, 0.02);
        });
        idx = (idx + 1) % gains.length;
      }, 250);
    },
    [initAudio, stopAll],
  );

  const updateVolumes = (noiseVol: number, toneVol: number) => {
    const now = ctxRef.current?.currentTime || 0;
    // Background noise
    noiseGainRef.current?.gain.setTargetAtTime(noiseVol, now, 0.1);
    // Pure tone (Standard / Sleep)
    toneGainRef.current?.gain.setTargetAtTime(toneVol, now, 0.1);
    // CR ticks (Relief mode)
    crVolumeRef.current = toneVol;
  };

  return {
    initAudio,
    playNoise,
    playTone,
    playCR,
    stopAll,
    setMasterVolume,
    updateVolumes,
    ctxRef,
  };
}

// --- PAGE COMPONENT ---
export default function TherapyPage() {
  const [tinnitusPitch, setTinnitusPitch] = useState<number>(8000);
  const [currentPitch, setCurrentPitch] = useState<number>(8000);
  const [selectedSound, setSelectedSound] = useState<SoundProfile>(
    SOUND_PROFILES[2],
  );
  const [externalLink, setExternalLink] = useState("");
  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("idle");
  const [selectedMode, setSelectedMode] =
    useState<TherapyMode>("relief");
  const [sessionDuration, setSessionDuration] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    null,
  );
  const [userId, setUserId] = useState<string>("");

  const [saveBtnText, setSaveBtnText] = useState("Save Profile");
  const [saveBtnClass, setSaveBtnClass] = useState("nq-btn-save");

  const [masterVol, setMasterVol] = useState(0.5);
  const [noiseVol, setNoiseVol] = useState(0.3);
  const [toneVol, setToneVol] = useState(0.8); // a bit higher so ticks are clear

  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const sessionTimerRef = useRef<number | null>(null);

  const audio = useTinnitusAudio();

  // MASTER VOL
  useEffect(() => {
    audio.setMasterVolume(masterVol);
  }, [masterVol]);

  // When sliders move during a running session
  useEffect(() => {
    // Only adjust live when running
    audio.updateVolumes(noiseVol, toneVol);
  }, [noiseVol, toneVol]);

  // LOAD PROFILE
  useEffect(() => {
    const loadProfile = async () => {
      let uid = localStorage.getItem("calmtinnitus_uid");
      if (!uid) {
        uid = "guest_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("calmtinnitus_uid", uid);
      }
      setUserId(uid);

      try {
        const docRef = doc(db, "profiles", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.pitch) {
            setTinnitusPitch(data.pitch);
            setCurrentPitch(data.pitch);
          }
          if (data.soundId) {
            const s = SOUND_PROFILES.find(
              (p) => p.id === data.soundId,
            );
            if (s) setSelectedSound(s);
          }
        }
      } catch (e) {
        console.error("Error loading profile:", e);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (selectedSound.type === "external" && selectedSound.defaultLink) {
      setExternalLink(selectedSound.defaultLink);
    } else {
      setExternalLink("");
    }
  }, [selectedSound]);

  const saveProfile = async () => {
    if (!userId) return;
    setSaveBtnText("Saving...");

    try {
      await setDoc(doc(db, "profiles", userId), {
        pitch: tinnitusPitch,
        soundId: selectedSound.id,
        lastUpdated: new Date().toISOString(),
      });

      setSaveBtnText("✅ Saved!");
      setSaveBtnClass("nq-btn-save saved");

      setTimeout(() => {
        setSaveBtnText("Save Profile");
        setSaveBtnClass("nq-btn-save");
      }, 2000);
    } catch (e) {
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
      const testVol = Math.max(toneVol, 0.5);
      audio.playTone(tinnitusPitch, testVol);
      setIsPlayingTest(true);
    }
  };

  useEffect(() => {
    if (isPlayingTest) {
      const testVol = Math.max(toneVol, 0.5);
      audio.playTone(tinnitusPitch, testVol);
    }
  }, [tinnitusPitch, toneVol, isPlayingTest]);

  const handlePitchChange = (val: number) => {
    setCurrentPitch(val);
    setTinnitusPitch(val);
  };

  const startSession = () => {
    audio.initAudio();
    if (isPlayingTest) {
      audio.stopAll();
      setIsPlayingTest(false);
    }

    if (selectedSound.type !== "external") {
      audio.playNoise(selectedSound.id, noiseVol);
    }
    if (selectedMode === "relief") {
      audio.playCR(tinnitusPitch, toneVol);
    } else {
      audio.playTone(tinnitusPitch, toneVol);
    }

    setSessionStatus("running");
    setTimeRemaining(sessionDuration);
    const end = Date.now() + sessionDuration * 60000;
    sessionTimerRef.current = window.setInterval(() => {
      const left = (end - Date.now()) / 60000;
      if (left <= 0) stopSession();
      else setTimeRemaining(left);
    }, 1000);
  };

  const pauseSession = () => {
    audio.ctxRef.current?.suspend();
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    setSessionStatus("paused");
  };

  const resumeSession = () => {
    audio.ctxRef.current?.resume();
    const end = Date.now() + (timeRemaining ?? 0) * 60000;
    sessionTimerRef.current = window.setInterval(() => {
      const left = (end - Date.now()) / 60000;
      if (left <= 0) stopSession();
      else setTimeRemaining(left);
    }, 1000);
    setSessionStatus("running");
  };

  const stopSession = () => {
    audio.stopAll();
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    setSessionStatus("idle");
    setTimeRemaining(null);
  };

  const formatTime = (m: number | null) => {
    if (!m) return "--:--";
    const min = Math.floor(m);
    const sec = Math.round((m - min) * 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const getEmbedUrl = (type: string, url: string) => {
    if (!url) return null;
    if (type === "spotify") {
      if (url.includes("/embed/")) return url;
      const cleanUrl = url.split("?")[0];
      const m = cleanUrl.match(
        /spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/,
      );
      return m
        ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`
        : null;
    }
    return null;
  };

  return (
    <main className="nq-container">
      {/* Header */}
      <header className="nq-header">
        <div>
          <h1 className="nq-brand">CalmTinnitus</h1>
          <span className="nq-subtitle">Therapy Dashboard</span>
        </div>
        <div className="nq-master-vol">
          <span>🔊 Master</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={masterVol}
            onChange={(e) => setMasterVol(Number(e.target.value))}
          />
        </div>
      </header>

      {/* GUIDE */}
      <div className="nq-guide">
        <div style={{ marginBottom: "1rem" }}>
          <strong>Quick Start:</strong>
          <div className="nq-guide-steps">
            <span>1. Match your tinnitus pitch below & Save.</span>
            <span>2. Select a therapy mode (Relief – CR – is #1 for treatment).</span>
            <span>3. Choose music/noise & start your session.</span>
          </div>
        </div>
        <div
          style={{
            paddingTop: "1rem",
            borderTop: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <strong>📅 Recommended:</strong> Use Relief (CR) Therapy 2 sessions/day for 3–6 months.
          <br />
          <span style={{ opacity: 0.8 }}>
            Standard & Sleep modes are mainly for comfort and relaxation.
          </span>
        </div>
      </div>

      {/* STATUS */}
      {sessionStatus !== "idle" && (
        <div className="nq-banner">
          <div className="nq-timer">{formatTime(timeRemaining)}</div>
          <div className="nq-status-text">
            {THERAPY_MODES.find((m) => m.key === selectedMode)?.label} is Active
          </div>

          {sessionStatus === "running" && (
            <button onClick={pauseSession} className="nq-btn-stop" style={{ background: "#f59e0b" }}>
              ⏸ Pause Session
            </button>
          )}

          {sessionStatus === "paused" && (
            <button onClick={resumeSession} className="nq-btn-stop" style={{ background: "#10b981" }}>
              ⏯ Resume Session
            </button>
          )}

          <button onClick={stopSession} className="nq-btn-stop">
            ⏹ Stop Session
          </button>
        </div>
      )}

      {/* STEP 1 */}
      <div className="nq-panel nq-step-1">
        <div className="nq-panel-header">
          <h3>Step 1: Match Your Tinnitus Pitch</h3>
          <div className="nq-pitch-display">
            <span className="nq-hz">{Math.round(tinnitusPitch)} Hz</span>
            <button
              onClick={toggleTestTone}
              className={`nq-btn-test ${isPlayingTest ? "active" : ""}`}
            >
              {isPlayingTest ? "⏹ Stop Tone" : "▶ Test Tone"}
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
            onChange={(e) => handlePitchChange(Number(e.target.value))}
            className="nq-main-slider"
          />
          <span className="nq-range-label">High</span>
        </div>

        <div style={{ marginTop: "1.5rem", textAlign: "center", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
          <button onClick={saveProfile} className={saveBtnClass}>
            {saveBtnText}
          </button>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.5rem" }}>
            Save this pitch to your Cloud Profile.
          </p>
        </div>
      </div>

      {/* STEP 2 */}
      <div className="nq-controls-grid">
        <div className="nq-panel">
          <h3>Step 2: Therapy Mode</h3>
          <div className="nq-list">
            {THERAPY_MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMode(m.key)}
                disabled={sessionStatus !== "idle"}
                className={`nq-list-item ${selectedMode === m.key ? "active" : ""}`}
              >
                <span className="nq-icon">{m.icon}</span>
                <div>
                  <strong>{m.label}</strong>
                  <p>{m.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="nq-info-box">
            <span style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>ℹ️</span>
            <div>
              <strong>Why you hear ticks / holes / clicks in CR mode:</strong>
              <br />
              In Relief (CR) Therapy you will hear gentle “knocks”, “ticks” or small gaps.
              <br />
              <strong>This is intentional and normal.</strong> Nothing is broken.
              <br />
              These interruptions help desynchronise tinnitus signals and reduce tinnitus over time.
              <br />
              Standard & Sleep modes do not contain ticks.
            </div>
          </div>
        </div>

        {/* STEP 3 */}
        <div className="nq-panel">
          <h3>Step 3: Sound & Mixer</h3>

          <div className="nq-slider-group">
            <label>Background Sound</label>
            <select
              className="nq-select"
              value={selectedSound.id}
              onChange={(e) => {
                const s = SOUND_PROFILES.find((p) => p.id === e.target.value);
                if (s) setSelectedSound(s);
              }}
            >
              <optgroup label="Music Apps">
                {SOUND_PROFILES.filter((p) => p.type === "external").map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Noise & Nature">
                {SOUND_PROFILES.filter((p) => p.type !== "external").map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {selectedSound.id === "spotify" && (
            <div className="nq-spotify-info">
              <strong>Spotify Info:</strong>
              <br />
              Paste any Spotify link and play your music.
              <br />
              Therapy continues in the background regardless.
            </div>
          )}

          <div className="nq-mixer">
            {selectedSound.type !== "external" && (
              <div className="nq-slider-group">
                <label>Background Vol</label>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={noiseVol}
                  onChange={(e) => setNoiseVol(Number(e.target.value))}
                />
              </div>
            )}
            <div className="nq-slider-group">
              <label>Therapy Tone Vol</label>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={toneVol}
                onChange={(e) => setToneVol(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="nq-duration-group">
            {[15, 30, 45, 60].map((t) => (
              <button
                key={t}
                onClick={() => setSessionDuration(t)}
                disabled={sessionStatus !== "idle"}
                className={`nq-chip ${sessionDuration === t ? "active" : ""}`}
              >
                {t}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* EXTERNAL PLAYER */}
      {selectedSound.type === "external" && (
        <div className="nq-embed-card" style={{ borderColor: selectedSound.color || "#333" }}>
          <div className="nq-embed-header">
            <span className="nq-badge" style={{ background: selectedSound.color }}>
              {selectedSound.label}
            </span>
            <input
              placeholder={`Paste your ${selectedSound.label} link here...`}
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              className="nq-input-dark"
            />
          </div>

          {getEmbedUrl(selectedSound.id, externalLink) ? (
            <iframe
              src={getEmbedUrl(selectedSound.id, externalLink)!}
              className="nq-iframe"
              allow="encrypted-media; autoplay; clipboard-write; picture-in-picture"
            />
          ) : (
            <div className="nq-empty-embed">
              <p>Paste your music link.</p>
            </div>
          )}

          <div style={{ textAlign: "center", fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.75rem" }}>
            ⚠️ Control music volume inside the player above
          </div>
        </div>
      )}

      {/* START / STOP */}
      {sessionStatus === "idle" && (
        <button onClick={startSession} className="nq-btn-big">
          ▶ Start Session
        </button>
      )}

      <div className="nq-footer">
        <p>Medical Disclaimer: This is a wellness tool. Consult a doctor for hearing health issues.</p>
      </div>

      <Style />
    </main>
  );
}

// --- STYLES ---
function Style() {
  return (
    <style jsx global>{`
      :root {
        --primary: #0ea5e9;
        --success: #22c55e;
        --bg: #f8fafc;
        --card: #ffffff;
        --text: #0f172a;
        --text-dim: #64748b;
      }
      .nq-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem 1rem;
        font-family: system-ui, sans-serif;
        color: var(--text);
      }
      .nq-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .nq-brand {
        margin: 0;
        font-size: 1.5rem;
      }
      .nq-subtitle {
        font-size: 0.9rem;
        color: var(--text-dim);
      }
      .nq-master-vol {
        background: white;
        padding: 0.5rem 1rem;
        border-radius: 99px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .nq-guide {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        padding: 1rem;
        border-radius: 0.75rem;
        margin-bottom: 2rem;
        font-size: 0.9rem;
        color: #0369a1;
      }
      .nq-guide-steps {
        display: flex;
        flex-direction: column;
        margin-top: 0.5rem;
        gap: 0.25rem;
        font-weight: 500;
      }

      .nq-panel.nq-step-1 {
        border: 2px solid #e2e8f0;
        margin-bottom: 1.5rem;
      }
      .nq-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .nq-panel-header h3 {
        margin: 0;
      }
      .nq-pitch-display {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .nq-hz {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--primary);
        min-width: 80px;
        text-align: right;
      }
      .nq-btn-test {
        background: #0f172a;
        color: white;
        border: none;
        padding: 0.5rem 1.2rem;
        border-radius: 99px;
        cursor: pointer;
        font-weight: 600;
        transition: 0.2s;
      }
      .nq-btn-test.active {
        background: #ef4444;
      }

      .nq-range-wrap {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .nq-range-label {
        font-size: 0.8rem;
        color: var(--text-dim);
        white-space: nowrap;
      }
      .nq-main-slider {
        flex: 1;
        height: 8px;
        border-radius: 4px;
        appearance: none;
        background: #e2e8f0;
      }
      .nq-main-slider::-webkit-slider-thumb {
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--primary);
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }

      .nq-btn-save {
        background: #e2e8f0;
        color: #334155;
        border: none;
        padding: 0.6rem 2rem;
        border-radius: 99px;
        cursor: pointer;
        font-weight: 700;
        transition: 0.3s;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      }
      .nq-btn-save.saved {
        background: #22c55e;
        color: white;
        transform: scale(1.05);
        box-shadow: 0 5px 15px rgba(34, 197, 94, 0.4);
      }

      .nq-controls-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      @media (max-width: 768px) {
        .nq-controls-grid {
          grid-template-columns: 1fr;
        }
      }
      .nq-panel {
        background: white;
        padding: 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }
      .nq-panel h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
      }

      .nq-info-box {
        margin-top: 1.5rem;
        background: #fffbeb;
        border: 1px solid #fcd34d;
        padding: 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.8rem;
        color: #92400e;
        display: flex;
        align-items: flex-start;
        line-height: 1.4;
      }

      .nq-list {
        display: grid;
        gap: 0.5rem;
      }
      .nq-list-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: white;
        border: 1px solid #e2e8f0;
        padding: 0.75rem;
        border-radius: 0.75rem;
        cursor: pointer;
      }
      .nq-list-item.active {
        border-color: var(--primary);
        background: #f0f9ff;
      }

      .nq-mixer {
        display: grid;
        gap: 1rem;
        margin-top: 1rem;
        margin-bottom: 1.5rem;
      }
      .nq-slider-group label {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 0.3rem;
      }
      .nq-select {
        width: 100%;
        padding: 0.6rem;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
        font-size: 1rem;
      }
      input[type="range"] {
        width: 100%;
        accent-color: var(--primary);
      }

      .nq-duration-group {
        display: flex;
        gap: 0.5rem;
      }
      .nq-chip {
        flex: 1;
        border: 1px solid #e2e8f0;
        background: white;
        padding: 0.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
      }
      .nq-chip.active {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }

      .nq-spotify-info {
        margin-top: 0.75rem;
        margin-bottom: 0.5rem;
        background: #f8fafe;
        border-radius: 0.75rem;
        padding: 0.75rem 0.9rem;
        font-size: 0.85rem;
        color: #1e293b;
        border: 1px solid #dbeafe;
      }

      .nq-embed-card {
        background: #0f172a;
        color: white;
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
        border-left: 4px solid;
      }

      .nq-embed-header {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .nq-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .nq-input-dark {
        flex: 1;
        background: #1e293b;
        border: 1px solid #334155;
        color: white;
        padding: 0.5rem;
        border-radius: 0.5rem;
      }
      .nq-iframe {
        width: 100%;
        height: 152px;
        border: none;
        border-radius: 12px;
      }
      .nq-empty-embed {
        text-align: center;
        padding: 2rem;
        color: #475569;
        background: #1e293b;
        border-radius: 12px;
      }

      .nq-banner {
        background: linear-gradient(135deg, var(--primary), var(--success));
        color: white;
        padding: 1.5rem;
        border-radius: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 2rem;
      }
      .nq-timer {
        font-size: 2.5rem;
        font-weight: 800;
      }
      .nq-status-text {
        font-size: 0.95rem;
        text-align: center;
      }
      .nq-btn-stop {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 0.5rem 1.25rem;
        border-radius: 99px;
        cursor: pointer;
        font-weight: 600;
      }
      .nq-btn-big {
        width: 100%;
        background: var(--primary);
        color: white;
        border: none;
        padding: 1.2rem;
        border-radius: 1rem;
        font-size: 1.2rem;
        font-weight: 700;
      }
      .nq-footer {
        text-align: center;
        margin-top: 3rem;
        font-size: 0.8rem;
        color: var(--text-dim);
      }
    `}</style>
  );
}
