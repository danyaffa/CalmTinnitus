"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// --- TYPES ---
type TherapyMode = "standard" | "relief" | "sleep";
type SessionStatus = "idle" | "running" | "paused";
type SetupStep = "welcome" | "pitch" | "sound" | "ready";

type SoundProfile = {
  id: string;
  label: string;
  description: string;
  type: "noise" | "nature" | "external";
  color?: string;
  icon?: string;
  defaultLink?: string; // NEW: Auto-loads a playlist so player appears instantly
};

// --- CONSTANTS ---
const SOUND_PROFILES: SoundProfile[] = [
  { 
    id: "spotify", 
    label: "Spotify", 
    description: "Embed your playlists", 
    type: "external", 
    color: "#1DB954", 
    icon: "🟢",
    // Default: A popular Tinnitus Relief playlist to ensure player loads immediately
    defaultLink: "https://open.spotify.com/playlist/37i9dQZF1DX5uO7oxiC9Vl" 
  },
  { 
    id: "apple", 
    label: "Apple Music", 
    description: "Stream albums & stations", 
    type: "external", 
    color: "#FA243C", 
    icon: "🍎",
    // Default: Apple Music Chill Mix
    defaultLink: "https://music.apple.com/us/playlist/pure-ambient/pl.a8e2cb15695c4ca79e6fb2c782373db6"
  },
  { 
    id: "youtube", 
    label: "YouTube", 
    description: "Video & Music integration", 
    type: "external", 
    color: "#FF0000", 
    icon: "▶️",
    // Default: Tinnitus Sound Therapy Video
    defaultLink: "https://www.youtube.com/watch?v=AGuKfQ23oXI"
  },
  { 
    id: "amazon", 
    label: "Amazon Music", 
    description: "Play via external tab", 
    type: "external", 
    color: "#00A8E1", 
    icon: "🛒",
    defaultLink: "https://music.amazon.com/stations/Is3k73"
  },
  { id: "pink", label: "Pink Noise", description: "Soft, gentle sound", type: "noise" },
  { id: "white", label: "White Noise", description: "Classic masking sound", type: "noise" },
  { id: "brown", label: "Brown Noise", description: "Deep, rumbling sound", type: "noise" },
  { id: "rain", label: "Rain", description: "Gentle rainfall", type: "nature" },
  { id: "ocean", label: "Ocean Waves", description: "Rolling surf", type: "nature" },
];

const THERAPY_MODES = [
  { key: "standard" as TherapyMode, label: "Standard Therapy", description: "Gentle background sound with your matched tone.", icon: "🎧" },
  { key: "relief" as TherapyMode, label: "Relief (CR) Therapy", description: "Neuromodulation pulses to desynchronize tinnitus.", icon: "✨" },
  { key: "sleep" as TherapyMode, label: "Sleep Support", description: "Quieter profile to help you wind down.", icon: "🌙" },
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

  const initAudio = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const setMasterVolume = (vol: number) => {
    if (masterGainRef.current) {
        masterGainRef.current.gain.setTargetAtTime(vol, ctxRef.current?.currentTime || 0, 0.1);
    }
  };

  const generateNoiseBuffer = (ctx: AudioContext, type: string) => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    if (type === "white") {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === "pink") {
      let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
      for (let i=0; i<bufferSize; i++) {
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
    const now = ctxRef.current?.currentTime || 0;
    if (noiseGainRef.current) noiseGainRef.current.gain.setTargetAtTime(0, now, 0.05);
    if (toneGainRef.current) toneGainRef.current.gain.setTargetAtTime(0, now, 0.05);
    crGainsRef.current.forEach(g => g.gain.setTargetAtTime(0, now, 0.05));

    setTimeout(() => {
      if (noiseNodeRef.current) { noiseNodeRef.current.stop(); noiseNodeRef.current.disconnect(); }
      if (toneOscRef.current) { toneOscRef.current.stop(); toneOscRef.current.disconnect(); }
      crOscillatorsRef.current.forEach(o => { o.stop(); o.disconnect(); });
      noiseNodeRef.current = null;
      toneOscRef.current = null;
      crOscillatorsRef.current = [];
      if (crIntervalRef.current) clearInterval(crIntervalRef.current);
    }, 200);
  }, []);

  const playNoise = useCallback((type: string, volume: number) => {
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
  }, [initAudio]);

  const playTone = useCallback((freq: number, volume: number) => {
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
  }, [initAudio]);

  const playCR = useCallback((baseFreq: number, volume: number) => {
    const ctx = initAudio();
    stopAll(); 

    const freqs = [0.9, 1.0, 1.1, 1.2].map(m => baseFreq * m);
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    freqs.forEach(f => {
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
      const now = ctx.currentTime;
      gains.forEach((g, i) => {
        const target = i === idx ? volume : 0;
        g.gain.setTargetAtTime(target, now, 0.02); 
      });
      idx = (idx + 1) % gains.length;
    }, 250); 
  }, [initAudio, stopAll]);

  const updateVolumes = (noiseVol: number, toneVol: number) => {
    const now = ctxRef.current?.currentTime || 0;
    if (noiseGainRef.current) noiseGainRef.current.gain.setTargetAtTime(noiseVol, now, 0.1);
    if (toneGainRef.current) toneGainRef.current.gain.setTargetAtTime(toneVol, now, 0.1);
  };

  return { initAudio, playNoise, playTone, playCR, stopAll, setMasterVolume, updateVolumes, ctxRef };
}


