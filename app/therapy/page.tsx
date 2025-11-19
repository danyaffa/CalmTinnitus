// app/therapy/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useMediaSession, MediaSessionOptions } from "../../hooks/useMediaSession"; 

const DEFAULT_SESSION_MINUTES = 30;

// Predefined therapy modes
const THERAPY_MODES: { key: TherapyMode; label: string; description: string }[] =
  [
    {
      key: "standard",
      label: "Standard Sound Therapy",
      description:
        "Gentle broadband noise plus tinnitus-matching tone for habituation.",
    },
    {
      key: "relief",
      label: "Relief / CR Therapy",
      description:
        "Coordinated Reset-style sequence of tones that may help desynchronize overactive neurons involved in tinnitus.",
    },
    {
      key: "sleep",
      label: "Sleep Support",
      description:
        "Gentle sound profile aimed at winding down and supporting sleep while masking tinnitus.",
    },
  ];

const THERAPY_TYPES: { key: TherapyType; label: string; description: string }[] =
  [
    {
      key: "notch",
      label: "Relaxation / Masking",
      description:
        "For winding down; focuses on masking tinnitus and promoting calm.",
    },
    {
      key: "cr",
      label: "Brain Training / Habituation",
      description:
        "Focused listening sessions to help your brain tune out tinnitus over time.",
    },
  ];

// Simple helper to format mm:ss
const formatTime = (totalMinutes: number | null) => {
  if (totalMinutes === null) return "--:--";
  const minutes = Math.floor(totalMinutes);
  const seconds = Math.round((totalMinutes - minutes) * 60);
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
};

