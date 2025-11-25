// FILE: app/therapy/page.tsx

"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// --- TYPES ---
type TherapyMode = "relief" | "standard" | "sleep";
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
    id: "pink",
    label: "Pink Noise",
    description: "Soft, gentle sound",
    type: "noise",
  },
  {
    id: "white",
    label: "White Noise",
    description: "Classic masking sound",
    type: "noise",
  },
  {
    id: "brown",
    label: "Brown Noise",
    description: "Deep, rumbling sound",
    type: "noise",
  },
  {
    id: "rain",
    label: "Rain",
    description: "Gentle rainfall",
    type: "nature",
  },
  {
    id: "ocean",
    label: "Ocean Waves",
    description: "Rolling surf",
    type: "nature",
  },
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
    description:
      "Gentle background sound with your matched tone for daily comfort & masking.",
    icon: "🎧",
  },
  {
    key: "sleep" as TherapyMode,
    label: "3) Sleep Support",
    description: "Quieter profile to help you wind down and fall asleep.",
    icon: "🌙",
  },
];

// --- 🧠 AUDIO ENGINE HOOK ---
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
        typeof (window as any).AudioContext !== "undefined" ||
        typeof (window as any).webkitAudioContext !== "undefined";

      if (!hasAudioContext) {
        console.warn("Web Audio API not supported in this browser.");
        return null;
      }

      if (!ctx || ctx.state === "closed") {
        const Ctx =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        const newCtx: AudioContext = new Ctx();
        ctxRef.current = newCtx;
        ctx = newCtx;

        const masterGain = newCtx.createGain();
        masterGain.connect(newCtx.destination);
        masterGainRef.current = masterGain;
      }

      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch((err) => {
          console.error("AudioContext resume failed:", err);
        });
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
    } catch (err) {
      console.error("setMasterVolume failed:", err);
    }
  }, []);

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
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
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
    try {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }

      const now = ctxRef.current?.currentTime || 0;

      if (noiseGainRef.current) {
        noiseGainRef.current.gain.setTargetAtTime(0, now, 0.05);
      }
      if (toneGainRef.current) {
        toneGainRef.current.gain.setTargetAtTime(0, now, 0.05);
      }
      crGainsRef.current.forEach((g) =>
        g.gain.setTargetAtTime(0, now, 0.05)
      );

      stopTimeoutRef.current = setTimeout(() => {
        try {
          if (noiseNodeRef.current) {
            try {
              noiseNodeRef.current.stop();
            } catch {}
            noiseNodeRef.current.disconnect();
          }
          if (toneOscRef.current) {
            try {
              toneOscRef.current.stop();
            } catch {}
            toneOscRef.current.disconnect();
          }
          crOscillatorsRef.current.forEach((o) => {
            try {
              o.stop();
            } catch {}
            o.disconnect();
          });
          noiseNodeRef.current = null;
          toneOscRef.current = null;
          crOscillatorsRef.current = [];
          if (crIntervalRef.current) clearInterval(crIntervalRef.current);
        } catch (err) {
          console.error("stopAll inner cleanup error:", err);
        }
      }, 200);
    } catch (err) {
      console.error("stopAll failed:", err);
    }
  }, []);

  const hardStopAll = useCallback(() => {
    try {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
      if (crIntervalRef.current) {
        clearInterval(crIntervalRef.current);
        crIntervalRef.current = null;
      }

      if (noiseNodeRef.current) {
        try {
          noiseNodeRef.current.stop();
        } catch {}
        noiseNodeRef.current.disconnect();
        noiseNodeRef.current = null;
      }
      if (toneOscRef.current) {
        try {
          toneOscRef.current.stop();
        } catch {}
        toneOscRef.current.disconnect();
        toneOscRef.current = null;
      }
      crOscillatorsRef.current.forEach((o) => {
        try {
          o.stop();
        } catch {}
        o.disconnect();
      });
      crOscillatorsRef.current = [];
      crGainsRef.current = [];
    } catch (err) {
      console.error("hardStopAll failed:", err);
    }
  }, []);

  const playNoise = useCallback(
    (type: string, volume: number) => {
      try {
        const ctx = initAudio();
        if (!ctx) return;
        if (!masterGainRef.current) return;

        if (noiseNodeRef.current) {
          try {
            noiseNodeRef.current.stop();
          } catch {}
        }
        const buffer = generateNoiseBuffer(ctx, type);
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        const effective = Math.max(0, Math.min(1, volume * volume)); // stronger reduction curve
        source.buffer = buffer;
        source.loop = true;
        gain.gain.value = 0;
        gain.gain.setTargetAtTime(effective, ctx.currentTime, 0.1);
        source.connect(gain);
        gain.connect(masterGainRef.current);
        source.start();
        noiseNodeRef.current = source;
        noiseGainRef.current = gain;
      } catch (err) {
        console.error("playNoise failed:", err);
      }
    },
    [initAudio]
  );

  const playTone = useCallback(
    (freq: number, volume: number) => {
      try {
        const ctx = initAudio();
        if (!ctx) return;
        if (!masterGainRef.current) return;

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
      } catch (err) {
        console.error("playTone failed:", err);
      }
    },
    [initAudio]
  );

  const playCR = useCallback(
    (baseFreq: number, volume: number) => {
      try {
        const ctx = initAudio();
        if (!ctx) return;
        if (!masterGainRef.current) return;

        hardStopAll();

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
          try {
            if (!ctx) return;
            const now = ctx.currentTime;
            const currentVol = latestToneVolRef.current;
            gains.forEach((g, i) => {
              const target = i === idx ? currentVol : 0;
              g.gain.setTargetAtTime(target, now, 0.02);
            });
            idx = (idx + 1) % gains.length;
          } catch (err) {
            console.error("CR interval tick failed:", err);
          }
        }, 250);
      } catch (err) {
        console.error("playCR failed:", err);
      }
    },
    [initAudio, hardStopAll]
  );

  const updateVolumes = useCallback((noiseVol: number, toneVol: number) => {
    try {
      const now = ctxRef.current?.currentTime || 0;
      const effectiveNoise = Math.max(
        0,
        Math.min(1, noiseVol * noiseVol) // square = bigger change when you move slider
      );

      if (noiseGainRef.current) {
        noiseGainRef.current.gain.setTargetAtTime(effectiveNoise, now, 0.1);
      }
      if (toneGainRef.current) {
        toneGainRef.current.gain.setTargetAtTime(toneVol, now, 0.1);
      }
      latestToneVolRef.current = toneVol;
    } catch (err) {
      console.error("updateVolumes failed:", err);
    }
  }, []);

  const api = useMemo(
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

  return api;
}

