// app/therapy/page.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// Types
type TherapyMode = "standard" | "relief" | "sleep";
type SessionStatus = "idle" | "running" | "paused";
type SetupStep = "welcome" | "pitch" | "sound" | "ready";

type SoundProfile = {
  id: string;
  label: string;
  description: string;
  type: "noise" | "nature" | "external";
  color?: string; // Brand color for UI
};

const SOUND_PROFILES: SoundProfile[] = [
  {
    id: "spotify",
    label: "Spotify",
    description: "Embed your playlists",
    type: "external",
    color: "#1DB954",
  },
  {
    id: "apple",
    label: "Apple Music",
    description: "Stream albums & stations",
    type: "external",
    color: "#FA243C",
  },
  {
    id: "youtube",
    label: "YouTube / Google",
    description: "Video & Music integration",
    type: "external",
    color: "#FF0000",
  },
  {
    id: "amazon",
    label: "Amazon Music",
    description: "Play via external tab",
    type: "external",
    color: "#00A8E1",
  },
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
    key: "standard" as TherapyMode,
    label: "Standard Therapy",
    description:
      "Gentle background sound with your matched tone for habituation",
    icon: "🎧",
  },
  {
    key: "relief" as TherapyMode,
    label: "Relief (CR) Therapy",
    description:
      "Coordinated reset pattern that may help desynchronize neurons",
    icon: "✨",
  },
  {
    key: "sleep" as TherapyMode,
    label: "Sleep Support",
    description: "Quieter profile to help you wind down and sleep",
    icon: "🌙",
  },
];

