"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth"; [cite_start]// [cite: 2]
import { auth } from "@/lib/firebase";
import { createSavedProfile, logTherapySession } from "@/lib/therapyStorage"; [cite_start]// [cite: 3]

// --- CONSTANTS ---
// Shared key for localStorage
const SESSION_LOG_KEY = "calmtinnitus_session_logs_v1";

// --- TYPES ---
type TherapyMode = "relief" | "standard" | "sleep"; [cite_start]// [cite: 4]
type SessionStatus = "idle" | "running" | "paused"; [cite_start]// [cite: 4]

// [UPDATED] Define strict type for background sounds
type BackgroundSoundId = "white" | "none" | "rain" | "ocean"; [cite_start]// [cite: 5]

// [UPDATED] Use the strict type in SoundProfile
type SoundProfile = {
  id: BackgroundSoundId;
  label: string;
  description: string;
  type: "noise" | "nature"; [cite_start]// [cite: 7]
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
    [cite_start]icon: "🎧", // [cite: 8]
  },
  {
    key: "sleep" as TherapyMode,
    label: "3) Sleep Support",
    description: "Quieter profile to help you wind down and fall asleep.",
    icon: "🌙",
  },
]; [cite_start]// [cite: 9]

// --- AUDIO ENGINE HOOK ---
function useTinnitusAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null); [cite_start]// [cite: 10]

  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);

  const toneOscRef = useRef<OscillatorNode | null>(null);
  const toneGainRef = useRef<GainNode | null>(null); [cite_start]// [cite: 12]

  const crOscillatorsRef = useRef<OscillatorNode[]>([]);
  const crGainsRef = useRef<GainNode[]>([]);
  const crIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestToneVolRef = useRef(0.5); [cite_start]// [cite: 13]
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
      [cite_start]} // [cite: 14]

      if (!ctx || ctx.state === "closed") {
        const Ctx =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        const newCtx: AudioContext = new Ctx();
        ctxRef.current = newCtx;
        ctx = newCtx;

        const masterGain = newCtx.createGain();
        masterGain.connect(newCtx.destination);
        masterGain.gain.value = 0.8; [cite_start]// default [cite: 16]
        masterGainRef.current = masterGain;
      }

      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch((err: any) => {
          console.error("AudioContext resume failed:", err);
        }); [cite_start]// [cite: 17]
      }

      return ctx;
    } catch (err) {
      console.error("initAudio failed:", err);
      return null; [cite_start]// [cite: 18]
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
  }, []); [cite_start]// [cite: 19]

  // stronger, clearly audible buffers with more realistic RAIN
  const generateNoiseBuffer = (ctx: AudioContext, id: string) => {
    const bufferSize = ctx.sampleRate * 2; [cite_start]// [cite: 20]
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (id === "white") {
      // Classic white noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.7;
      [cite_start]} // [cite: 22]
    } else if (id === "rain") {
      // Realistic “rain” style noise:
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0;
      let envelope = 0.6; [cite_start]// [cite: 23]

      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; [cite_start]// [cite: 24]
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852; [cite_start]// [cite: 25]
        b3 = 0.8665 * b3 + w * 0.3104856;
        let pink = (b0 + b1 + b2 + b3 + w * 0.5362) * 0.4; [cite_start]// [cite: 26]
        if (i % 2000 === 0) {
          envelope = 0.3 + Math.random() * 0.7;
        [cite_start]} // [cite: 28]
        data[i] = pink * envelope;
      [cite_start]} // [cite: 29]
    } else if (id === "ocean") {
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
      [cite_start]for (let i = 0; i < bufferSize; i++) { // [cite: 30]
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; [cite_start]// [cite: 31]
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852; [cite_start]// [cite: 32]
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522; [cite_start]// [cite: 33]
        b5 = -0.7616 * b5 - w * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.5; [cite_start]// [cite: 34]
        b6 = w * 0.115926; [cite_start]// [cite: 35]
      }
    } else {
      // Fallback
      let lastOut = 0;
      [cite_start]for (let i = 0; i < bufferSize; i++) { // [cite: 36]
        const w = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * w) / 1.02; [cite_start]// [cite: 37]
        lastOut = data[i];
        data[i] *= 1.0;
      [cite_start]} // [cite: 38]
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
      crGainsRef.current.forEach((g) => g.gain.setTargetAtTime(0, now, 0.05));

      [cite_start]stopTimeoutRef.current = setTimeout(() => { // [cite: 40]
        try {
          if (noiseNodeRef.current) {
            try {
              noiseNodeRef.current.stop();
            } catch {}
            noiseNodeRef.current.disconnect();
          }
          [cite_start]if (toneOscRef.current) { // [cite: 41]
            try {
              toneOscRef.current.stop();
            } catch {}
            toneOscRef.current.disconnect();
          }
          crOscillatorsRef.current.forEach((o) => {
            try {
              [cite_start]o.stop(); // [cite: 42]
            } catch {}
            o.disconnect();
          }); [cite_start]// [cite: 43]
          noiseNodeRef.current = null;
          toneOscRef.current = null;
          crOscillatorsRef.current = [];
          if (crIntervalRef.current) clearInterval(crIntervalRef.current);
        [cite_start]} catch (err) { // [cite: 44]
          console.error("stopAll inner cleanup error:", err);
        [cite_start]} // [cite: 45]
      }, 200);
    } catch (err) {
      console.error("stopAll failed:", err);
    [cite_start]} // [cite: 46]
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
          [cite_start]noiseNodeRef.current.stop(); // [cite: 47]
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
      [cite_start]} // [cite: 48]
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

  [cite_start]const playNoise = useCallback( // [cite: 49]
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
      const gain = ctx.createGain(); [cite_start]// [cite: 50]
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

  [cite_start]const playTone = useCallback( // [cite: 51]
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
      osc.type = "sine"; [cite_start]// [cite: 52]
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

  [cite_start]const playCR = useCallback( // [cite: 53]
    (baseFreq: number, volume: number) => {
      const ctx = initAudio();
      if (!ctx || !masterGainRef.current) return;
      hardStopAll();

      latestToneVolRef.current = volume;
      const freqs = [0.9, 1.0, 1.1, 1.2].map((m) => baseFreq * m);
      const oscillators: OscillatorNode[] = [];
      const gains: GainNode[] = [];

      freqs.forEach((f) => {
        [cite_start]const osc = ctx.createOscillator(); // [cite: 54]
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
      crGainsRef.current = gains; [cite_start]// [cite: 55]

      let idx = 0;
      crIntervalRef.current = setInterval(() => {
        try {
          if (!ctx) return;
          const now = ctx.currentTime;
          const currentVol = latestToneVolRef.current;
          [cite_start]gains.forEach((g, i) => { // [cite: 56]
            const target = i === idx ? currentVol : 0;
            g.gain.setTargetAtTime(target, now, 0.02);
          });
          idx = (idx + 1) % gains.length; [cite_start]// [cite: 57]
        } catch (err) {
          console.error("CR interval tick failed:", err);
        [cite_start]} // [cite: 58]
      }, 250);
    },
    [initAudio, hardStopAll]
  );

  [cite_start]const updateVolumes = useCallback((noiseVol: number, toneVol: number) => { // [cite: 59]
    const now = ctxRef.current?.currentTime || 0;
    const effectiveNoise = Math.min(1.2, noiseVol * 1.5);
    if (noiseGainRef.current) {
      noiseGainRef.current.gain.setTargetAtTime(effectiveNoise, now, 0.1);
    }
    if (toneGainRef.current) {
      toneGainRef.current.gain.setTargetAtTime(toneVol, now, 0.1);
    }
    latestToneVolRef.current = toneVol;
  }, []);

  [cite_start]const api = useMemo( // [cite: 60]
    () => ({
      initAudio,
      playNoise,
      playTone,
      playCR,
      stopAll,
      [cite_start]setMasterVolume, // [cite: 61]
      updateVolumes,
      ctxRef,
    }),
    [
      initAudio,
      playNoise,
      playTone,
      playCR,
      stopAll,
      setMasterVolume,
      updateVolumes,
    ]
  );

  return api;
}

// --- ERROR BOUNDARY ---
// Prevents the "white screen of death" if an error occurs in the child component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    console.error("CalmTinnitus Runtime Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
          <h2>Something went wrong.</h2>
          <p>Please refresh the page or try again later.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- MAIN CONTENT (RENAMED) ---
function TherapyInner() {
  // FIREBASE USER (SAFE FOR SSR)
  const [user, setUser] = useState<User | null>(null); [cite_start]// [cite: 62]

  useEffect(() => {
    if (!auth) return;

    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        // create anonymous user automatically
        signInAnonymously(auth).catch((err) => {
          console.error("Anonymous sign-in failed", err);
        });
      }
    });

    [cite_start]return () => unsub(); // [cite: 64]
  }, []);

  const [tinnitusPitch, setTinnitusPitch] = useState(8000);
  const [selectedSound, setSelectedSound] = useState(SOUND_PROFILES[0]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle"); [cite_start]// [cite: 65]
  const [selectedMode, setSelectedMode] = useState<TherapyMode>("relief");
  const [sessionDuration, setSessionDuration] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); [cite_start]// [cite: 66]

  // Profile Saving UI
  const [profileName, setProfileName] = useState("");
  const [saveBtnText, setSaveBtnText] = useState("Save Profile"); [cite_start]// [cite: 67]
  const [saveBtnClass, setSaveBtnClass] = useState("nq-btn-save");

  // Volume
  const [masterVol, setMasterVol] = useState(0.8);
  const [noiseVol, setNoiseVol] = useState(0.7); [cite_start]// [cite: 68]
  const [toneVol, setToneVol] = useState(0.5);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // Timing
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null); [cite_start]// [cite: 69]
  const sessionStartTimeRef = useRef<number | null>(null);
  const audio = useTinnitusAudio();

  // --- REPORT MODAL STATE ---
  const [showReport, setShowReport] = useState(false); [cite_start]// [cite: 70]
  const [completedDuration, setCompletedDuration] = useState(0);
  const [reportNote, setReportNote] = useState(""); [cite_start]// [cite: 71]
  const [reportRelief, setReportRelief] = useState(5);
  const [reportLoudness, setReportLoudness] = useState(5);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // master volume
  [cite_start]useEffect(() => { // [cite: 72]
    audio.setMasterVolume(masterVol);
  }, [masterVol, audio]);

  // live mixer during session
  [cite_start]useEffect(() => { // [cite: 73]
    if (sessionStatus === "running") {
      audio.updateVolumes(noiseVol, toneVol);
    }
  }, [noiseVol, toneVol, sessionStatus, audio]);

  // restart noise if user changes background sound during session
  [cite_start]useEffect(() => { // [cite: 74]
    if (sessionStatus === "running") {
      audio.playNoise(selectedSound.id, noiseVol);
    }
  }, [selectedSound, sessionStatus, noiseVol, audio]);

  // load local profile (legacy / fallback)
  [cite_start]useEffect(() => { // [cite: 75]
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

      [cite_start]if (soundId) { // [cite: 76]
        const s = SOUND_PROFILES.find((p) => p.id === soundId);
        if (s) setSelectedSound(s);
      }
    } catch (e) {
      console.error("Error loading local profile:", e);
    }
  }, []);

  // --- SAVE PROFILE LOGIC (Firebase + Local) ---
  [cite_start]const saveProfile = async () => { // [cite: 77]
    if (typeof window === "undefined") return;
    setSaveBtnText("Saving..."); [cite_start]// [cite: 78]

    try {
      // 1. Always save to LocalStorage (offline backup)
      window.localStorage.setItem("calmtinnitus_pitch", String(tinnitusPitch));
      window.localStorage.setItem("calmtinnitus_soundId", selectedSound.id); [cite_start]// [cite: 79]

      // 2. If logged in, save to Firestore
      if (user) {
        await createSavedProfile({
          userId: user.uid,
          label: profileName || "My Tinnitus Profile",
          earSide: "both",
          frequencyHz: tinnitusPitch,
          baseVolume: masterVol,
        });
      [cite_start]} // [cite: 80]

      setSaveBtnText("✅ Saved!");
      setSaveBtnClass("nq-btn-save saved");
      [cite_start]setTimeout(() => { // [cite: 81]
        setSaveBtnText("Save Profile");
        setSaveBtnClass("nq-btn-save");
      }, 2000);
    [cite_start]} catch (e) { // [cite: 82]
      console.error("Error saving profile:", e);
      setSaveBtnText("❌ Error");
      setTimeout(() => setSaveBtnText("Save Profile"), 2000);
    [cite_start]} // [cite: 83]
  };

  // test tone
  const toggleTestTone = () => {
    if (isPlayingTest) {
      audio.stopAll();
      setIsPlayingTest(false); [cite_start]// [cite: 84]
    } else {
      audio.initAudio();
      const testVol = Math.max(toneVol, 0.5);
      audio.playTone(tinnitusPitch, testVol);
      setIsPlayingTest(true);
    [cite_start]} // [cite: 85]
  };

  useEffect(() => {
    if (isPlayingTest) {
      const testVol = Math.max(toneVol, 0.5);
      audio.playTone(tinnitusPitch, testVol);
    }
  }, [tinnitusPitch, toneVol, isPlayingTest, audio]);

  // Helper for Voice Notification
  [cite_start]const speakSessionEnded = () => { // [cite: 86]
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return; [cite_start]// [cite: 87]

    try {
      const utter = new SpeechSynthesisUtterance(
        "Your Calm Tinnitus session has finished."
      );
      utter.lang = "en-US"; [cite_start]// [cite: 88]
      utter.rate = 1.0;
      utter.pitch = 1.0;
      window.speechSynthesis.cancel(); // clear previous
      window.speechSynthesis.speak(utter);
    [cite_start]} catch (err) { // [cite: 89]
      console.error("speechSynthesis failed", err);
    }
  };

  // --- STOP SESSION & SHOW REPORT ---
  [cite_start]const stopSession = (reason: "user" | "auto" = "user") => { // [cite: 90]
    try {
      audio.stopAll();
      [cite_start]if (sessionTimerRef.current) { // [cite: 91]
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      [cite_start]} // [cite: 92]

      // Calculate actual duration
      let actualMinutes = 0;
      [cite_start]if (sessionStartTimeRef.current) { // [cite: 93]
        const diffMs = Date.now() - sessionStartTimeRef.current;
        actualMinutes = diffMs / 60000; [cite_start]// [cite: 94]
      }

      setSessionStatus("idle");
      setTimeRemaining(null);
      [cite_start]if (reason === "auto") { // [cite: 95]
        // Call the new robust speech function
        speakSessionEnded();
      [cite_start]} // [cite: 96]

      if (actualMinutes > 0.1) {
        setCompletedDuration(actualMinutes);
        setReportNote("");
        setShowReport(true); [cite_start]// [cite: 97]
      }
    } catch (err) {
      console.error("stopSession failed:", err);
    }
  };

  // --- NEW: EXTERNAL AUDIO MODE FUNCTION ---
  [cite_start]const enableExternalAudioMode = () => { // [cite: 98]
    // Mute background noise but keep therapy tone running
    setNoiseVol(0);
    [cite_start]if (sessionStatus === "running") { // [cite: 99]
      audio.updateVolumes(0, toneVol);
    }
  };

  [cite_start]const startSession = () => { // [cite: 100]
    audio.initAudio();

    let startDelay = 0;
    [cite_start]if (isPlayingTest) { // [cite: 101]
      audio.stopAll();
      setIsPlayingTest(false);
      startDelay = 250;
    [cite_start]} // [cite: 102]

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
      sessionStartTimeRef.current = Date.now();

      const end = Date.now() + sessionDuration * 60000;

      // Timer Interval to trigger stop and voice
      [cite_start]sessionTimerRef.current = setInterval(() => { // [cite: 103]
        const left = (end - Date.now()) / 60000;
        if (left <= 0) {
          stopSession("auto"); // This triggers the voice in stopSession
        } else {
          setTimeRemaining(left);
        }
      }, 1000);
    }, startDelay); [cite_start]// [cite: 104]
  };

  const pauseSession = () => {
    try {
      if (audio.ctxRef.current?.state === "running") {
        audio.ctxRef.current.suspend().catch((err: any) => console.error(err));
      [cite_start]} // [cite: 105]
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      setSessionStatus("paused");
    [cite_start]} catch (err) { // [cite: 106]
      console.error("pauseSession failed:", err);
    }
  };

  [cite_start]const resumeSession = () => { // [cite: 107]
    try {
      if (audio.ctxRef.current?.state === "suspended") {
        audio.ctxRef.current.resume().catch((err: any) => console.error(err));
      [cite_start]} // [cite: 108]
      if (timeRemaining != null) {
        const end = Date.now() + timeRemaining * 60000;
        [cite_start]sessionTimerRef.current = setInterval(() => { // [cite: 109]
          const left = (end - Date.now()) / 60000;
          if (left <= 0) stopSession("auto");
          else setTimeRemaining(left);
        }, 1000);
      [cite_start]} // [cite: 110]
      setSessionStatus("running");
    } catch (err) {
      console.error("resumeSession failed:", err);
    [cite_start]} // [cite: 111]
  };

  const formatTime = (m: number | null) => {
    if (!m) return "--:--";
    const min = Math.floor(m); [cite_start]// [cite: 112]
    const sec = Math.round((m - min) * 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // --- SUBMIT REPORT TO FIREBASE & LOCALSTORAGE ---
  [cite_start]const handleFinalizeSession = async () => { // [cite: 113]
    // Note: We proceed even if no user, to save to localStorage
    setIsSubmittingReport(true);
    // Prepare log data (same structure for both)
    [cite_start]const logData = { // [cite: 114]
      mode: selectedMode,
      backgroundSound:
        selectedSound.id === "white" ||
        selectedSound.id === "rain" || [cite_start]// [cite: 115]
        selectedSound.id === "ocean" ||
        selectedSound.id === "none"
          [cite_start]? selectedSound.id // [cite: 116]
          : "none",
      durationMinutes: completedDuration,
      perceivedLoudnessBefore: 0,
      perceivedLoudnessAfter: reportLoudness,
      reliefScore: reportRelief,
      notes: reportNote,
      createdAt: new Date().toISOString(),
      id: Date.now().toString(), // fallback ID
    };

    // 1. Save to LocalStorage (robust to old formats)
    [cite_start]try { // [cite: 117]
      if (typeof window !== "undefined") {
        const existingRaw = window.localStorage.getItem(SESSION_LOG_KEY);
        let existing: any[] = []; [cite_start]// [cite: 118]
        if (existingRaw) {
          try {
            const parsed = JSON.parse(existingRaw);
            [cite_start]if (Array.isArray(parsed)) { // [cite: 119]
              existing = parsed;
            [cite_start]} else if (parsed && typeof parsed === "object") { // [cite: 120]
              // older version: single object
              existing = [parsed];
            [cite_start]} // [cite: 121]
          } catch {
            // bad JSON – ignore and start fresh
            existing = [];
          [cite_start]} // [cite: 122]
        }

        const updated = [logData, ...existing];
        window.localStorage.setItem(SESSION_LOG_KEY, JSON.stringify(updated)); [cite_start]// [cite: 123]
      }
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    [cite_start]} // [cite: 124]

    // 2. Save to Firebase (if logged in)
    if (user) {
      try {
        await logTherapySession({
          userId: user.uid,
          profileId: null,
          mode: logData.mode as any,
          // [UPDATED] Cast backgroundSound to satisfy strict TS type
          backgroundSound: logData.backgroundSound as BackgroundSoundId,
          [cite_start]durationMinutes: logData.durationMinutes, // [cite: 125]
          perceivedLoudnessBefore: 0,
          perceivedLoudnessAfter: logData.perceivedLoudnessAfter,
          reliefScore: logData.reliefScore,
          notes: logData.notes,
        });
      [cite_start]} catch (e) { // [cite: 126]
        console.error("Failed to log session to Firebase", e);
      [cite_start]} // [cite: 127]
    }

    setIsSubmittingReport(false);
    setShowReport(false);
  };

  [cite_start]return ( // [cite: 128]
    <main className="nq-container">
      {/* HEADER - UPDATED */}
      <div className="nq-header">
        <div>
          <h1 className="nq-brand">CalmTinnitus</h1>
          <span className="nq-subtitle">Therapy Dashboard</span>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {/* HISTORY BUTTON */}
          [cite_start]<a href="/history" className="nq-nav-btn"> {/* [cite: 129] */}
            History
          </a>

          <div className="nq-master-vol">
            🔊 Master
            <input
              type="range"
              min="0"
              [cite_start]max="1" // [cite: 130]
              step="0.05"
              value={masterVol}
              onChange={(e) => setMasterVol(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* GUIDE */}
      <div className="nq-guide">
        [cite_start]<div style={{ marginBottom: "1rem" }}> {/* [cite: 131] */}
          <strong>Quick Start:</strong>
          <div className="nq-guide-steps">
            <span>1. [cite_start]Match your tinnitus pitch below & Save.</span> {/* [cite: 132] */}
            <span>2. [cite_start]Select a therapy mode.</span> {/* [cite: 133] */}
            <span>3. [cite_start]Choose a background sound & start.</span> {/* [cite: 134] */}
          </div>
        </div>
        <div
          style={{
            paddingTop: "1rem",
            borderTop: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          [cite_start]<strong>📅 Recommended:</strong> Use 2 sessions/day for 3–6 months for {/* [cite: 135] */}
          habituation.
          [cite_start]<br /> {/* [cite: 136] */}
          <span style={{ opacity: 0.8 }}>
            Or simply use it whenever you are looking for peace.
          [cite_start]</span> {/* [cite: 137] */}
        </div>
      </div>

      {/* STATUS BANNER */}
      {sessionStatus !== "idle" && (
        <div className="nq-banner">
          <div className="nq-timer">{formatTime(timeRemaining)}</div>
          <div className="nq-status-text">
            {THERAPY_MODES.find((m) => m.key === selectedMode)?.label} is Active
          </div>

          [cite_start]{sessionStatus === "running" && ( // [cite: 138]
            <button onClick={pauseSession} className="nq-btn-stop">
              ⏸ Pause Session
            </button>
          )}
          {sessionStatus === "paused" && (
            <button onClick={resumeSession} className="nq-btn-stop">
              [cite_start]▶ Resume Session {/* [cite: 139] */}
            </button>
          )}
          <button onClick={() => stopSession("user")} className="nq-btn-stop">
            ⏹ Stop Session
          </button>
        </div>
      )}

      {/* STEP 1 */}
      <div className="nq-panel nq-step-1">
        [cite_start]<div className="nq-panel-header"> {/* [cite: 140] */}
          <h3>Step 1: Match Your Tinnitus Pitch</h3>
          <div className="nq-pitch-display">
            <span className="nq-hz">{Math.round(tinnitusPitch)} Hz</span>
            <button
              onClick={toggleTestTone}
              className={`nq-btn-test ${isPlayingTest ? [cite_start]"active" : ""}`} // [cite: 141]
            >
              {isPlayingTest ? [cite_start]"⏹ Stop Tone" : "▶ Test Tone"} {/* [cite: 142] */}
            </button>
          </div>
        </div>
        <div className="nq-range-wrap">
          <span className="nq-range-label">Low</span>
          <input
            type="range"
            min="200"
            [cite_start]max="12000" // [cite: 143]
            step="50"
            value={tinnitusPitch}
            onChange={(e) => setTinnitusPitch(Number(e.target.value))}
            className="nq-main-slider"
          />
          <span className="nq-range-label">High</span>
        </div>

        {/* NEW SAVE SECTION */}
        [cite_start]<div className="nq-save-section"> {/* [cite: 144] */}
          <input
            type="text"
            placeholder="Profile Name (e.g. Bedtime)"
            className="nq-input-profile"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
          />
          <button onClick={saveProfile} className={saveBtnClass}>
            [cite_start]{saveBtnText} {/* [cite: 145] */}
          </button>
        </div>
        <p className="nq-save-hint">
          {user
            ? "Saving to your cloud account." [cite_start]// [cite: 146]
            : "Not logged in - saving to device only."}
        </p>
      </div>

      {/* STEP 2 & 3 */}
      <div className="nq-controls-grid">
        {/* Step 2: Mode */}
        <div className="nq-panel">
          <h3>Step 2: Therapy Mode</h3>
          <div className="nq-list">
            [cite_start]{THERAPY_MODES.map((m) => ( // [cite: 147]
              <button
                key={m.key}
                onClick={() => setSelectedMode(m.key)}
                disabled={sessionStatus !== "idle"}
                className={`nq-list-item ${
                  selectedMode === m.key ? [cite_start]"active" : "" // [cite: 148]
                }`}
              >
                <span className="nq-icon">{m.icon}</span>
                <div>
                  <strong>{m.label}</strong>
                  [cite_start]<p>{m.description}</p> {/* [cite: 149] */}
                </div>
              </button>
            ))}
          </div>

          <div className="nq-info-box">
            <span style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>
              [cite_start]ℹ️ {/* [cite: 150] */}
            </span>
            <div>
              <strong>
                Why you hear ticking / holes / clicks in Relief (CR)
              </strong>
              [cite_start]<p style={{ marginTop: "0.35rem" }}> {/* [cite: 151] */}
                In <strong>Relief (CR) Therapy</strong> you will hear gentle
                “knocks”, “ticks”, or tiny gaps in the sound.{" "}
                <strong>
                  This is intentional – nothing is wrong with your speakers or
                  phone. [cite_start]{/* [cite: 152] */}
                [cite_start]</strong> {/* [cite: 153] */}
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Sound & Mixer */}
        <div className="nq-panel">
          <h3>Step 3: Sound & Mixer</h3>

          {/* NEW: THERAPY VOLUME GUIDE */}
          [cite_start]<div // [cite: 154]
            className="nq-info-inline"
            style={{ marginTop: "0.75rem", marginBottom: "1.5rem" }}
          >
            <strong>Therapy Volume – What Is the Correct Level?</strong>
            <p style={{ marginTop: "0.35rem" }}>
              The therapy should be <strong>comfortable and never loud</strong>. [cite_start]{/* [cite: 155] */}
              You should still hear normal sounds around you. [cite_start]The ticks in {/* [cite: 156] */}
              Relief (CR) mode should be <strong>soft but noticeable</strong>.
              [cite_start]Best rule:{" "} {/* [cite: 157] */}
              <strong>
                “Just loud enough to hear it, but soft enough to ignore it.”
              [cite_start]</strong> {/* [cite: 158] */}
            </p>
          </div>

          <div className="nq-slider-group">
            <label>Background Sound</label>
            <select
              className="nq-select"
              value={selectedSound.id}
              [cite_start]onChange={(e) => { // [cite: 159]
                const s = SOUND_PROFILES.find((p) => p.id === e.target.value);
                if (s) setSelectedSound(s); [cite_start]// [cite: 160]
              }}
            >
              {SOUND_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            [cite_start]</select> {/* [cite: 161] */}
          </div>

          <div className="nq-info-inline">
            <strong>Good to know:</strong>
            <p>
              While the therapy is running you can{" "}
              <strong>
                play any music, watch videos, or even talk on the phone. [cite_start]{/* [cite: 162] */}
              [cite_start]</strong> {/* [cite: 163] */}
            </p>
          </div>

          <div className="nq-mixer">
            <div className="nq-slider-group">
              <label>Background Sound Vol</label>
              <input
                type="range"
                [cite_start]min="0" // [cite: 164]
                max="1"
                step="0.05"
                value={noiseVol}
                onChange={(e) => setNoiseVol(Number(e.target.value))}
              />
              [cite_start]<div className="nq-mixer-hint"> {/* [cite: 165] */}
                Turn this all the way down if you want{" "}
                <strong>only the therapy tone</strong> without noise.
              [cite_start]</div> {/* [cite: 166] */}
            </div>
            <div className="nq-slider-group">
              <label>Therapy Tone Vol</label>
              <input
                type="range"
                min="0"
                [cite_start]max="1" // [cite: 167]
                step="0.05"
                value={toneVol}
                onChange={(e) => setToneVol(Number(e.target.value))}
              />
            </div>
          </div>

          [cite_start]{/* NEW: EXTERNAL AUDIO MODE BUTTON */} {/* [cite: 168] */}
          <div style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
            <button
              type="button"
              onClick={enableExternalAudioMode}
              className="nq-chip"
              style={{
                [cite_start]width: "100%", // [cite: 169]
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
              }}
            >
              🔇 External Audio Mode – Mute Background Noise (Keep Therapy Tone)
            [cite_start]</button> {/* [cite: 170] */}
          </div>

          <div className="nq-duration-group">
            {[15, 30, 45, 60].map((t) => (
              <button
                key={t}
                onClick={() => setSessionDuration(t)}
                [cite_start]disabled={sessionStatus !== "idle"} // [cite: 171]
                className={`nq-chip ${sessionDuration === t ? [cite_start]"active" : ""}`} // [cite: 172]
              >
                {t}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* START BUTTON */}
      [cite_start]{sessionStatus === "idle" && ( // [cite: 173]
        <button onClick={startSession} className="nq-btn-big">
          ▶ Start Session
        </button>
      )}

      {/* SESSION REPORT MODAL */}
      {showReport && (
        <div className="nq-modal-overlay">
          <div className="nq-modal">
            <h2>Session Complete</h2>
            [cite_start]<p> {/* [cite: 174] */}
              You completed{" "}
              <strong>{Math.round(completedDuration)} minutes</strong> of
              therapy.
            </p>

            <div className="nq-modal-field">
              <label>Tinnitus Loudness Now (0-10)</label>
              [cite_start]<input // [cite: 175]
                type="range"
                min="0"
                max="10"
                value={reportLoudness}
                onChange={(e) => setReportLoudness(Number(e.target.value))}
              />
              [cite_start]<div // [cite: 176]
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                [cite_start]}} // [cite: 177]
              >
                <span>Low</span>
                <span>High: {reportLoudness}</span>
              </div>
            </div>

            <div className="nq-modal-field">
              <label>How much relief did you feel? (0-10)[cite_start]</label> {/* [cite: 178] */}
              <input
                type="range"
                min="0"
                max="10"
                value={reportRelief}
                [cite_start]onChange={(e) => setReportRelief(Number(e.target.value))} // [cite: 179]
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  [cite_start]fontSize: "0.8rem", // [cite: 180]
                }}
              >
                <span>None</span>
                <span>Lots: {reportRelief}</span>
              </div>
            </div>

            [cite_start]<div className="nq-modal-field"> {/* [cite: 181] */}
              <label>Notes (optional)</label>
              <textarea
                className="nq-modal-textarea"
                placeholder="What sound worked well? How are you feeling?"
                [cite_start]value={reportNote} // [cite: 182]
                onChange={(e) => setReportNote(e.target.value)}
              />
            </div>

            <div className="nq-modal-actions">
              <button
                onClick={() => setShowReport(false)}
                [cite_start]className="nq-btn-cancel" // [cite: 183]
              >
                Skip
              </button>
              <button
                onClick={handleFinalizeSession}
                className="nq-btn-confirm"
                [cite_start]disabled={isSubmittingReport} // [cite: 184]
              >
                {isSubmittingReport ? [cite_start]"Saving..." : "Save Log"} {/* [cite: 185] */}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="nq-footer">
        <p>
          Medical Disclaimer: This is a wellness tool. [cite_start]Consult a doctor for {/* [cite: 186] */}
          hearing health issues.
        [cite_start]</p> {/* [cite: 187] */}
      </div>

      <Style />
    </main>
  );
}

// --- SAFE PAGE EXPORT ---
// This ensures we only load the heavy component once mounted on the client.
export default function TherapyPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
        Loading therapy dashboard...
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <TherapyInner />
    </ErrorBoundary>
  );
}

// --- STYLES ---
[cite_start]function Style() { // [cite: 188]
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
        [cite_start]margin: 0 auto; // [cite: 189]
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
      [cite_start].nq-brand { // [cite: 190]
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
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); [cite_start]// [cite: 191]
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        font-weight: 600; [cite_start]// [cite: 192]
      }
      /* --- NEW NAV BUTTON STYLE --- */
      .nq-nav-btn {
        background: white;
        padding: 6px 12px; [cite_start]// [cite: 193]
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
        border: 1px solid #cbd5e1;
        text-decoration: none;
        display: inline-block;
        transition: background 0.2s; [cite_start]// [cite: 194]
      }
      .nq-nav-btn:hover {
        background: #f1f5f9;
      [cite_start]} // [cite: 195]
      /* --------------------------- */
      .nq-guide {
        background: #f0f9ff;
        border: 1px solid #bae6fd; [cite_start]// [cite: 196]
        padding: 1rem;
        border-radius: 0.75rem;
        margin-bottom: 2rem;
        font-size: 0.9rem;
        color: #0369a1;
      [cite_start]} // [cite: 197]
      .nq-guide-steps {
        display: flex;
        flex-direction: column;
        margin-top: 0.5rem; [cite_start]// [cite: 198]
        gap: 0.25rem;
        font-weight: 500;
      }
      .nq-panel {
        background: white;
        padding: 1.5rem; [cite_start]// [cite: 199]
        border-radius: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      [cite_start]} // [cite: 200]
      .nq-step-1 {
        border: 2px solid #e2e8f0;
        margin-bottom: 1.5rem; [cite_start]// [cite: 201]
      }
      .nq-panel-header {
        display: flex;
        justify-content: space-between; [cite_start]// [cite: 202]
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .nq-panel-header h3 {
        margin: 0;
      [cite_start]} // [cite: 203]
      .nq-pitch-display {
        display: flex;
        align-items: center;
        gap: 1rem; [cite_start]// [cite: 204]
      }
      .nq-hz {
        font-size: 1.5rem;
        font-weight: 800; [cite_start]// [cite: 205]
        color: var(--primary);
        min-width: 80px;
        text-align: right;
      }
      .nq-btn-test {
        background: #0f172a;
        color: white; [cite_start]// [cite: 206]
        border: none;
        padding: 0.5rem 1.2rem;
        border-radius: 99px;
        cursor: pointer;
        font-weight: 600;
        transition: 0.2s;
      [cite_start]} // [cite: 207]
      .nq-btn-test.active {
        background: #ef4444;
      [cite_start]} // [cite: 208]
      .nq-range-wrap {
        display: flex;
        align-items: center;
        gap: 1rem; [cite_start]// [cite: 209]
      }
      .nq-range-label {
        font-size: 0.8rem;
        color: var(--text-dim); [cite_start]// [cite: 210]
        white-space: nowrap;
      }
      .nq-main-slider {
        flex: 1;
        height: 8px; [cite_start]// [cite: 211]
        border-radius: 4px;
        appearance: none;
        background: #e2e8f0;
      }
      .nq-main-slider::-webkit-slider-thumb {
        appearance: none;
        width: 24px; [cite_start]// [cite: 212]
        height: 24px;
        border-radius: 50%;
        background: var(--primary);
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); [cite_start]// [cite: 213]
      }

      .nq-save-section {
        margin-top: 1.5rem;
        text-align: center; [cite_start]// [cite: 214]
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
      [cite_start]} // [cite: 215]
      .nq-input-profile {
        padding: 0.6rem 1rem;
        border: 1px solid #cbd5e1; [cite_start]// [cite: 216]
        border-radius: 99px;
        font-size: 0.9rem;
        width: 200px;
      [cite_start]} // [cite: 217]
      .nq-save-hint {
        text-align: center;
        font-size: 0.8rem;
        color: #94a3b8; [cite_start]// [cite: 218]
        margin-top: 0.5rem;
      }

      .nq-btn-save {
        background: #e2e8f0;
        color: #334155; [cite_start]// [cite: 219]
        border: none;
        padding: 0.6rem 2rem;
        border-radius: 99px;
        cursor: pointer;
        font-weight: 700;
        transition: 0.3s;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); [cite_start]// [cite: 220]
      }
      .nq-btn-save:hover {
        background: #cbd5e1;
      [cite_start]} // [cite: 221]
      .nq-btn-save.saved {
        background: #22c55e;
        color: white;
        transform: scale(1.05); [cite_start]// [cite: 222]
        box-shadow: 0 5px 15px rgba(34, 197, 94, 0.4);
      [cite_start]} // [cite: 223]
      .nq-controls-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem; [cite_start]// [cite: 224]
        margin-bottom: 2rem;
      }
      @media (max-width: 768px) {
        .nq-controls-grid {
          grid-template-columns: 1fr;
        [cite_start]} // [cite: 225]
      }
      .nq-info-box {
        margin-top: 1.5rem;
        background: #fffbeb; [cite_start]// [cite: 226]
        border: 1px solid #fcd34d;
        padding: 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.8rem;
        color: #92400e;
        display: flex;
        align-items: flex-start;
        line-height: 1.4;
      [cite_start]} // [cite: 227]
      .nq-list {
        display: grid;
        gap: 0.5rem;
      [cite_start]} // [cite: 228]
      .nq-list-item {
        display: flex;
        align-items: center;
        gap: 1rem; [cite_start]// [cite: 229]
        text-align: left;
        width: 100%;
        background: white;
        border: 1px solid #e2e8f0;
        padding: 1rem;
        border-radius: 0.75rem;
        cursor: pointer;
      [cite_start]} // [cite: 230]
      .nq-list-item.active {
        border: 2px solid var(--primary);
        background: #f0f9ff; [cite_start]// [cite: 231]
      }
      .nq-slider-group label {
        display: block;
        font-size: 0.85rem; [cite_start]// [cite: 232]
        font-weight: 600;
        margin-bottom: 0.3rem;
      }
      .nq-select {
        width: 100%;
        padding: 0.6rem; [cite_start]// [cite: 233]
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
        font-size: 1rem;
      [cite_start]} // [cite: 234]
      input[type="range"] {
        width: 100%;
        accent-color: var(--primary);
      [cite_start]} // [cite: 235]
      .nq-mixer {
        display: grid;
        gap: 1rem;
        margin-top: 1rem; [cite_start]// [cite: 236]
        margin-bottom: 1.5rem;
      }
      .nq-mixer-hint {
        margin-top: 0.3rem;
        font-size: 0.8rem; [cite_start]// [cite: 237]
        color: #6b7280;
      }
      .nq-duration-group {
        display: flex;
        gap: 0.5rem; [cite_start]// [cite: 238]
      }
      .nq-chip {
        flex: 1;
        border: 1px solid #e2e8f0; [cite_start]// [cite: 239]
        background: white;
        padding: 0.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
      [cite_start]} // [cite: 240]
      .nq-chip.active {
        background: var(--primary);
        color: white;
        border-color: var(--primary); [cite_start]// [cite: 241]
      }
      .nq-info-inline {
        margin-top: 0.75rem;
        margin-bottom: 0.25rem; [cite_start]// [cite: 242]
        background: #ecfeff;
        border-radius: 0.75rem;
        padding: 0.7rem 0.9rem;
        font-size: 0.85rem;
        color: #0f172a;
        border: 1px solid #a5f3fc;
      [cite_start]} // [cite: 243]
      .nq-banner {
        background: linear-gradient(135deg, var(--primary), var(--success));
        color: white; [cite_start]// [cite: 244]
        padding: 1.5rem;
        border-radius: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 2rem;
      [cite_start]} // [cite: 245]
      .nq-timer {
        font-size: 2.5rem;
        font-weight: 800;
        line-height: 1; [cite_start]// [cite: 246]
      }
      .nq-btn-stop {
        background: rgba(255, 255, 255, 0.2);
        border: none; [cite_start]// [cite: 247]
        color: white;
        padding: 0.5rem 1.25rem;
        border-radius: 99px;
        cursor: pointer;
        font-weight: 600;
        margin-top: 0.5rem;
      [cite_start]} // [cite: 248]
      .nq-btn-big {
        width: 100%;
        background: var(--primary);
        color: white; [cite_start]// [cite: 249]
        border: none;
        padding: 1.2rem;
        border-radius: 1rem;
        font-size: 1.2rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 10px 20px rgba(14, 165, 233, 0.2); [cite_start]// [cite: 250]
      }
      .nq-footer {
        text-align: center;
        margin-top: 3rem; [cite_start]// [cite: 251]
        font-size: 0.8rem;
        color: var(--text-dim);
      }
      .nq-status-text {
        font-size: 0.9rem;
        opacity: 0.9; [cite_start]// [cite: 252]
      }

      .nq-modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0; [cite_start]// [cite: 253]
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999;
        padding: 1rem;
      [cite_start]} // [cite: 254]
      .nq-modal {
        background: white;
        padding: 2rem;
        border-radius: 1rem; [cite_start]// [cite: 255]
        width: 100%;
        max-width: 500px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      [cite_start]} // [cite: 256]
      .nq-modal h2 { margin-top: 0;
      [cite_start]} // [cite: 257]
      .nq-modal-field { margin-top: 1rem;
      [cite_start]} // [cite: 258]
      .nq-modal-textarea {
        width: 100%;
        border: 1px solid #cbd5e1; [cite_start]// [cite: 259]
        border-radius: 0.5rem;
        padding: 0.5rem;
        min-height: 80px;
        margin-top: 0.25rem;
      [cite_start]} // [cite: 260]
      .nq-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem; [cite_start]// [cite: 261]
        margin-top: 1.5rem;
      }
      .nq-btn-cancel {
        background: transparent;
        border: none; [cite_start]// [cite: 262]
        color: #64748b;
        cursor: pointer;
        padding: 0.5rem 1rem;
      }
      .nq-btn-confirm {
        background: var(--primary);
        color: white; [cite_start]// [cite: 263]
        border: none;
        padding: 0.5rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 600;
      }
    `}</style>
  );
[cite_start]} // [cite: 264]