// --- 🎨 COMPONENT ---
export default function TherapyPage() {
  const [tinnitusPitch, setTinnitusPitch] = useState(8000);
  const [currentPitch, setCurrentPitch] = useState(8000);
  const [selectedSound, setSelectedSound] = useState(SOUND_PROFILES[2]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [selectedMode, setSelectedMode] = useState<TherapyMode>("relief");
  const [sessionDuration, setSessionDuration] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const [saveBtnText, setSaveBtnText] = useState("Save Profile");
  const [saveBtnClass, setSaveBtnClass] = useState("nq-btn-save");

  const [masterVol, setMasterVol] = useState(0.5);
  const [noiseVol, setNoiseVol] = useState(0.3);
  const [toneVol, setToneVol] = useState(0.5);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const audio = useTinnitusAudio();

  useEffect(() => {
    audio.setMasterVolume(masterVol);
  }, [masterVol, audio]);

  useEffect(() => {
    if (sessionStatus === "running") {
      audio.updateVolumes(noiseVol, toneVol);
    }
  }, [noiseVol, toneVol, sessionStatus, audio]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const pitch = window.localStorage.getItem("calmtinnitus_pitch");
      const soundId = window.localStorage.getItem("calmtinnitus_soundId");
      if (pitch) {
        const val = Number(pitch);
        if (!Number.isNaN(val)) {
          setTinnitusPitch(val);
          setCurrentPitch(val);
        }
      }
      if (soundId) {
        const s = SOUND_PROFILES.find((p) => p.id === soundId);
        if (s) setSelectedSound(s);
      }
    } catch (e) {
      console.error("Error loading local profile:", e);
    }
  }, []);

  const saveProfile = async () => {
    if (typeof window === "undefined") return;

    setSaveBtnText("Saving...");
    try {
      window.localStorage.setItem(
        "calmtinnitus_pitch",
        String(tinnitusPitch)
      );
      window.localStorage.setItem("calmtinnitus_soundId", selectedSound.id);
      setSaveBtnText("✅ Saved!");
      setSaveBtnClass("nq-btn-save saved");
      setTimeout(() => {
        setSaveBtnText("Save Profile");
        setSaveBtnClass("nq-btn-save");
      }, 2000);
    } catch (e) {
      console.error("Error saving local profile:", e);
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
  }, [tinnitusPitch, toneVol, isPlayingTest, audio]);

  const handlePitchChange = (val: number) => {
    setCurrentPitch(val);
    setTinnitusPitch(val);
  };

  const startSession = () => {
    audio.initAudio();

    let startDelay = 0;
    if (isPlayingTest) {
      audio.stopAll();
      setIsPlayingTest(false);
      startDelay = 250;
    }
    setTimeout(() => {
      audio.playNoise(selectedSound.id, noiseVol);
      if (selectedMode === "relief") {
        audio.playCR(tinnitusPitch, toneVol);
      } else if (selectedMode === "standard" || selectedMode === "sleep") {
        audio.playTone(tinnitusPitch, toneVol);
      }
      audio.updateVolumes(noiseVol, toneVol);

      setSessionStatus("running");
      setTimeRemaining(sessionDuration);
      const end = Date.now() + sessionDuration * 60000;
      sessionTimerRef.current = setInterval(() => {
        const left = (end - Date.now()) / 60000;
        if (left <= 0) stopSession();
        else setTimeRemaining(left);
      }, 1000);
    }, startDelay);
  };

  const pauseSession = () => {
    try {
      if (audio.ctxRef.current?.state === "running") {
        audio.ctxRef.current.suspend().catch((err: any) => {
          console.error("suspend failed:", err);
        });
      }
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      setSessionStatus("paused");
    } catch (err) {
      console.error("pauseSession failed:", err);
    }
  };

  const resumeSession = () => {
    try {
      if (audio.ctxRef.current?.state === "suspended") {
        audio.ctxRef.current.resume().catch((err: any) => {
          console.error("resume failed:", err);
        });
      }
      if (timeRemaining != null) {
        const end = Date.now() + timeRemaining * 60000;
        sessionTimerRef.current = setInterval(() => {
          const left = (end - Date.now()) / 60000;
          if (left <= 0) stopSession();
          else setTimeRemaining(left);
        }, 1000);
      }
      setSessionStatus("running");
    } catch (err) {
      console.error("resumeSession failed:", err);
    }
  };

  const stopSession = () => {
    try {
      audio.stopAll();
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      setSessionStatus("idle");
      setTimeRemaining(null);
    } catch (err) {
      console.error("stopSession failed:", err);
    }
  };

  const formatTime = (m: number | null) => {
    if (!m) return "--:--";
    const min = Math.floor(m);
    const sec = Math.round((m - min) * 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <main className="nq-container">
      {/* Header */}
      <div className="nq-header">
        <div>
          <h1 className="nq-brand">CalmTinnitus</h1>
          <span className="nq-subtitle">Therapy Dashboard</span>
        </div>
        <div className="nq-master-vol">
          🔊 Master
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={masterVol}
            onChange={(e) => setMasterVol(Number(e.target.value))}
          />
        </div>
      </div>

      {/* GUIDE SECTION */}
      <div className="nq-guide">
        <div style={{ marginBottom: "1rem" }}>
          <strong>Quick Start:</strong>
          <div className="nq-guide-steps">
            <span>1. Match your tinnitus pitch below & Save.</span>
            <span>2. Select a therapy mode.</span>
            <span>3. Choose noise / nature sound & start.</span>
          </div>
        </div>
        <div
          style={{
            paddingTop: "1rem",
            borderTop: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <strong>📅 Recommended:</strong> Use 2 sessions/day for 3–6 months for
          habituation. <br />
          <span style={{ opacity: 0.8 }}>
            Or simply use it whenever you are looking for peace.
          </span>
        </div>
      </div>

      {/* Status Banner */}
      {sessionStatus !== "idle" && (
        <div className="nq-banner">
          <div className="nq-timer">{formatTime(timeRemaining)}</div>
          <div className="nq-status-text">
            {THERAPY_MODES.find((m) => m.key === selectedMode)?.label} is Active
          </div>
          {sessionStatus === "running" && (
            <button onClick={pauseSession} className="nq-btn-stop">
              ⏸ Pause Session
            </button>
          )}
          {sessionStatus === "paused" && (
            <button onClick={resumeSession} className="nq-btn-stop">
              ▶ Resume Session
            </button>
          )}
          <button onClick={stopSession} className="nq-btn-stop">
            ⏹ Stop Session
          </button>
        </div>
      )}

      {/* STEP 1: PITCH MATCHING */}
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
        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "1rem",
          }}
        >
          <button onClick={saveProfile} className={saveBtnClass}>
            {saveBtnText}
          </button>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#94a3b8",
              marginTop: "0.5rem",
            }}
          >
            Saved on this device (local profile).
          </p>
        </div>
      </div>

      {/* STEP 2 & 3 GRID */}
      <div className="nq-controls-grid">
        {/* Step 2: Mode */}
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
                <div>
                  <strong>{m.label}</strong>
                  <p>{m.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* EXPLANATION BOX */}
          <div className="nq-info-box">
            <span style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>
              ℹ️
            </span>
            <div>
              <strong>Why you hear ticking / holes / clicks in Relief (CR)</strong>
              <p style={{ marginTop: "0.35rem" }}>
                In <strong>Relief (CR) Therapy</strong> you will hear gentle
                “knocks”, “ticks”, or tiny gaps in the sound.{" "}
                <strong>
                  This is intentional – nothing is wrong with your speakers or
                  phone.
                </strong>
              </p>
              <p style={{ marginTop: "0.35rem" }}>
                These short interruptions are part of the{" "}
                <strong>neuromodulation therapy</strong>. They briefly disrupt
                the brain's tinnitus pattern so over-active auditory neurons
                lose synchronisation over time.
              </p>
              <ul
                style={{
                  marginTop: "0.35rem",
                  paddingLeft: "1.1rem",
                  fontSize: "0.8rem",
                }}
              >
                <li>
                  <strong>Relief (CR)</strong> – active treatment mode with ticks.
                </li>
                <li>
                  <strong>Standard</strong> – comfort / masking only,{" "}
                  <strong>no ticks</strong>.
                </li>
                <li>
                  <strong>Sleep</strong> – softer night profile,{" "}
                  <strong>no ticks</strong>.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 3: Sound & Mixer */}
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
              {SOUND_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* INFO BOX "INSIDE" SOUND AREA */}
          <div className="nq-info-inline">
            <strong>Good to know:</strong>
            <p>
              While the therapy is running you can{" "}
              <strong>play any music, watch videos, or even talk on the phone</strong>{" "}
              on your device. The treatment tone keeps working quietly in the
              background, even if you change apps or use other sounds.
            </p>
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
              <div className="nq-mixer-hint">
                Turn this all the way down if you want{" "}
                <strong>only the therapy tone</strong> without noise.
              </div>
            </div>
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

      {/* START BUTTON */}
      {sessionStatus === "idle" && (
        <button onClick={startSession} className="nq-btn-big">
          ▶ Start Session
        </button>
      )}

      <div className="nq-footer">
        <p>
          Medical Disclaimer: This is a wellness tool. Consult a doctor for
          hearing health issues.
        </p>
      </div>

      <Style />
    </main>
  );
}