export default function ImprovedTherapyPage() {
  // Setup state
  const [setupStep, setSetupStep] = useState<SetupStep>("welcome");
  const [isFirstTime, setIsFirstTime] = useState(true);

  // Audio state
  const [tinnitusPitch, setTinnitusPitch] = useState<number | null>(null);
  const [currentPitch, setCurrentPitch] = useState<number>(8000);
  const [isPitchPlaying, setIsPitchPlaying] = useState(false);
  
  // Default Sound
  const [selectedSound, setSelectedSound] = useState<SoundProfile>(
    SOUND_PROFILES.find(s => s.id === 'pink') || SOUND_PROFILES[4]
  );
  
  // External Link State
  const [externalLink, setExternalLink] = useState("");
  
  const [masterVolume, setMasterVolume] = useState(0.3);
  const [noiseVolume, setNoiseVolume] = useState(0.2);
  const [toneVolume, setToneVolume] = useState(0.1);

  // Session state
  const [selectedMode, setSelectedMode] = useState<TherapyMode>("standard");
  const [sessionDuration, setSessionDuration] = useState(30);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const toneOscRef = useRef<OscillatorNode | null>(null);
  const toneGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const crOscillatorsRef = useRef<OscillatorNode[]>([]);
  const crGainsRef = useRef<GainNode[]>([]);
  const crIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Create master gain node
      if (!masterGainRef.current) {
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.connect(audioContextRef.current.destination);
        masterGainRef.current.gain.value = masterVolume;
      }
    }
    return audioContextRef.current;
  }, [masterVolume]);

  /**
   * 🎵 EXTERNAL PLAYER HELPERS
   */
  const getEmbedUrl = (provider: string, url: string) => {
    if (!url) return null;

    try {
      // SPOTIFY
      if (provider === 'spotify') {
        if (url.includes("/embed/")) return url;
        const match = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
        if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
      } 

      // APPLE MUSIC
      if (provider === 'apple') {
        // Convert music.apple.com -> embed.music.apple.com
        if (url.includes("embed.music.apple.com")) return url;
        return url.replace("music.apple.com", "embed.music.apple.com");
      }

      // YOUTUBE
      if (provider === 'youtube') {
        if (url.includes("youtube.com/embed/")) return url;
        // Standard Watch URL
        let videoId = "";
        const matchStandard = url.match(/[?&]v=([^&]+)/);
        const matchShort = url.match(/youtu\.be\/([^?]+)/);
        
        if (matchStandard) videoId = matchStandard[1];
        else if (matchShort) videoId = matchShort[1];

        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }

      // AMAZON - No direct generic iframe, usually requires "Share -> Embed" specific code or just a link
      // We will handle Amazon via a "Launch" button in the UI instead of an iframe to avoid errors.

    } catch (e) {
      console.error("Error parsing embed URL", e);
      return null;
    }
    return null;
  };


  // Generate noise buffer
  const generateNoiseBuffer = useCallback(
    (ctx: AudioContext, type: string) => {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      if (type === "white") {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      } else if (type === "pink") {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
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
      } else if (type === "brown") {
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }
      } else if (type === "rain" || type === "ocean") {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.5;
        }
      }
      return buffer;
    },
    []
  );

  // Play background noise
  const playNoise = useCallback(() => {
    // If External Sound is selected, do NOT play internal noise
    if (selectedSound.type === 'external') return;

    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();

    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current.disconnect();
    }

    const buffer = generateNoiseBuffer(ctx, selectedSound.id);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();

    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = noiseVolume;

    source.connect(gain);
    gain.connect(masterGainRef.current!);

    source.start(0);

    noiseNodeRef.current = source;
    noiseGainRef.current = gain;
  }, [getAudioContext, generateNoiseBuffer, selectedSound, noiseVolume]);

  // Stop background noise
  const stopNoise = useCallback(() => {
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current.disconnect();
      noiseNodeRef.current = null;
    }
    if (noiseGainRef.current) {
      noiseGainRef.current.disconnect();
      noiseGainRef.current = null;
    }
  }, []);

  // Play pitch matching tone
  const playPitchTone = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();

    if (toneOscRef.current) {
      toneOscRef.current.stop();
      toneOscRef.current.disconnect();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = currentPitch;
    gain.gain.value = toneVolume;

    osc.connect(gain);
    gain.connect(masterGainRef.current!);

    osc.start();

    toneOscRef.current = osc;
    toneGainRef.current = gain;
    setIsPitchPlaying(true);
  }, [getAudioContext, currentPitch, toneVolume]);

  // Stop pitch tone
  const stopPitchTone = useCallback(() => {
    if (toneOscRef.current) {
      toneOscRef.current.stop();
      toneOscRef.current.disconnect();
      toneOscRef.current = null;
    }
    if (toneGainRef.current) {
      toneGainRef.current.disconnect();
      toneGainRef.current = null;
    }
    setIsPitchPlaying(false);
  }, []);

  // Start CR therapy
  const startCRTherapy = useCallback(
    (baseFreq: number) => {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") ctx.resume();

      crOscillatorsRef.current.forEach((osc) => {
        osc.stop();
        osc.disconnect();
      });
      crGainsRef.current.forEach((g) => g.disconnect());
      if (crIntervalRef.current) clearInterval(crIntervalRef.current);

      const frequencies = [0.9, 1.0, 1.1, 1.2].map((m) => baseFreq * m);
      const oscillators: OscillatorNode[] = [];
      const gains: GainNode[] = [];

      frequencies.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = 0;

        osc.connect(gain);
        gain.connect(masterGainRef.current!);
        osc.start();

        oscillators.push(osc);
        gains.push(gain);
      });

      crOscillatorsRef.current = oscillators;
      crGainsRef.current = gains;

      let index = 0;
      const interval = setInterval(() => {
        gains.forEach((g, i) => {
          g.gain.value = i === index ? toneVolume : 0;
        });
        index = (index + 1) % gains.length;
      }, 200);

      crIntervalRef.current = interval;
    },
    [getAudioContext, toneVolume]
  );

  // Stop CR therapy
  const stopCRTherapy = useCallback(() => {
    crOscillatorsRef.current.forEach((osc) => {
      osc.stop();
      osc.disconnect();
    });
    crGainsRef.current.forEach((g) => g.disconnect());
    crOscillatorsRef.current = [];
    crGainsRef.current = [];

    if (crIntervalRef.current) {
      clearInterval(crIntervalRef.current);
      crIntervalRef.current = null;
    }
  }, []);

  // Stop entire session
  const stopSessionInternal = useCallback(() => {
    stopNoise();
    stopPitchTone();
    stopCRTherapy();

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    setSessionStatus("idle");
    setTimeRemaining(null);
  }, [stopNoise, stopPitchTone, stopCRTherapy]);

  // Start session
  const startSession = useCallback(() => {
    if (!tinnitusPitch) {
      alert("Please match your tinnitus pitch first");
      return;
    }

    // Only play noise if it's NOT an external player
    if (selectedSound.type !== 'external') {
      playNoise();
    }

    if (selectedMode === "relief") {
      startCRTherapy(tinnitusPitch);
    } else {
      playPitchTone();
    }

    setSessionStatus("running");
    setTimeRemaining(sessionDuration);

    const startTime = Date.now();
    const endTime = startTime + sessionDuration * 60 * 1000;

    sessionTimerRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, (endTime - now) / 60000);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        stopSessionInternal();
      }
    }, 1000);
  }, [
    tinnitusPitch,
    selectedMode,
    sessionDuration,
    playNoise,
    startCRTherapy,
    playPitchTone,
    stopSessionInternal,
    selectedSound
  ]);

  // Pause session
  const pauseSession = useCallback(() => {
    stopNoise();
    stopPitchTone();
    stopCRTherapy();

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    setSessionStatus("paused");
  }, [stopNoise, stopPitchTone, stopCRTherapy]);

  // Resume session
  const resumeSession = useCallback(() => {
    if (!timeRemaining) return;

    if (selectedSound.type !== 'external') {
      playNoise();
    }

    if (selectedMode === "relief" && tinnitusPitch) {
      startCRTherapy(tinnitusPitch);
    } else {
      playPitchTone();
    }

    setSessionStatus("running");

    const startTime = Date.now();
    const endTime = startTime + timeRemaining * 60 * 1000;

    sessionTimerRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, (endTime - now) / 60000);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        stopSessionInternal();
      }
    }, 1000);
  }, [
    timeRemaining,
    selectedMode,
    tinnitusPitch,
    playNoise,
    startCRTherapy,
    playPitchTone,
    stopSessionInternal,
    selectedSound
  ]);

  const stopSession = useCallback(() => {
    stopSessionInternal();
  }, [stopSessionInternal]);

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume;
    }
  }, [masterVolume]);

  useEffect(() => {
    if (noiseGainRef.current) {
      noiseGainRef.current.gain.value = noiseVolume;
    }
  }, [noiseVolume]);

  useEffect(() => {
    if (toneGainRef.current) {
      toneGainRef.current.gain.value = toneVolume;
    }
    crGainsRef.current.forEach((g) => {
      if (g.gain.value > 0) {
        g.gain.value = toneVolume;
      }
    });
  }, [toneVolume]);

  useEffect(() => {
    if (toneOscRef.current) {
      toneOscRef.current.frequency.value = currentPitch;
    }
  }, [currentPitch]);

  // Load saved settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem("calmtinnitus_settings");
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.tinnitusPitch) {
          setTinnitusPitch(settings.tinnitusPitch);
          setCurrentPitch(settings.tinnitusPitch);
          setIsFirstTime(false);
          setSetupStep("ready");
        }
        if (settings.selectedSound) {
          const sound = SOUND_PROFILES.find(
            (s) => s.id === settings.selectedSound
          );
          if (sound) setSelectedSound(sound);
        }
        if (settings.externalLink) {
          setExternalLink(settings.externalLink);
        }
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }, []);

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem(
        "calmtinnitus_settings",
        JSON.stringify({
          tinnitusPitch,
          selectedSound: selectedSound.id,
          externalLink,
        })
      );
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  }, [tinnitusPitch, selectedSound, externalLink]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopSessionInternal();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopSessionInternal]);

  const formatTime = (minutes: number | null) => {
    if (minutes === null) return "--:--";
    const m = Math.floor(minutes);
    const s = Math.round((minutes - m) * 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Render Setup
  if (isFirstTime && setupStep !== "ready") {
    return (
      <div
        style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          {setupStep === "welcome" && (
            <div>
              <h1 style={{ marginTop: 0 }}>Welcome to CalmTinnitus</h1>
              <p>Let's get you set up in 3 quick steps:</p>
              <ol style={{ lineHeight: 1.8 }}>
                <li>Match your tinnitus pitch</li>
                <li>Choose a background sound</li>
                <li>Start your first session</li>
              </ol>
              <button
                onClick={() => setSetupStep("pitch")}
                style={{
                  background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 2rem",
                  borderRadius: "999px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginTop: "1rem",
                }}
              >
                Get Started
              </button>
            </div>
          )}

          {setupStep === "pitch" && (
             <div>
             <h2 style={{ marginTop: 0 }}>Step 1: Match Your Tinnitus Pitch</h2>
             <p>Adjust the slider until the tone sounds similar to your tinnitus.</p>

             <div style={{ marginTop: "2rem" }}>
               <div
                 style={{
                   display: "flex",
                   justifyContent: "space-between",
                   marginBottom: "0.5rem",
                   alignItems: "center",
                 }}
               >
                 <span style={{ fontWeight: "600" }}>
                   Test Tone: {Math.round(currentPitch)} Hz
                 </span>
                 <button
                   onClick={() =>
                     isPitchPlaying ? stopPitchTone() : playPitchTone()
                   }
                   style={{
                     background: isPitchPlaying ? "#ef4444" : "#22c55e",
                     color: "white",
                     border: "none",
                     padding: "0.5rem 1rem",
                     borderRadius: "999px",
                     cursor: "pointer",
                     display: "flex",
                     alignItems: "center",
                     gap: "0.5rem",
                   }}
                 >
                   <span aria-hidden="true">
                     {isPitchPlaying ? "⏹" : "▶"}
                   </span>
                   {isPitchPlaying ? "Stop" : "Play"}
                 </button>
               </div>

               <input
                 type="range"
                 min="250"
                 max="16000"
                 step="50"
                 value={currentPitch}
                 onChange={(e) => setCurrentPitch(Number(e.target.value))}
                 style={{ width: "100%", height: "8px" }}
               />

               <div
                 style={{
                   display: "flex",
                   justifyContent: "space-between",
                   fontSize: "0.8rem",
                   color: "#666",
                   marginTop: "0.25rem",
                 }}
               >
                 <span>Low (250 Hz)</span>
                 <span>High (16000 Hz)</span>
               </div>
             </div>

             <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
               <button
                 onClick={() => {
                   stopPitchTone();
                   setSetupStep("welcome");
                 }}
                 style={{
                   background: "#e5e7eb",
                   color: "#374151",
                   border: "none",
                   padding: "0.75rem 1.5rem",
                   borderRadius: "999px",
                   cursor: "pointer",
                 }}
               >
                 Back
               </button>
               <button
                 onClick={() => {
                   setTinnitusPitch(currentPitch);
                   stopPitchTone();
                   setSetupStep("sound");
                 }}
                 style={{
                   background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
                   color: "white",
                   border: "none",
                   padding: "0.75rem 1.5rem",
                   borderRadius: "999px",
                   cursor: "pointer",
                   flex: 1,
                 }}
               >
                 Save & Continue
               </button>
             </div>
           </div>
          )}

          {setupStep === "sound" && (
            <div>
              <h2 style={{ marginTop: 0 }}>Step 2: Choose Background Sound</h2>
              <p>Select the sound that feels most comfortable to you:</p>

              <div
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  marginTop: "1.5rem",
                  gridTemplateColumns: "1fr 1fr" // Grid for more options
                }}
              >
                {SOUND_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedSound(profile)}
                    style={{
                      padding: "1rem",
                      border:
                        selectedSound.id === profile.id
                          ? `2px solid ${profile.color || '#0ea5e9'}`
                          : "1px solid #e5e7eb",
                      borderRadius: "0.75rem",
                      background:
                        selectedSound.id === profile.id ? "#f0f9ff" : "white",
                      cursor: "pointer",
                      textAlign: "left",
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {profile.color && (
                        <div style={{
                            position:'absolute', left:0, top:0, bottom:0, width:'6px', background: profile.color
                        }} />
                    )}
                    <div style={{marginLeft: profile.color ? '0.5rem' : '0'}}>
                      <div
                        style={{
                          fontWeight: "600",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {profile.label}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>
                        {profile.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => setSetupStep("pitch")}
                  style={{
                    background: "#e5e7eb",
                    color: "#374151",
                    border: "none",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "999px",
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setSetupStep("ready");
                    setIsFirstTime(false);
                  }}
                  style={{
                    background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
                    color: "white",
                    border: "none",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "999px",
                    cursor: "pointer",
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span aria-hidden="true">✓</span>
                  Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main therapy interface
  return (
    <div
      style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1rem" }}
    >
      {/* Header with Volume Control */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem" }}>CalmTinnitus</h1>
          <p style={{ margin: "0.25rem 0 0", color: "#666" }}>
            Your personalized tinnitus therapy
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            background: "white",
            borderRadius: "999px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <span aria-hidden="true">
            {masterVolume === 0 ? "🔇" : "🔊"}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            style={{ width: "120px" }}
          />
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: "600",
              minWidth: "45px",
            }}
          >
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Session Status */}
      {sessionStatus !== "idle" && (
        <div
          style={{
            background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
            color: "white",
            padding: "1.5rem",
            borderRadius: "1rem",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              fontWeight: "700",
              marginBottom: "0.5rem",
            }}
          >
            {formatTime(timeRemaining)}
          </div>
          <div style={{ fontSize: "1rem", opacity: 0.9 }}>
            {THERAPY_MODES.find((m) => m.key === selectedMode)?.label} •{" "}
            {sessionStatus === "running" ? "In Progress" : "Paused"}
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              marginTop: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            {sessionStatus === "running" ? (
              <button
                onClick={pauseSession}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "2px solid white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span aria-hidden="true">⏸</span> Pause
              </button>
            ) : (
              <button
                onClick={resumeSession}
                style={{
                  background: "white",
                  color: "#0ea5e9",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span aria-hidden="true">▶</span> Resume
              </button>
            )}

            <button
              onClick={stopSession}
              style={{
                background: "rgba(239,68,68,0.9)",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "999px",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span aria-hidden="true">⏹</span> Stop
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: "1.5rem" }}>
        
        {/* 🎵 EXTERNAL MUSIC PLAYER UI */}
        {selectedSound.type === 'external' && (
            <div style={{
                background: '#0f172a', 
                borderRadius: '1rem',
                padding: '1.5rem',
                color: 'white'
            }}>
                <h3 style={{marginTop: 0, display:'flex', alignItems:'center', gap: '0.75rem'}}>
                    {/* Header Icon based on Provider */}
                    <span style={{
                        display:'flex', alignItems:'center', justifyContent:'center',
                        background: 'white', borderRadius:'50%', width:'32px', height:'32px',
                        fontSize: '1.2rem'
                    }}>
                        {selectedSound.id === 'spotify' && '🟢'}
                        {selectedSound.id === 'apple' && '🍎'}
                        {selectedSound.id === 'youtube' && '▶️'}
                        {selectedSound.id === 'amazon' && '🛒'}
                    </span>
                    {selectedSound.label} Integration
                </h3>
                
                {/* Input for link */}
                <div style={{marginBottom: '1rem'}}>
                    <label style={{fontSize: '0.9rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem'}}>
                        Paste your {selectedSound.label} Link (Song, Album, or Playlist):
                    </label>
                    <div style={{display:'flex', gap: '0.5rem'}}>
                        <input 
                            type="text" 
                            placeholder="https://..."
                            value={externalLink}
                            onChange={(e) => setExternalLink(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #334155',
                                background: '#1e293b',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                        />
                        {selectedSound.id === 'amazon' && externalLink && (
                             <a 
                                href={externalLink} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{
                                    background: '#00A8E1',
                                    color: 'white',
                                    textDecoration: 'none',
                                    padding: '0 1.25rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    display:'flex', alignItems:'center'
                                }}
                             >
                                Open
                             </a>
                        )}
                    </div>
                </div>

                {/* EMBED RENDERER */}
                <div style={{minHeight: '100px', background: '#1e293b', borderRadius: '12px', overflow:'hidden', display:'flex', justifyContent:'center', alignItems:'center'}}>
                    
                    {/* 1. If link exists and provider supports embed */}
                    {externalLink && selectedSound.id !== 'amazon' && getEmbedUrl(selectedSound.id, externalLink) ? (
                        <iframe 
                            style={{border: 0, width:'100%', height: selectedSound.id === 'youtube' ? '300px' : '152px'}} 
                            src={getEmbedUrl(selectedSound.id, externalLink)!} 
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                            loading="lazy"
                        ></iframe>
                    ) : (
                        /* 2. Fallback / Empty State */
                        <div style={{padding: '2rem', textAlign: 'center', color: '#64748b'}}>
                            {selectedSound.id === 'amazon' ? (
                                <p>Amazon Music does not support direct embedding.<br/>Click "Open" above to play music in a new tab.</p>
                            ) : (
                                <p>Paste a valid link above to load the player.</p>
                            )}
                        </div>
                    )}
                </div>
                
                <div style={{fontSize: '0.85rem', color: '#94a3b8', marginTop: '1rem', display:'flex', gap: '0.5rem', alignItems:'flex-start'}}>
                    <span>⚠️</span>
                    <span><strong>Note:</strong> Control music volume directly in the player above. The "Master Volume" slider below only affects the therapy tones.</span>
                </div>
            </div>
        )}

        {/* Therapy Mode Selection */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "1rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1.25rem" }}>Therapy Mode</h2>
          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            {THERAPY_MODES.map((mode) => (
              <button
                key={mode.key}
                onClick={() => setSelectedMode(mode.key)}
                disabled={sessionStatus !== "idle"}
                style={{
                  padding: "1rem",
                  border:
                    selectedMode === mode.key
                      ? "2px solid #0ea5e9"
                      : "1px solid #e5e7eb",
                  borderRadius: "0.75rem",
                  background:
                    selectedMode === mode.key ? "#f0f9ff" : "white",
                  cursor: sessionStatus === "idle" ? "pointer" : "not-allowed",
                  textAlign: "left",
                  opacity: sessionStatus !== "idle" ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{mode.icon}</span>
                  <span style={{ fontWeight: "600" }}>{mode.label}</span>
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#666",
                    paddingLeft: "2.25rem",
                  }}
                >
                  {mode.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        {sessionStatus === "idle" && (
          <button
            onClick={startSession}
            disabled={!tinnitusPitch}
            style={{
              background: tinnitusPitch
                ? "linear-gradient(135deg, #0ea5e9, #22c55e)"
                : "#e5e7eb",
              color: tinnitusPitch ? "white" : "#9ca3af",
              border: "none",
              padding: "1.25rem",
              borderRadius: "1rem",
              fontSize: "1.25rem",
              fontWeight: "700",
              cursor: tinnitusPitch ? "pointer" : "not-allowed",
              boxShadow: tinnitusPitch
                ? "0 4px 6px rgba(0,0,0,0.1)"
                : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <span aria-hidden="true">▶</span>
            Start {THERAPY_MODES.find((m) => m.key === selectedMode)?.label}
          </button>
        )}

        {/* Settings Panel */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "1rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1.25rem" }}>
            Advanced Settings
          </h2>

          {/* Background Sound */}
          <div style={{ marginTop: "1.5rem" }}>
            <label
              style={{
                fontWeight: "600",
                display: "block",
                marginBottom: "0.75rem",
              }}
            >
              Background Sound
            </label>
            <select
              value={selectedSound.id}
              onChange={(e) => {
                const sound = SOUND_PROFILES.find(
                  (s) => s.id === e.target.value
                );
                if (sound) setSelectedSound(sound);
              }}
              disabled={sessionStatus === "running"}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
                cursor: sessionStatus === "running" ? "not-allowed" : "pointer",
                opacity: sessionStatus === "running" ? 0.6 : 1,
              }}
            >
              {SOUND_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label} - {profile.description}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Noise Volume Slider (Hide if External Audio is active) */}
          {selectedSound.type !== 'external' && (
              <div style={{ marginTop: "1.5rem" }}>
                <label
                  style={{
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "0.75rem",
                  }}
                >
                  Background Volume: {Math.round(noiseVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={noiseVolume}
                  onChange={(e) => setNoiseVolume(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
          )}

          <div style={{ marginTop: "1rem" }}>
            <label
              style={{
                fontWeight: "600",
                display: "block",
                marginBottom: "0.75rem",
              }}
            >
              Therapy Tone Volume: {Math.round(toneVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.05"
              value={toneVolume}
              onChange={(e) => setToneVolume(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "3rem",
          paddingTop: "2rem",
          borderTop: "1px solid #e5e7eb",
          textAlign: "center",
          fontSize: "0.85rem",
          color: "#666",
        }}
      >
        <p>
          CalmTinnitus is a self-help sound tool and does not replace medical
          care.
        </p>
      </div>
    </div>
  );
}