// --- 🎨 COMPONENT ---
export default function TherapyPage() {
  // State
  const [setupStep, setSetupStep] = useState<SetupStep>("welcome");
  const [tinnitusPitch, setTinnitusPitch] = useState<number | null>(null);
  const [currentPitch, setCurrentPitch] = useState<number>(8000);
  const [selectedSound, setSelectedSound] = useState<SoundProfile>(SOUND_PROFILES[4]); 
  const [externalLink, setExternalLink] = useState("");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [selectedMode, setSelectedMode] = useState<TherapyMode>("standard");
  const [sessionDuration, setSessionDuration] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // Volumes
  const [masterVol, setMasterVol] = useState(0.5);
  const [noiseVol, setNoiseVol] = useState(0.3);
  const [toneVol, setToneVol] = useState(0.1);

  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hook
  const audio = useTinnitusAudio();

  // --- Effects ---
  useEffect(() => { audio.setMasterVolume(masterVol); }, [masterVol, audio]);

  useEffect(() => {
    if (sessionStatus === 'running') audio.updateVolumes(noiseVol, toneVol);
  }, [noiseVol, toneVol, sessionStatus, audio]);

  useEffect(() => {
    const saved = localStorage.getItem("calmtinnitus_settings");
    if (saved) {
      const s = JSON.parse(saved);
      if (s.pitch) { setTinnitusPitch(s.pitch); setCurrentPitch(s.pitch); setSetupStep("ready"); }
      // Removed the persistence for "selectedSound" here so you aren't stuck on Spotify on reload
      // if (s.sound) { const p = SOUND_PROFILES.find(p => p.id === s.sound); if(p) setSelectedSound(p); }
    }
  }, []);

  useEffect(() => {
    if(tinnitusPitch) {
        localStorage.setItem("calmtinnitus_settings", JSON.stringify({ pitch: tinnitusPitch }));
    }
  }, [tinnitusPitch]);

  // When provider changes, auto-fill the default link if empty
  useEffect(() => {
    if (selectedSound.type === 'external' && selectedSound.defaultLink) {
        setExternalLink(selectedSound.defaultLink);
    } else {
        setExternalLink("");
    }
  }, [selectedSound]);

  // --- Handlers ---
  const toggleTestTone = () => {
    if (isPlayingTest) {
      audio.stopAll();
      setIsPlayingTest(false);
    } else {
      audio.initAudio();
      audio.playTone(currentPitch, 0.1);
      setIsPlayingTest(true);
    }
  };

  useEffect(() => {
    if (isPlayingTest) audio.playTone(currentPitch, 0.1);
  }, [currentPitch]);

  const startSession = () => {
    if (!tinnitusPitch) return;
    audio.initAudio(); 
    if (selectedSound.type !== 'external') {
      audio.playNoise(selectedSound.id, noiseVol);
    }
    if (selectedMode === 'relief') {
      audio.playCR(tinnitusPitch, toneVol);
    } else {
      audio.playTone(tinnitusPitch, toneVol);
    }
    setSessionStatus("running");
    setTimeRemaining(sessionDuration);
    const end = Date.now() + sessionDuration * 60000;
    sessionTimerRef.current = setInterval(() => {
      const left = (end - Date.now()) / 60000;
      if (left <= 0) stopSession();
      else setTimeRemaining(left);
    }, 1000);
  };

  const stopSession = () => {
    audio.stopAll();
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    setSessionStatus("idle");
    setTimeRemaining(null);
  };

  const formatTime = (m: number | null) => {
    if (!m) return "--:--";
    const min = Math.floor(m);
    const sec = Math.round((m - min) * 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const getEmbedUrl = (type: string, url: string) => {
    if (!url) return null;
    if (type === 'spotify') {
      if (url.includes("/embed/")) return url;
      const m = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
      return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0` : null;
    }
    if (type === 'apple') {
        if (url.includes("embed.music.apple.com")) return url;
        return url.replace("music.apple.com", "embed.music.apple.com");
    }
    if (type === 'youtube') {
      const v = url.match(/[?&]v=([^&]+)/)?.[1] || url.match(/youtu\.be\/([^?]+)/)?.[1];
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    return null;
  };

  // --- SETUP VIEW ---
  if (setupStep !== "ready") {
    return (
      <main className="nq-container">
        <div className="nq-card nq-setup-card">
          {setupStep === "welcome" && (
            <div className="nq-step">
              <h1>Welcome to CalmTinnitus</h1>
              <p>Let's calibrate your therapy in 3 steps.</p>
              <button onClick={() => setSetupStep("pitch")} className="nq-btn-primary">Get Started</button>
            </div>
          )}

          {setupStep === "pitch" && (
            <div className="nq-step">
              <h2>Step 1: Match Pitch</h2>
              <p>Adjust until the tone matches your tinnitus.</p>
              <div className="nq-pitch-control">
                <button onClick={toggleTestTone} className={`nq-btn-icon ${isPlayingTest ? 'active' : ''}`}>
                  {isPlayingTest ? '⏹ Stop' : '▶ Play Tone'}
                </button>
                <span className="nq-value">{Math.round(currentPitch)} Hz</span>
              </div>
              <input 
                type="range" min="200" max="12000" step="50" 
                value={currentPitch} onChange={e => setCurrentPitch(Number(e.target.value))}
                className="nq-slider"
              />
              <div className="nq-actions">
                <button onClick={() => { audio.stopAll(); setSetupStep("welcome"); }} className="nq-btn-ghost">Back</button>
                <button onClick={() => { 
                  setTinnitusPitch(currentPitch); 
                  audio.stopAll(); 
                  setIsPlayingTest(false);
                  setSetupStep("sound"); 
                }} className="nq-btn-primary">Next</button>
              </div>
            </div>
          )}

          {setupStep === "sound" && (
            <div className="nq-step">
              <h2>Step 2: Soundscape</h2>
              <div className="nq-grid">
                {SOUND_PROFILES.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setSelectedSound(s)}
                    className={`nq-sound-btn ${selectedSound.id === s.id ? 'selected' : ''}`}
                    style={selectedSound.id === s.id && s.color ? { borderColor: s.color, background: `${s.color}15` } : {}}
                  >
                    <strong>{s.label}</strong>
                    <small>{s.description}</small>
                  </button>
                ))}
              </div>
              <div className="nq-actions">
                <button onClick={() => setSetupStep("pitch")} className="nq-btn-ghost">Back</button>
                <button onClick={() => { setSetupStep("ready"); }} className="nq-btn-primary">Finish</button>
              </div>
            </div>
          )}
        </div>
        <Style />
      </main>
    );
  }

  // --- MAIN VIEW ---
  return (
    <main className="nq-container">
      {/* Header */}
      <header className="nq-header">
        <div>
          <h1 className="nq-brand">CalmTinnitus</h1>
          <span className="nq-subtitle">Session Config</span>
        </div>
        <div className="nq-master-vol">
          <span>🔊 Master</span>
          <input 
            type="range" min="0" max="1" step="0.05" 
            value={masterVol} onChange={e => setMasterVol(Number(e.target.value))} 
          />
        </div>
      </header>

      {/* Status Banner */}
      {sessionStatus !== 'idle' && (
        <div className="nq-banner">
          <div className="nq-timer">{formatTime(timeRemaining)}</div>
          <div className="nq-status-text">
             {THERAPY_MODES.find(m => m.key === selectedMode)?.label} is Active
          </div>
          <button onClick={stopSession} className="nq-btn-stop">⏹ Stop Session</button>
        </div>
      )}

      {/* 🎵 EXTERNAL PLAYER CARD (FIXED) */}
      {selectedSound.type === 'external' && (
        <div className="nq-embed-card" style={{borderColor: selectedSound.color || '#333'}}>
          
          {/* Provider Toolbar */}
          <div className="nq-provider-toolbar">
             {SOUND_PROFILES.filter(p => p.type === 'external').map(p => (
                 <button 
                    key={p.id} 
                    onClick={() => setSelectedSound(p)}
                    className={`nq-provider-btn ${selectedSound.id === p.id ? 'active' : ''}`}
                    style={selectedSound.id === p.id ? {background: p.color} : {}}
                    title={`Switch to ${p.label}`}
                 >
                    {p.icon}
                 </button>
             ))}
          </div>

          <div className="nq-embed-header">
            <span className="nq-badge" style={{background: selectedSound.color}}>{selectedSound.label}</span>
            <input 
              placeholder={`Paste full ${selectedSound.label} URL...`}
              value={externalLink}
              onChange={e => setExternalLink(e.target.value)}
              className="nq-input-dark"
            />
            {selectedSound.id === 'amazon' && externalLink && (
                <a href={externalLink} target="_blank" className="nq-btn-small">Open ↗</a>
            )}
          </div>
          
          {getEmbedUrl(selectedSound.id, externalLink) ? (
            <iframe 
              src={getEmbedUrl(selectedSound.id, externalLink)!} 
              className="nq-iframe" 
              allow="encrypted-media; autoplay; clipboard-write; picture-in-picture"
            />
          ) : selectedSound.id !== 'amazon' && (
            <div className="nq-empty-embed">
                <p>Paste a valid link above to load player.</p>
            </div>
          )}
        </div>
      )}

      <div className="nq-controls-grid">
        {/* Modes */}
        <div className="nq-panel">
          <h3>Therapy Mode</h3>
          <div className="nq-list">
            {THERAPY_MODES.map(m => (
              <button 
                key={m.key}
                onClick={() => setSelectedMode(m.key)}
                disabled={sessionStatus !== 'idle'}
                className={`nq-list-item ${selectedMode === m.key ? 'active' : ''}`}
              >
                <span className="nq-icon">{m.icon}</span>
                <div>
                  <strong>{m.label}</strong>
                  <p>{m.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="nq-panel">
          <h3>Mixer & Duration</h3>
          
          {/* SOUND SELECTOR (ALWAYS VISIBLE) */}
          <div className="nq-slider-group">
             <label>Background Sound</label>
             <select 
                className="nq-select"
                value={selectedSound.id}
                onChange={(e) => {
                    const s = SOUND_PROFILES.find(p => p.id === e.target.value);
                    if(s) setSelectedSound(s);
                }}
             >
                <optgroup label="Music Apps">
                    {SOUND_PROFILES.filter(p => p.type === 'external').map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                </optgroup>
                <optgroup label="Noise & Nature">
                    {SOUND_PROFILES.filter(p => p.type !== 'external').map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                </optgroup>
             </select>
          </div>

          {selectedSound.type !== 'external' && (
             <div className="nq-slider-group">
               <label>Background Volume</label>
               <input 
                 type="range" min="0" max="0.8" step="0.05" 
                 value={noiseVol} onChange={e => setNoiseVol(Number(e.target.value))} 
               />
             </div>
          )}
          
          <div className="nq-slider-group">
            <label>Therapy Tone ({Math.round(tinnitusPitch || 0)}Hz)</label>
            <input 
              type="range" min="0" max="0.5" step="0.01" 
              value={toneVol} onChange={e => setToneVol(Number(e.target.value))} 
            />
          </div>

          <div className="nq-duration-group">
             {[15, 30, 45, 60].map(t => (
               <button 
                 key={t} 
                 onClick={() => setSessionDuration(t)}
                 disabled={sessionStatus !== 'idle'}
                 className={`nq-chip ${sessionDuration === t ? 'active' : ''}`}
               >
                 {t}m
               </button>
             ))}
          </div>
        </div>
      </div>

      {sessionStatus === 'idle' && (
         <button onClick={startSession} disabled={!tinnitusPitch} className="nq-btn-big">
            ▶ Start Session
         </button>
      )}
      
      <div className="nq-footer">
         <p>Medical Disclaimer: This is a wellness tool. Consult a doctor for hearing health issues.</p>
         <button onClick={() => {localStorage.removeItem("calmtinnitus_settings"); window.location.reload();}} style={{marginTop:'1rem', fontSize:'0.75rem', background:'none', border:'none', color:'red', cursor:'pointer'}}>Reset App Data</button>
      </div>

      <Style />
    </main>
  );
}

// --- 💅 CSS-IN-JS ---
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
      .nq-container { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, sans-serif; color: var(--text); }
      
      /* Header */
      .nq-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
      .nq-brand { margin: 0; font-size: 1.5rem; }
      .nq-subtitle { font-size: 0.9rem; color: var(--text-dim); }
      .nq-master-vol { background: white; padding: 0.5rem 1rem; border-radius: 99px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; }

      /* Setup & Grid */
      .nq-setup-card { max-width: 500px; margin: 4rem auto; text-align: center; }
      .nq-step h2 { margin-top: 0; }
      .nq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 1.5rem 0; }
      .nq-sound-btn { border: 1px solid #e2e8f0; background: white; padding: 1rem; border-radius: 0.75rem; text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 0.25rem; }
      .nq-sound-btn.selected { border-color: var(--primary); background: #f0f9ff; }

      /* Banner */
      .nq-banner { background: linear-gradient(135deg, var(--primary), var(--success)); color: white; padding: 1.5rem; border-radius: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-bottom: 2rem; }
      .nq-timer { font-size: 2.5rem; font-weight: 800; line-height: 1; }
      .nq-btn-stop { background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.5rem 1.25rem; border-radius: 99px; cursor: pointer; font-weight: 600; margin-top: 0.5rem; }

      /* Embed Card & Toolbar */
      .nq-embed-card { background: #0f172a; color: white; border-radius: 1rem; padding: 1.5rem; margin-bottom: 2rem; border-left: 4px solid; transition: 0.3s; }
      .nq-provider-toolbar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
      .nq-provider-btn { background: rgba(255,255,255,0.1); border: none; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; font-size: 1.4rem; display: flex; align-items: center; justifyContent: center; transition: 0.2s; }
      .nq-provider-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }
      .nq-provider-btn.active { transform: scale(1.1); box-shadow: 0 0 15px rgba(255,255,255,0.3); background: rgba(255,255,255,0.2); border: 2px solid white; }
      
      .nq-embed-header { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
      .nq-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display:flex; align-items:center;}
      .nq-input-dark { flex: 1; background: #1e293b; border: 1px solid #334155; color: white; padding: 0.5rem; border-radius: 0.5rem; }
      .nq-iframe { width: 100%; height: 152px; border: none; border-radius: 12px; }
      .nq-empty-embed { text-align: center; padding: 2rem; color: #475569; background: #1e293b; border-radius: 12px; }
      .nq-btn-small { background: white; color: #0f172a; text-decoration: none; padding: 0 1rem; border-radius: 0.5rem; font-weight: 600; display: flex; alignItems: center; }

      /* Panels */
      .nq-controls-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
      @media (max-width: 768px) { .nq-controls-grid { grid-template-columns: 1fr; } }
      .nq-panel { background: white; padding: 1.5rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
      .nq-panel h3 { margin: 0 0 1rem 0; font-size: 1.1rem; }
      
      .nq-list { display: grid; gap: 0.5rem; }
      .nq-list-item { display: flex; align-items: center; gap: 1rem; text-align: left; width: 100%; background: white; border: 1px solid #e2e8f0; padding: 0.75rem; border-radius: 0.75rem; cursor: pointer; }
      .nq-list-item.active { border-color: var(--primary); background: #f0f9ff; }
      
      .nq-slider-group { margin-bottom: 1rem; }
      .nq-slider-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; }
      input[type=range] { width: 100%; accent-color: var(--primary); }
      .nq-select { width: 100%; padding: 0.6rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; font-size: 1rem; }

      .nq-duration-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .nq-chip { flex: 1; border: 1px solid #e2e8f0; background: white; padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; }
      .nq-chip.active { background: var(--primary); color: white; border-color: var(--primary); }

      .nq-btn-big { width: 100%; background: var(--primary); color: white; border: none; padding: 1.2rem; border-radius: 1rem; font-size: 1.2rem; font-weight: 700; cursor: pointer; box-shadow: 0 10px 20px rgba(14, 165, 233, 0.2); }
      .nq-footer { text-align: center; margin-top: 3rem; font-size: 0.8rem; color: var(--text-dim); }
      
      /* Utilities */
      .nq-btn-primary { background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 99px; cursor: pointer; font-weight: 600; }
      .nq-btn-ghost { background: transparent; color: var(--text-dim); border: none; padding: 0.75rem 1.5rem; cursor: pointer; }
      .nq-pitch-control { display: flex; align-items: center; margin-bottom: 1rem; }
      .nq-btn-icon { background: #e2e8f0; border: none; padding: 0.5rem 1rem; border-radius: 99px; cursor: pointer; font-weight: 600; color: var(--text); margin-right: 1rem; }
      .nq-btn-icon.active { background: #ef4444; color: white; }
      .nq-value { font-weight: 700; color: var(--primary); margin-left: auto; }
    `}</style>
  );
}