// --- 💅 CSS-IN-JS ---
function Style() {
  return (
    <style>{`
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
        background: #f8fafc;
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
      .nq-panel {
        background: white;
        padding: 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
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
      .nq-btn-save:hover {
        background: #cbd5e1;
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
        text-align: left;
        width: 100%;
        background: white;
        border: 1px solid #e2e8f0;
        padding: 1rem;
        border-radius: 0.75rem;
        cursor: pointer;
      }
      .nq-list-item.active {
        border: 2px solid var(--primary);
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
      .nq-info-inline {
        margin-top: 0.75rem;
        margin-bottom: 0.25rem;
        background: #ecfeff;
        border-radius: 0.75rem;
        padding: 0.7rem 0.9rem;
        font-size: 0.85rem;
        color: #0f172a;
        border: 1px solid #a5f3fc;
      }
      .nq-mixer-hint {
        margin-top: 0.3rem;
        font-size: 0.8rem;
        color: #6b7280;
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
        line-height: 1;
      }
      .nq-btn-stop {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 0.5rem 1.25rem;
        border-radius: 99px;
        cursor: pointer;
        font-weight: 600;
        margin-top: 0.5rem;
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
        cursor: pointer;
        box-shadow: 0 10px 20px rgba(14, 165, 233, 0.2);
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
