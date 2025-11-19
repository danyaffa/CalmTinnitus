// CalmTinnitus-main/app/therapy/page.tsx
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

const THERAPY_TYPES: {
  key: TherapyType;
  label: string;
  description: string;
}[] = [
  {
    key: "notch",
    label: "Notch training (near your tinnitus pitch)",
    description:
      "For people with tonal tinnitus. Uses your matched tinnitus pitch as a reference.",
  },
  {
    key: "masking",
    label: "Masking / sound enrichment",
    description:
      "Gentle background sound to help reduce the contrast with your tinnitus.",
  },
  {
    key: "combo",
    label: "Combination approach",
    description:
      "Blend of notch and masking concepts for a more complete training.",
  },
];

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
        "Coordinated Reset-style sequence of tones that may help desynchronize overactive neurons involved in tinnitus (experimental concept).",
    },
    {
      key: "sleep",
      label: "Sleep support",
      description:
        "Quieter, softer profile aimed at winding down and supporting sleep while masking tinnitus.",
    },
  ];

// Helper to format minutes to mm:ss
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

  // ---------- LOAD SAVED PROFILE / PITCH ON MOUNT ----------

  useEffect(() => {
    try {
      // Load full saved profile if present
      const storedProfile = window.localStorage.getItem("calmtinnitus_profile");
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile) as {
          therapyType?: TherapyType;
          sessionMinutes?: number;
          tinnitusPitch?: number | null;
          tinnitusPitchHz?: number | null;
          selectedProfile?: SoundProfile | null;
        };

        if (parsed.therapyType) {
          setTherapyType(parsed.therapyType);
        }
        if (typeof parsed.sessionMinutes === "number") {
          setSessionMinutes(parsed.sessionMinutes);
          setMinutesLeft(parsed.sessionMinutes);
        }
        if (typeof parsed.tinnitusPitch === "number") {
          setTinnitusPitch(parsed.tinnitusPitch);
        }
        if (typeof parsed.tinnitusPitchHz === "number") {
          setTinnitusPitchHz(parsed.tinnitusPitchHz);
        } else if (typeof parsed.tinnitusPitch === "number") {
          setTinnitusPitchHz(parsed.tinnitusPitch);
        }
        if (parsed.selectedProfile) {
          setSelectedProfile(parsed.selectedProfile);
          if (
            parsed.selectedProfile.baseNoise &&
            whiteNoiseRef.current
          ) {
            whiteNoiseRef.current.src = parsed.selectedProfile.baseNoise;
          }
        }
      }

      // Backwards-compatible: if user only has a saved pitch, load it
      const storedPitch = window.localStorage.getItem(
        "calmtinnitus_matchedPitch"
      );
      if (storedPitch) {
        const { hz } = JSON.parse(storedPitch) as { hz?: number };
        if (typeof hz === "number") {
          setTinnitusPitch(hz);
          setTinnitusPitchHz(hz);
        }
      }
    } catch {
      // Safe to ignore – user will simply start fresh
    }
  }, []);

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
    stopWhiteNoise();
    stopAllOscillators();
    stopCRTherapy();

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    setStatus("idle");
    setCurrentMode(null);
    setMinutesLeft(null);

    // Reset media session
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

    // Create new oscillator for pitch matching
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = tinnitusPitchHz || 8000; // default high pitch if not set yet
    gain.gain.value = 0.1;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();

    toneOscRef.current = osc;
    toneGainRef.current = gain;

    setIsMatchingPitch(true);
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

    // Persist matched pitch so the user doesn't need to rematch every time
    try {
      window.localStorage.setItem(
        "calmtinnitus_matchedPitch",
        JSON.stringify({ hz: tinnitusPitchHz })
      );
    } catch {
      // Non-critical if persistence fails
    }
  };

  // ---------- COORDINATED RESET (CR) THERAPY ----------

  const startCRTherapy = (baseFrequency: number) => {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    stopAllOscillators();

    const crFrequencies = [0.9, 1.0, 1.1, 1.2].map(
      (multiplier) => baseFrequency * multiplier
    );

    const gains: GainNode[] = [];
    const oscillators: OscillatorNode[] = [];

    crFrequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0;

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      oscillators.push(osc);
      gains.push(gain);
    });

    crOscillatorsRef.current = oscillators;
    crGainsRef.current = gains;

    const patternInterval = 200;
    let currentIndex = 0;

    gains.forEach((g) => (g.gain.value = 0));

    const intervalId = setInterval(() => {
      gains.forEach((g, i) => {
        g.gain.value = i === currentIndex ? 0.08 : 0;
      });
      currentIndex = (currentIndex + 1) % gains.length;
    }, patternInterval);

    (crOscillatorsRef as any).currentIntervalId = intervalId;
  };

  // ---------- PERSIST USER PROFILE (pitch, sound, settings) ----------

  useEffect(() => {
    try {
      const profile = {
        therapyType,
        sessionMinutes,
        tinnitusPitch,
        tinnitusPitchHz,
        selectedProfile,
      };
      window.localStorage.setItem(
        "calmtinnitus_profile",
        JSON.stringify(profile)
      );
    } catch {
      // Non-critical if persistence fails
    }
  }, [therapyType, sessionMinutes, tinnitusPitch, tinnitusPitchHz, selectedProfile]);

  // ---------- SESSION LOGGING ----------

  const saveSession = () => {
    const baseLog: Omit<SessionLog, "id"> = {
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
    } catch (err) {
      console.error("Failed to save session locally", err);
    }

    if (user) {
      saveSessionToCloud(baseLog).catch((err) =>
        console.error("Failed to save session to cloud", err)
      );
    }
  };

  // ---------- SESSION CONTROL ----------

  const startSession = (mode: TherapyMode) => {
    if (!tinnitusPitch) {
      alert("Please match and save your tinnitus pitch first.");
      return;
    }

    alert(
      "🎉 Congratulations! You've taken the first step toward controlling your tinnitus.\n\n" +
        "1. Assess your Tinnitus Pitch – you’ve already done this.\n" +
        "2. Select Therapy Type – choose Standard, Relief, or Sleep.\n" +
        "3. Start Therapy Session – listen at a comfortable volume.\n" +
        "4. Measure your progress over time.\n\n" +
        "Relax, you are on your way to control of Tinnitus."
    );

    stopEverything();

    setCurrentMode(mode);

    const whiteNoiseEl = whiteNoiseRef.current;
    if (whiteNoiseEl) {
      playWhiteNoise(whiteNoiseEl);
    }

    if (mode === "standard" || mode === "sleep") {
      startPitchMatchingTone();
    } else if (mode === "relief") {
      if (!tinnitusPitch) {
        alert(
          "Please match your tinnitus pitch before starting Relief / CR therapy."
        );
        return;
      }
      startCRTherapy(tinnitusPitch);
    }

    setStatus("running");
    setMinutesLeft(sessionMinutes);

    const start = Date.now();
    const totalMs = sessionMinutes * 60 * 1000;

    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    sessionTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remainingMs = Math.max(0, totalMs - elapsed);
      const remainingMinutes = remainingMs / 60000;
      setMinutesLeft(remainingMinutes);
      if (remainingMinutes <= 0) {
        clearInterval(sessionTimerRef.current!);
        sessionTimerRef.current = null;
        stopEverything();
        saveSession();
        alert("Session complete. Well done for sticking with it!");
      }
    }, 1000);

    const title =
      mode === "relief"
        ? "CalmTinnitus – Relief / CR Therapy"
        : mode === "sleep"
        ? "CalmTinnitus – Sleep Support Session"
        : "CalmTinnitus – Standard Sound Therapy";

    setMediaSessionOptions({
      title,
      artist: "CalmTinnitus",
      album: "Tinnitus Relief Session",
      onPlay: () => {
        if (status === "paused") {
          resumeSession();
        } else if (status === "idle") {
          startSession(mode);
        }
      },
      onPause: () => pauseSession(),
      onStop: () => stopEverything(),
    });
  };

  const pauseSession = () => {
    if (status !== "running") return;

    stopWhiteNoise();
    stopPitchMatchingTone();
    stopCRTherapy();

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    setStatus("paused");

    setMediaSessionOptions((prev) => ({
      ...(prev || {}),
      onPlay: () => resumeSession(),
      onPause: () => pauseSession(),
      onStop: () => stopEverything(),
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

    const start = Date.now();
    const totalMs = minutesLeft * 60 * 1000;
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    sessionTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remainingMs = Math.max(0, totalMs - elapsed);
      const remainingMinutes = remainingMs / 60000;
      setMinutesLeft(remainingMinutes);
      if (remainingMinutes <= 0) {
        clearInterval(sessionTimerRef.current!);
        sessionTimerRef.current = null;
        stopEverything();
        saveSession();
        alert("Session complete. Well done for sticking with it!");
      }
    }, 1000);
  };

  const handleSessionMinutesChange = (minutes: number) => {
    setSessionMinutes(minutes);
    if (status === "running" || status === "paused") {
      setMinutesLeft(minutes);
    }
  };

  const onSelectProfile = (profile: SoundProfile | null) => {
    setSelectedProfile(profile);

    if (profile && profile.baseNoise && whiteNoiseRef.current) {
      // Update the background sound source
      const audioEl = whiteNoiseRef.current;
      const shouldRestart = status === "running";

      audioEl.src = profile.baseNoise;

      // If a session is currently running, immediately switch to the new sound
      if (shouldRestart) {
        playWhiteNoise(audioEl);
      }
    }

    // Persist the chosen sound profile so it can be restored next time
    try {
      window.localStorage.setItem(
        "calmtinnitus_selectedProfile",
        JSON.stringify(profile)
      );
    } catch {
      // Non-critical if persistence fails
    }
  };

  const renderSessionControls = () => {
    if (!currentMode || status === "idle") {
      return (
        <div className="session-controls">
          <button
            onClick={() => startSession("standard")}
            className="primary-btn"
            disabled={!tinnitusPitch || !selectedProfile}
          >
            Start Standard Session
          </button>
          <button
            onClick={() => startSession("relief")}
            className="secondary-btn"
            disabled={!tinnitusPitch || !selectedProfile}
          >
            Start Relief / CR Session
          </button>
          <button
            onClick={() => startSession("sleep")}
            className="secondary-btn"
            disabled={!tinnitusPitch || !selectedProfile}
          >
            Start Sleep Support Session
          </button>
        </div>
      );
    }

    if (status === "running") {
      return (
        <div className="session-controls">
          <button onClick={pauseSession} className="secondary-btn">
            Pause Session
          </button>
          <button onClick={stopEverything} className="ghost-btn">
            Stop Session
          </button>
        </div>
      );
    }

    if (status === "paused") {
      return (
        <div className="session-controls">
          <button onClick={resumeSession} className="primary-btn">
            Resume Session
          </button>
          <button onClick={stopEverything} className="ghost-btn">
            Stop Session
          </button>
        </div>
      );
    }

    return null;
  };

  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, [stopEverything]);

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

  const handleGoogleSignIn = async () => {
    try {
      await firebaseGoogleSignIn();
    } catch (err) {
      console.error("Sign in error: ", err);
      alert("Failed to sign in. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
    } catch (err) {
      console.error("Sign out error: ", err);
      alert("Failed to sign out. Please try again.");
    }
  };

  return (
    <div className="therapy-page">
      <header className="therapy-header">
        <div className="header-left">
          <Image
            src="/CalmTinnitus-Logo.png"
            alt="CalmTinnitus Logo"
            width={160}
            height={40}
            priority
            className="header-logo"
          />
          <div className="header-text">
            <h1>Guided Sound Therapy for Tinnitus</h1>
            <p>
              CalmTinnitus combines personalized soundscapes with{" "}
              <strong>pitch-matched training</strong> to support tinnitus
              habituation and relief.
            </p>
          </div>
        </div>
        <div className="header-right">
          {user ? (
            <div className="user-box">
              <span className="user-email">
                Signed in as <strong>{user.email}</strong>
              </span>
              <button onClick={handleSignOut} className="ghost-btn">
                Sign out
              </button>
            </div>
          ) : (
            <div className="user-box">
              <span className="user-email">
                Sign in to save your sessions across devices.
              </span>
              <button onClick={handleGoogleSignIn} className="secondary-btn">
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="therapy-main">
        <section className="card pitch-section">
          <div className="section-header">
            <h2>Step 1 – Match Your Tinnitus Pitch (once, then it’s saved)</h2>
            <p>
              Find the tone that most closely matches your tinnitus sound. Once
              you save it, CalmTinnitus remembers it for next time.
            </p>
          </div>

          <div className="pitch-grid">
            <div className="pitch-controls">
              <div className="pitch-display">
                <span className="label">Live tone:</span>
                <span className="value">
                  {tinnitusPitchHz ? `${Math.round(tinnitusPitchHz)} Hz` : "--"}
                </span>
              </div>
              <div className="pitch-display">
                <span className="label">Saved pitch:</span>
                <span className="value">
                  {tinnitusPitch
                    ? `${Math.round(tinnitusPitch)} Hz`
                    : "Not saved yet"}
                </span>
              </div>

              <div className="pitch-buttons">
                <button
                  onClick={() =>
                    tinnitusPitchHz
                      ? handlePitchDecrease(100)
                      : setTinnitusPitchHz(8000)
                  }
                  className="secondary-btn"
                >
                  -100 Hz
                </button>
                <button
                  onClick={() =>
                    tinnitusPitchHz
                      ? handlePitchIncrease(100)
                      : setTinnitusPitchHz(8000)
                  }
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
                  Stop Test Tone
                </button>
              </div>

              <div className="pitch-hint">
                <p>
                  Tip: Start high, then adjust down slowly until the tone feels
                  similar to your tinnitus. It doesn’t need to be perfect.
                </p>
              </div>
            </div>

            <div className="pitch-visual">
              <div className="ear-diagram">
                <Image
                  src="/woman.png"
                  alt="Calm person listening to sound therapy"
                  width={300}
                  height={300}
                  className="ear-image"
                />
              </div>
            </div>
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
          <SoundLibraryMenu
            onSelectProfile={onSelectProfile}
            currentProfileId={selectedProfile?.id}
          />
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
                    {m} minutes
                  </button>
                ))}
              </div>
              <p className="hint-text">
                You can always stop earlier if you feel done.
              </p>
            </div>

            <div className="session-status-block">
              <h3>Session status</h3>
              <div className="status-row">
                <span className="label">Time left:</span>
                <span className="value">{formatTime(minutesLeft)}</span>
              </div>
              <div className="status-row">
                <span className="label">Mode:</span>
                <span className="value">
                  {currentMode
                    ? THERAPY_MODES.find((m) => m.key === currentMode)?.label
                    : "Not started"}
                </span>
              </div>
              <div className="status-row">
                <span className="label">State:</span>
                <span className="value">
                  {status === "idle"
                    ? "Idle"
                    : status === "running"
                    ? "Running"
                    : "Paused"}
                </span>
              </div>
            </div>
          </div>

          <div className="session-controls-wrapper">
            {renderSessionControls()}
          </div>
        </section>

        <section className="card session-history-section">
          <div className="section-header">
            <h2>Your recent sessions</h2>
            <p>Track your consistency over time.</p>
          </div>

          {loading && <p>Loading session history...</p>}
          {!loading && sessionHistory.length === 0 && (
            <p>You don&apos;t have any logged sessions yet.</p>
          )}
          {!loading && sessionHistory.length > 0 && (
            <ul className="history-list">
              {sessionHistory.slice(0, 10).map((s) => (
                <li key={s.id} className="history-item">
                  <div className="history-row">
                    <span className="label">Date</span>
                    <span className="value">
                      {new Date(s.date).toLocaleString()}
                    </span>
                  </div>
                  <div className="history-row">
                    <span className="label">Mode</span>
                    <span className="value">
                      {
                        THERAPY_MODES.find((m) => m.key === s.mode)?.label ??
                        s.mode
                      }
                    </span>
                  </div>
                  <div className="history-row">
                    <span className="label">Therapy type</span>
                    <span className="value">
                      {
                        THERAPY_TYPES.find((t) => t.key === s.therapyType)
                          ?.label
                      }
                    </span>
                  </div>
                  <div className="history-row">
                    <span className="label">Duration</span>
                    <span className="value">{s.duration} min</span>
                  </div>
                  <div className="history-row">
                    <span className="label">Pitch</span>
                    <span className="value">{Math.round(s.tinnitusPitch)} Hz</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card safety-section">
          <div className="section-header">
            <h2>Safety & notes</h2>
            <p>Please always listen at a comfortable volume.</p>
          </div>
          <ul className="safety-list">
            <li>Always keep the volume at a comfortable level.</li>
            <li>
              If any sound feels irritating or makes your tinnitus worse, stop
              the session and adjust.
            </li>
            <li>
              CalmTinnitus is not a medical device and does not replace medical
              advice. Talk to your audiologist or ENT if you have concerns.
            </li>
            <li>
              If you experience dizziness, pain, or discomfort, stop using the
              app and consult a professional.
            </li>
          </ul>
        </section>
      </main>

      <footer className="therapy-footer">
        <div className="therapy-footer-links">
          <a href="/about">About</a>
          <a href="/info">How It Works</a>
          <a href="/legal">Legal</a>
          <a href="/disclaimers">Disclaimers</a>
          <a href="/company-policy">Company Policy</a>
        </div>
        <div className="therapy-footer-note">
          This app is a self-help sound tool and does not provide medical
          diagnosis, treatment, or emergency care. For sudden changes in
          hearing, severe distress, or medical concerns, please seek urgent
          professional help.
        </div>
      </footer>
    </div>
  );
};

export default TherapyPage;