const TherapyPage = () => {
  const {
    user,
    sessionHistory,
    setSessionHistory,
    saveSessionToCloud,
    loading,
  } = useAuthCtx();

  // Local state
  const [therapyType, setTherapyType] = useState<TherapyType>("notch");
  const [sessionMinutes, setSessionMinutes] = useState<number>(
    DEFAULT_SESSION_MINUTES
  );
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [currentMode, setCurrentMode] = useState<TherapyMode | null>(null);

  const [tinnitusPitch, setTinnitusPitch] = useState<number | null>(null);
  const [tinnitusPitchHz, setTinnitusPitchHz] = useState<number | null>(null);
  const [isMatchingPitch, setIsMatchingPitch] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState<SoundProfile | null>(
    null
  );
  
  const [mediaSessionOptions, setMediaSessionOptions] = useState<
    MediaSessionOptions | undefined
  >(undefined);

  const [localHistoryLoaded, setLocalHistoryLoaded] = useState(false);

  // Audio-related refs
  const whiteNoiseRef = useRef<HTMLAudioElement | null>(null);
  const toneOscRef = useRef<OscillatorNode | null>(null);
  const toneGainRef = useRef<GainNode | null>(null);
  const crOscillatorsRef = useRef<OscillatorNode[]>([]);
  const crGainsRef = useRef<GainNode[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useMediaSession(mediaSessionOptions);

  // ---------- AUDIO CONTEXT MANAGEMENT ----------

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const stopAllOscillators = () => {
    if (toneOscRef.current) {
      try {
        toneOscRef.current.stop();
      } catch {}
      toneOscRef.current.disconnect();
      toneOscRef.current = null;
    }
    if (toneGainRef.current) {
      toneGainRef.current.disconnect();
      toneGainRef.current = null;
    }
    crOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch {}
      osc.disconnect();
    });
    crGainsRef.current.forEach((g) => g.disconnect());
    crOscillatorsRef.current = [];
    crGainsRef.current = [];
  };

  const stopWhiteNoise = () => {
    if (whiteNoiseRef.current) {
      whiteNoiseRef.current.pause();
      whiteNoiseRef.current.currentTime = 0;
    }
  };
  
  const stopCRTherapy = () => {
    const refAny = crOscillatorsRef as any;
    if (refAny.currentIntervalId) {
      clearInterval(refAny.currentIntervalId);
      refAny.currentIntervalId = null;
    }
    stopAllOscillators();
  };

  const stopEverything = useCallback(() => {
    // Stop audio
    stopWhiteNoise();
    stopAllOscillators();
    
    // Stop CR pattern
    stopCRTherapy();

    // Stop timer
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    setStatus("idle");
    setCurrentMode(null);
    setMinutesLeft(null);

    // Reset media session by clearing the options state
    setMediaSessionOptions(undefined);
  }, []);

  // ---------- WHITE NOISE HANDLING ----------

  const playWhiteNoise = (audioElement: HTMLAudioElement) => {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    audioElement.loop = true;
    audioElement
      .play()
      .catch((err) => console.error("Failed to play white noise", err));
  };

  // ---------- TINNITUS PITCH MATCHING ----------

  const startPitchMatchingTone = () => {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Clean previous tone
    if (toneOscRef.current) {
      try {
        toneOscRef.current.stop();
      } catch {}
      toneOscRef.current.disconnect();
    }
    if (toneGainRef.current) {
      toneGainRef.current.disconnect();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Start with a comfortable audible tone, say 2000 Hz
    osc.type = "sine";
    // If in standard/sleep mode, use the saved tinnitusPitch, otherwise default to 2000
    osc.frequency.value = currentMode && (currentMode === 'standard' || currentMode === 'sleep') && tinnitusPitch !== null ? tinnitusPitch : tinnitusPitchHz || 2000;

    gain.gain.value = 0.1; // Keep it gentle
    osc.connect(gain).connect(ctx.destination);
    osc.start();

    toneOscRef.current = osc;
    toneGainRef.current = gain;
  };

  const stopPitchMatchingTone = () => {
    if (toneOscRef.current) {
      try {
        toneOscRef.current.stop();
      } catch {}
      toneOscRef.current.disconnect();
      toneOscRef.current = null;
    }
    if (toneGainRef.current) {
      toneGainRef.current.disconnect();
      toneGainRef.current = null;
    }
  };

  const handlePitchIncrease = (amountHz: number) => {
    if (!toneOscRef.current) return;
    toneOscRef.current.frequency.value += amountHz;
    setTinnitusPitchHz(toneOscRef.current.frequency.value);
  };

  const handlePitchDecrease = (amountHz: number) => {
    if (!toneOscRef.current) return;
    const newFreq = Math.max(100, toneOscRef.current.frequency.value - amountHz);
    toneOscRef.current.frequency.value = newFreq;
    setTinnitusPitchHz(newFreq);
  };

  const saveMatchedPitch = () => {
    if (!tinnitusPitchHz) return;
    setTinnitusPitch(tinnitusPitchHz);
    setIsMatchingPitch(false);
    stopPitchMatchingTone();
  };

  // ---------- COORDINATED RESET (CR) THERAPY ----------

  const startCRTherapy = (baseFrequency: number) => {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    stopAllOscillators();

    const crFrequencies = [0.9, 1.0, 1.1, 1.2].map(
      (ratio) => baseFrequency * ratio
    );

    const gains: GainNode[] = [];
    const oscillators: OscillatorNode[] = [];

    crFrequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      oscillators.push(osc);
      gains.push(gain);
    });

    crOscillatorsRef.current = oscillators;
    crGainsRef.current = gains;

    let currentIndex = 0;
    const patternInterval = 300; // ms

    const intervalId = setInterval(() => {
      gains.forEach((g, idx) => {
        g.gain.value = idx === currentIndex ? 0.08 : 0;
      });
      currentIndex = (currentIndex + 1) % gains.length;
    }, patternInterval);

    (crOscillatorsRef as any).currentIntervalId = intervalId;
  };

  // ---------- SESSION LOGGING ----------

  const saveSession = () => {
    const baseLog: Omit<SessionLog, "id"> = {
      // store numeric timestamp (ms since epoch)
      date: Date.now(),
      mode: currentMode || "standard",
      therapyType,
      duration: sessionMinutes - (minutesLeft || sessionMinutes),
      tinnitusPitch: tinnitusPitch || 0,
    };

    const localKey = "neuroquiet_sessionHistory";
    try {
      const current =
        (JSON.parse(
          window.localStorage.getItem(localKey) || "[]"
        ) as SessionLog[]) || [];
      const newLocal: SessionLog = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...baseLog,
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

  // ---------- SESSION CONTROL ----------

  const startSession = (mode: TherapyMode) => {
    if (!tinnitusPitch) {
      alert("Please match and save your tinnitus pitch first.");
      return;
    }

    // --- NEW: Positive Reinforcement and Guidance ---
    alert(
      "🎉 Congratulations! You've taken the first step toward controlling your tinnitus.\n\n" +
      "1. **Assess your Tinnitus Pitch**: You've already completed this crucial first step!\n" +
      "2. **Select Therapy Type**: Choose your mode (Standard, Relief, or Sleep).\n" +
      "3. **Start Therapy Session**: Click 'Start' and listen at a comfortable volume.\n" +
      "4. **Measure your Progress**: Continue regular sessions.\n\n" +
      "Relax, you are on your way to control of Tinnitus."
    );
    // --- END NEW ---

    stopEverything(); // Calls stopCRTherapy and resets status/timer

    setCurrentMode(mode);

    const whiteNoiseEl = whiteNoiseRef.current;
    if (whiteNoiseEl) {
      playWhiteNoise(whiteNoiseEl);
    }

    // Standard & sleep use a single matched tone; relief uses CR pattern
    if (mode === "standard" || mode === "sleep") {
      startPitchMatchingTone();
    } else if (mode === "relief") {
      startCRTherapy(tinnitusPitch);
    }

    setStatus("running"); // This is the 'green light' visual trigger (via globals.css)
    setMinutesLeft(sessionMinutes);

    // Timer interval logic
    const intervalCallback = () => {
        setMinutesLeft((prev) => {
            if (prev === null) return null;
            if (prev <= 1) {
                // Simplified stop logic when time runs out
                if (sessionTimerRef.current) {
                    clearInterval(sessionTimerRef.current);
                    sessionTimerRef.current = null;
                }
                stopWhiteNoise();
                stopAllOscillators();
                stopCRTherapy();
                setStatus("idle");
                setCurrentMode(null);
                saveSession();
                setMediaSessionOptions(undefined);
                return null;
            }
            return prev - 1;
        });
    };

    sessionTimerRef.current = setInterval(intervalCallback, 60_000);

    const title =
      mode === "relief"
        ? "NeuroQuiet – Relief / CR Therapy"
        : mode === "sleep"
        ? "NeuroQuiet – Sleep Support Session"
        : "NeuroQuiet – Standard Sound Therapy";

    // Set media session options for the hook
    setMediaSessionOptions({
      title,
      artist: "NeuroQuiet",
      album: "Tinnitus Relief Session",
      // Cleaned up onPlay logic to directly call the session control functions.
      onPlay: () => {
        // Safe to call resumeSession/startSession as they contain status checks
        if (status === "paused") { 
          resumeSession();
        } else if (status === "idle") {
          startSession(mode); 
        }
      },
      onPause: pauseSession,
      onStop: stopEverything,
    });
  };

  const pauseSession = () => {
    if (status !== "running") return;
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    stopWhiteNoise();
    stopAllOscillators();
    stopCRTherapy();
    setStatus("paused");

    // Fix closure issue: simply call resumeSession, which contains the status check.
    setMediaSessionOptions((prev) => ({
      ...prev,
      onPlay: () => {
        resumeSession(); 
      },
      onPause: undefined, // Disable pause button
      onStop: stopEverything,
    }));
  };

  const resumeSession = () => {
    if (status !== "paused" || minutesLeft === null || !currentMode) return;

    const whiteNoiseEl = whiteNoiseRef.current;
    if (whiteNoiseEl) {
      playWhiteNoise(whiteNoiseEl);
    }

    if (currentMode === "standard" || currentMode === "sleep") {
      startPitchMatchingTone();
    } else if (currentMode === "relief" && tinnitusPitch) {
      startCRTherapy(tinnitusPitch);
    }

    setStatus("running");

    // Re-start the timer logic.
    const intervalCallback = () => {
        setMinutesLeft((prev) => {
            if (prev === null) return null;
            if (prev <= 1) {
                // Simplified stop logic when time runs out
                if (sessionTimerRef.current) {
                    clearInterval(sessionTimerRef.current);
                    sessionTimerRef.current = null;
                }
                stopWhiteNoise();
                stopAllOscillators();
                stopCRTherapy();
                setStatus("idle");
                setCurrentMode(null);
                saveSession();
                setMediaSessionOptions(undefined);
                return null;
            }
            return prev - 1;
        });
    };
    
    sessionTimerRef.current = setInterval(intervalCallback, 60_000);

    // Restore media session handlers
    setMediaSessionOptions((prev) => ({
      ...prev,
      onPlay: undefined, // Disable play button
      onPause: pauseSession,
      onStop: stopEverything,
    }));
  };

  // ---------- LOCAL HISTORY LOAD ----------

  useEffect(() => {
    if (localHistoryLoaded) return;
    try {
      const stored = window.localStorage.getItem("neuroquiet_sessionHistory");
      if (stored) {
        const parsed = JSON.parse(stored) as SessionLog[];
        setSessionHistory(parsed);
      }
    } catch {}
    setLocalHistoryLoaded(true);
  }, [localHistoryLoaded, setSessionHistory]);

  // ---------- CLEANUP ----------

  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, [stopEverything]);

  // ---------- RENDER HELPERS ----------

  const onSelectProfile = (profile: SoundProfile | null) => {
    setSelectedProfile(profile);
    if (profile && profile.baseNoise) {
      if (whiteNoiseRef.current) {
        whiteNoiseRef.current.src = profile.baseNoise;
      }
    }
  };

  const handleSessionMinutesChange = (minutes: number) => {
    setSessionMinutes(minutes);
    if (status === "running" || status === "paused") {
      setMinutesLeft(minutes);
    }
  };

  const renderSessionControls = () => {
    if (!currentMode || status === "idle") {
      return (
        <div className="session-controls">
          <button
            onClick={() => startSession("standard")}
            disabled={!tinnitusPitch || !selectedProfile}
            className="primary-btn"
          >
            Start Standard Session
          </button>
          <button
            onClick={() => startSession("relief")}
            disabled={!tinnitusPitch || !selectedProfile}
            className="secondary-btn"
          >
            Start Relief / CR Session
          </button>
          <button
            onClick={() => startSession("sleep")}
            disabled={!tinnitusPitch || !selectedProfile}
            className="ghost-btn"
          >
            Start Sleep Session
          </button>
        </div>
      );
    }

    if (status === "running") {
      return (
        <div className="session-controls">
          <button onClick={pauseSession} className="secondary-btn">
            Pause
          </button>
          <button onClick={stopEverything} className="ghost-btn">
            Stop
          </button>
        </div>
      );
    }

    if (status === "paused") {
      return (
        <div className="session-controls">
          <button onClick={resumeSession} className="primary-btn">
            Resume
          </button>
          <button onClick={stopEverything} className="ghost-btn">
            Stop
          </button>
        </div>
      );
    }

    return null;
  };

  const renderHistory = () => {
    if (!sessionHistory || sessionHistory.length === 0) {
      return (
        <p className="empty-history">
          No sessions logged yet. Once you complete a session, it will appear
          here.
        </p>
      );
    }

    return (
      <ul className="history-list">
        {sessionHistory.map((session) => (
          <li key={session.id} className="history-item">
            <div>
              <div className="history-date">
                {new Date(session.date).toLocaleString()}
              </div>
              <div className="history-meta">
                <span>
                  {session.therapyType === "notch" ? "Relax" : "Train"}
                </span>
                <span>•</span>
                <span>
                  {session.mode === "relief"
                    ? "Relief / CR"
                    : session.mode === "sleep"
                    ? "Sleep"
                    : "Standard"}
                </span>
              </div>
            </div>
            <div className="history-details">
              <span>{session.duration} min</span>
              <span>•</span>
              <span>{Math.round(session.tinnitusPitch)} Hz</span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  // ---------- MAIN RENDER ----------

  return (
    <div className="therapy-page">
      <header className="therapy-header">
        <div className="logo-block">
          <div className="logo-text-main">NeuroQuiet</div>
          <div className="logo-text-sub">Tinnitus Relief Companion</div>
        </div>
        <div className="header-right">
          {user ? (
            <div className="user-block">
              <span className="user-email">{user.email}</span>
              <button onClick={firebaseSignOut} className="ghost-btn small">
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={firebaseGoogleSignIn}
              className="primary-btn small"
              disabled={loading}
            >
              Sign in with Google
            </button>
          )}
        </div>
      </header>

      <main className="therapy-main">
        <section className="therapy-intro card">
          <div className="therapy-intro-text">
            <h1>Guided Sound Therapy for Tinnitus</h1>
            <p>
              NeuroQuiet combines personalized soundscapes with{" "}
              <strong>tinnitus pitch matching</strong> and{" "}
              <strong>Coordinated Reset-style (CR) patterns</strong> to help
              your brain gradually tune out tinnitus.
            </p>
            <p>
              Start by matching your tinnitus pitch, then choose a therapy mode
              and session length that works for you.
            </p>
          </div>
          <div className="therapy-hero-visual">
            <Image
              src="/images/ear-relief.svg"
              alt="Calm person listening to sound therapy"
              width={260}
              height={260}
            />
          </div>
        </section>

        <section className="card pitch-matcher-section">
          <div className="section-header">
            <h2>Step 1 – Match Your Tinnitus Pitch</h2>
            <p>
              Use the tone controls below to find a pitch that closely matches
              your tinnitus. Save it so we can personalize your therapy.
            </p>
          </div>

          <div className="pitch-controls">
            <button
              onClick={() => {
                setIsMatchingPitch(true);
                startPitchMatchingTone();
              }}
              disabled={isMatchingPitch}
              className="primary-btn"
            >
              {isMatchingPitch ? "Matching in progress…" : "Start Pitch Matching"}
            </button>

            {isMatchingPitch && (
              <div className="pitch-adjust-grid">
                <div className="current-pitch-display">
                  <span>Current test pitch:</span>
                  <strong>
                    {tinnitusPitchHz ? `${Math.round(tinnitusPitchHz)} Hz` : "—"}
                  </strong>
                </div>
                <div className="pitch-buttons">
                  <button
                    onClick={() => handlePitchDecrease(100)}
                    className="secondary-btn"
                  >
                    -100 Hz
                  </button>
                  <button
                    onClick={() => handlePitchDecrease(20)}
                    className="ghost-btn"
                  >
                    -20 Hz
                  </button>
                  <button
                    onClick={() => handlePitchIncrease(20)}
                    className="ghost-btn"
                  >
                    +20 Hz
                  </button>
                  <button
                    onClick={() => handlePitchIncrease(100)}
                    className="secondary-btn"
                  >
                    +100 Hz
                  </button>
                </div>
                <div className="pitch-actions">
                  <button onClick={saveMatchedPitch} className="primary-btn">
                    Save Matched Pitch
                  </button>
                  <button
                    onClick={() => {
                      setIsMatchingPitch(false);
                      stopPitchMatchingTone();
                    }}
                    className="ghost-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {tinnitusPitch && !isMatchingPitch && (
              <p className="saved-pitch-label">
                Saved tinnitus pitch: <strong>{Math.round(tinnitusPitch)} Hz</strong>
              </p>
            )}
          </div>
        </section>

        <section className="card sound-profile-section">
          <div className="section-header">
            <h2>Step 2 – Choose Your Sound Profile</h2>
            <p>
              Pick a background soundscape that feels good to you. You can
              change this anytime.
            </p>
          </div>
          <SoundLibraryMenu onSelectProfile={onSelectProfile} />
          <audio ref={whiteNoiseRef} />
        </section>

        <section className="card session-setup-section">
          <div className="section-header">
            <h2>Step 3 – Session Settings</h2>
            <p>
              Choose what kind of therapy you want to do today and for how long.
            </p>
          </div>

          <div className="session-grid">
            <div className="therapy-type-block">
              <h3>Therapy goal</h3>
              <div className="pill-row">
                {THERAPY_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTherapyType(t.key)}
                    className={`pill ${
                      therapyType === t.key ? "pill-selected" : ""
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="hint-text">
                {THERAPY_TYPES.find((t) => t.key === therapyType)?.description}
              </p>
            </div>

            <div className="session-length-block">
              <h3>Session length</h3>
              <div className="pill-row">
                {[15, 30, 45, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => handleSessionMinutesChange(m)}
                    className={`pill ${
                      sessionMinutes === m ? "pill-selected" : ""
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
              <p className="hint-text">
                You can start with 15–30 minutes and build up as it feels
                comfortable.
              </p>
            </div>

            <div className="therapy-mode-block">
              <h3>Therapy mode</h3>
              <div className="pill-row">
                {THERAPY_MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => startSession(m.key)}
                    disabled={!tinnitusPitch || !selectedProfile}
                    className={`pill ${
                      currentMode === m.key && status !== "idle"
                        ? "pill-selected"
                        : ""
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="hint-text">
                {currentMode
                  ? THERAPY_MODES.find((m) => m.key === currentMode)?.description
                  : "Standard, Relief / CR, or Sleep – choose what fits this session best."}
              </p>
            </div>
          </div>

          <div className="timer-display">
            <span className="timer-label">
              {status === "idle"
                ? "Ready"
                : status === "running"
                ? "Time remaining"
                : "Paused – remaining"}
            </span>
            <span className="timer-value">{formatTime(minutesLeft)}</span>
          </div>

          {renderSessionControls()}
        </section>

        <section className="card history-section">
          <div className="section-header">
            <h2>My past sessions</h2>
            <p>
              See how consistently you’re using NeuroQuiet. Regular, gentle
              sessions can help your brain learn to tune out tinnitus over time.
            </p>
          </div>
          {renderHistory()}
        </section>

        <section className="card safety-section">
          <h2>Safety & comfort tips</h2>
          <ul className="safety-list">
            <li>Always keep the volume at a comfortable level.</li>
            <li>
              If any sound feels irritating or makes your tinnitus worse, stop
              the session and adjust.
            </li>
            <li>
              NeuroQuiet is not a medical device and does not replace medical
              advice. Talk to your audiologist or ENT if you have concerns.
            </li>
            <li>
              If you experience dizziness, pain, or discomfort, stop using the
              app and consult a professional.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default TherapyPage;
