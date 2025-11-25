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
  type: "noise" | "nature";
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
    description: "Gentle rainfall-style noise",
    type: "nature",
  },
  {
    id: "ocean",
    label: "Ocean Waves",
    description: "Rolling surf-style noise",
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
        masterGain.gain.value = 0.8; // default
        masterGainRef.current = masterGain;
      }

      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch((err: any) => {
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

  // stronger, clearly audible buffers
  const generateNoiseBuffer = (ctx: AudioContext, id: string) => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (id === "white") {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.7;
      }
    } else if (id === "pink" || id === "rain" || id === "ocean") {
      // pink-style noise – softer high end
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
    } else {
      // brown + default
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * w) / 1.02;
        lastOut = data[i];
        data[i] *= 1.0;
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
    (id: string, volume: number) => {
      const ctx = initAudio();
      if (!ctx || !masterGainRef.current) return;

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

      const effectiveNoise = Math.min(1.2, volume * 1.5); // stronger
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
    },
    [initAudio, hardStopAll]
  );

  const updateVolumes = useCallback((noiseVol: number, toneVol: number) => {
    const now = ctxRef.current?.currentTime || 0;

    const effectiveNoise = Math.min(1.2, noiseVol * 1.5); // boost and make slider “strong”
    if (noiseGainRef.current) {
      noiseGainRef.current.gain.setTargetAtTime(effectiveNoise, now, 0.1);
    }
    if (toneGainRef.current) {
      toneGainRef.current.gain.setTargetAtTime(toneVol, now, 0.1);
    }
    latestToneVolRef.current = toneVol;
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

// --- PAGE COMPONENT ---
export default function TherapyPage() {
  const [tinnitusPitch, setTinnitusPitch] = useState(8000);
  const [selectedSound, setSelectedSound] = useState(SOUND_PROFILES[0]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [selectedMode, setSelectedMode] = useState<TherapyMode>("relief");
  const [sessionDuration, setSessionDuration] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const [saveBtnText, setSaveBtnText] = useState("Save Profile");
  const [saveBtnClass, setSaveBtnClass] = useState("nq-btn-save");

  const [masterVol, setMasterVol] = useState(0.8);
  const [noiseVol, setNoiseVol] = useState(0.7);
  const [toneVol, setToneVol] = useState(0.5);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const audio = useTinnitusAudio();

  // master volume
  useEffect(() => {
    audio.setMasterVolume(masterVol);
  }, [masterVol, audio]);

  // live mixer during session
  useEffect(() => {
    if (sessionStatus === "running") {
      audio.updateVolumes(noiseVol, toneVol);
    }
  }, [noiseVol, toneVol, sessionStatus, audio]);

  // restart noise if user changes background sound during session
  useEffect(() => {
    if (sessionStatus === "running") {
      audio.playNoise(selectedSound.id, noiseVol);
    }
  }, [selectedSound, sessionStatus, noiseVol, audio]);

  // load local profile
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const pitch = window.localStorage.getItem("calmtinnitus_pitch");
      const soundId = window.localStorage.getItem("calmtinnitus_soundId");
      if (pitch) {
        const val = Number(pitch);
        if (!Number.isNaN(val)) {
          setTinnitusPitch(val);
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

  const saveProfile = () => {
    if (typeof window === "undefined") return;
    setSaveBtnText("Saving...");
    try {
      window.localStorage.setItem("calmtinnitus_pitch", String(tinnitusPitch));
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

  // test tone
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
      } else {
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
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
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
      {/* HEADER */}
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

      {/* GUIDE */}
      <div className="nq-guide">
        <div style={{ marginBottom: "1rem" }}>
          <strong>Quick Start:</strong>
          <div className="nq-guide-steps">
            <span>1. Match your tinnitus pitch below & Save.</span>
            <span>2. Select a therapy
