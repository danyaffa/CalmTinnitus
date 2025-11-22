// app/therapy/page.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, Check, ChevronRight, Info } from 'lucide-react';

// Types
type TherapyMode = 'standard' | 'relief' | 'sleep';
type SessionStatus = 'idle' | 'running' | 'paused';
type SetupStep = 'welcome' | 'pitch' | 'sound' | 'ready';

type SoundProfile = {
  id: string;
  label: string;
  description: string;
  type: 'noise' | 'nature';
};

const SOUND_PROFILES: SoundProfile[] = [
  { id: 'pink', label: 'Pink Noise', description: 'Soft, gentle sound', type: 'noise' },
  { id: 'white', label: 'White Noise', description: 'Classic masking sound', type: 'noise' },
  { id: 'brown', label: 'Brown Noise', description: 'Deep, rumbling sound', type: 'noise' },
  { id: 'rain', label: 'Rain', description: 'Gentle rainfall', type: 'nature' },
  { id: 'ocean', label: 'Ocean Waves', description: 'Rolling surf', type: 'nature' },
];

const THERAPY_MODES = [
  { 
    key: 'standard' as TherapyMode, 
    label: 'Standard Therapy', 
    description: 'Gentle background sound with your matched tone for habituation',
    icon: ' '
  },
  { 
    key: 'relief' as TherapyMode, 
    label: 'Relief (CR) Therapy', 
    description: 'Coordinated reset pattern that may help desynchronize neurons',
    icon: ' '
  },
  { 
    key: 'sleep' as TherapyMode, 
    label: 'Sleep Support', 
    description: 'Quieter profile to help you wind down and sleep',
    icon: ' '
  },
];

export default function ImprovedTherapyPage() {
  // Setup state
  const [setupStep, setSetupStep] = useState<SetupStep>('welcome');
  const [isFirstTime, setIsFirstTime] = useState(true);
  
  // Audio state
  const [tinnitusPitch, setTinnitusPitch] = useState<number | null>(null);
  const [currentPitch, setCurrentPitch] = useState<number>(8000);
  const [isPitchPlaying, setIsPitchPlaying] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundProfile>(SOUND_PROFILES[0]);
  const [masterVolume, setMasterVolume] = useState(0.3);
  const [noiseVolume, setNoiseVolume] = useState(0.2);
  const [toneVolume, setToneVolume] = useState(0.1);
  
  // Session state
  const [selectedMode, setSelectedMode] = useState<TherapyMode>('standard');
  const [sessionDuration, setSessionDuration] = useState(30);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
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
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node
      if (!masterGainRef.current) {
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.connect(audioContextRef.current.destination);
        masterGainRef.current.gain.value = masterVolume;
      }
    }
    return audioContextRef.current;
  }, [masterVolume]);

  // Generate noise buffer
  const generateNoiseBuffer = useCallback((ctx: AudioContext, type: string) => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
    } else if (type === 'rain' || type === 'ocean') {
      // Simplified nature sounds using filtered noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
    }
    
    return buffer;
  }, []);

  // Play background noise
  const playNoise = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    // Stop existing noise
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current.disconnect();
    }
    
    // Create new noise
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
    if (ctx.state === 'suspended') ctx.resume();
    
    // Stop existing tone
    if (toneOscRef.current) {
      toneOscRef.current.stop();
      toneOscRef.current.disconnect();
    }
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
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
  const startCRTherapy = useCallback((baseFreq: number) => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    // Stop existing CR
    crOscillatorsRef.current.forEach(osc => {
      osc.stop();
      osc.disconnect();
    });
    crGainsRef.current.forEach(g => g.disconnect());
    if (crIntervalRef.current) clearInterval(crIntervalRef.current);
    
    const frequencies = [0.9, 1.0, 1.1, 1.2].map(m => baseFreq * m);
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    
    frequencies.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
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
  }, [getAudioContext, toneVolume]);

  // Stop CR therapy
  const stopCRTherapy = useCallback(() => {
    crOscillatorsRef.current.forEach(osc => {
      osc.stop();
      osc.disconnect();
    });
    crGainsRef.current.forEach(g => g.disconnect());
    crOscillatorsRef.current = [];
    crGainsRef.current = [];
    
    if (crIntervalRef.current) {
      clearInterval(crIntervalRef.current);
      crIntervalRef.current = null;
    }
  }, []);

  // Stop entire session (used by several flows)
  const stopSessionInternal = useCallback(() => {
    stopNoise();
    stopPitchTone();
    stopCRTherapy();
    
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    
    setSessionStatus('idle');
    setTimeRemaining(null);
  }, [stopNoise, stopPitchTone, stopCRTherapy]);

  // Start session
  const startSession = useCallback(() => {
    if (!tinnitusPitch) {
      alert('Please match your tinnitus pitch first');
      return;
    }
    
    playNoise();
    
    if (selectedMode === 'relief') {
      startCRTherapy(tinnitusPitch);
    } else {
      playPitchTone();
    }
    
    setSessionStatus('running');
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
  }, [tinnitusPitch, selectedMode, sessionDuration, playNoise, startCRTherapy, playPitchTone, stopSessionInternal]);

  // Pause session
  const pauseSession = useCallback(() => {
    stopNoise();
    stopPitchTone();
    stopCRTherapy();
    
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    
    setSessionStatus('paused');
  }, [stopNoise, stopPitchTone, stopCRTherapy]);

  // Resume session
  const resumeSession = useCallback(() => {
    if (!timeRemaining) return;
    
    playNoise();
    
    if (selectedMode === 'relief' && tinnitusPitch) {
      startCRTherapy(tinnitusPitch);
    } else {
      playPitchTone();
    }
    
    setSessionStatus('running');
    
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
  }, [timeRemaining, selectedMode, tinnitusPitch, playNoise, startCRTherapy, playPitchTone, stopSessionInternal]);

  // Stop session (external handler)
  const stopSession = useCallback(() => {
    stopSessionInternal();
  }, [stopSessionInternal]);

  // Update master volume
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume;
    }
  }, [masterVolume]);

  // Update noise volume
  useEffect(() => {
    if (noiseGainRef.current) {
      noiseGainRef.current.gain.value = noiseVolume;
    }
  }, [noiseVolume]);

  // Update tone volume
  useEffect(() => {
    if (toneGainRef.current) {
      toneGainRef.current.gain.value = toneVolume;
    }
    crGainsRef.current.forEach(g => {
      // Only update if this gain is currently "on"
      if (g.gain.value > 0) {
        g.gain.value = toneVolume;
      }
    });
  }, [toneVolume]);

  // Update pitch frequency
  useEffect(() => {
    if (toneOscRef.current) {
      toneOscRef.current.frequency.value = currentPitch;
    }
  }, [currentPitch]);

  // Load saved settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem('calmtinnitus_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.tinnitusPitch) {
          setTinnitusPitch(settings.tinnitusPitch);
          setCurrentPitch(settings.tinnitusPitch);
          setIsFirstTime(false);
          setSetupStep('ready');
        }
        if (settings.selectedSound) {
          const sound = SOUND_PROFILES.find(s => s.id === settings.selectedSound);
          if (sound) setSelectedSound(sound);
        }
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  }, []);

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem('calmtinnitus_settings', JSON.stringify({
        tinnitusPitch,
        selectedSound: selectedSound.id,
      }));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [tinnitusPitch, selectedSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSessionInternal();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopSessionInternal]);

  // Format time
  const formatTime = (minutes: number | null) => {
    if (minutes === null) return '--:--';
    const m = Math.floor(minutes);
    const s = Math.round((minutes - m) * 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Render setup wizard
  if (isFirstTime && setupStep !== 'ready') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '1rem', 
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {setupStep === 'welcome' && (
            <div>
              <h1 style={{ marginTop: 0 }}>Welcome to CalmTinnitus</h1>
              <p>Let's get you set up in 3 quick steps:</p>
              <ol style={{ lineHeight: 1.8 }}>
                <li>Match your tinnitus pitch</li>
                <li>Choose a background sound</li>
                <li>Start your first session</li>
              </ol>
              <p style={{ fontSize: '0.9rem', color: '#666', background: '#fef3cd', padding: '1rem', borderRadius: '0.5rem' }}>
                <strong> Safety reminder:</strong> Keep your volume comfortable. We'll start very quiet.
              </p>
              <button
                onClick={() => setSetupStep('pitch')}
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #22c55e)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '999px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                Get Started
              </button>
            </div>
          )}

          {setupStep === 'pitch' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Step 1: Match Your Tinnitus Pitch</h2>
              <p>Adjust the slider until the tone sounds similar to your tinnitus.</p>
              
              <div style={{ marginTop: '2rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '0.5rem',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '600' }}>Test Tone: {Math.round(currentPitch)} Hz</span>
                  <button
                    onClick={() => isPitchPlaying ? stopPitchTone() : playPitchTone()}
                    style={{
                      background: isPitchPlaying ? '#ef4444' : '#22c55e',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {isPitchPlaying ? <><Square size={16} /> Stop</> : <><Play size={16} /> Play</>}
                  </button>
                </div>
                
                <input
                  type="range"
                  min="250"
                  max="16000"
                  step="50"
                  value={currentPitch}
                  onChange={(e) => setCurrentPitch(Number(e.target.value))}
                  style={{ width: '100%', height: '8px' }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                  <span>Low (250 Hz)</span>
                  <span>High (16000 Hz)</span>
                </div>
              </div>

              <div style={{ 
                marginTop: '2rem', 
                padding: '1rem', 
                background: '#f0f9ff', 
                borderRadius: '0.5rem',
                fontSize: '0.9rem'
              }}>
                <strong>Tip:</strong> Most tinnitus is between 3000-8000 Hz. Start high and adjust down slowly.
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    stopPitchTone();
                    setSetupStep('welcome');
                  }}
                  style={{
                    background: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '999px',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setTinnitusPitch(currentPitch);
                    stopPitchTone();
                    setSetupStep('sound');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #22c55e)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Save & Continue
                </button>
              </div>
            </div>
          )}

          {setupStep === 'sound' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Step 2: Choose Background Sound</h2>
              <p>Select the sound that feels most comfortable to you:</p>
              
              <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1.5rem' }}>
                {SOUND_PROFILES.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedSound(profile)}
                    style={{
                      padding: '1rem',
                      border: selectedSound.id === profile.id ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      background: selectedSound.id === profile.id ? '#f0f9ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{profile.label}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{profile.description}</div>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setSetupStep('pitch')}
                  style={{
                    background: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '999px',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setSetupStep('ready');
                    setIsFirstTime(false);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #22c55e)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Check size={20} />
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header with Volume Control */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>CalmTinnitus</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#666' }}>Your personalized tinnitus therapy</p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'white',
          borderRadius: '999px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {masterVolume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            style={{ width: '120px' }}
          />
          <span style={{ fontSize: '0.85rem', fontWeight: '600', minWidth: '45px' }}>
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Session Status - Prominent when running */}
      {sessionStatus !== 'idle' && (
        <div style={{
          background: 'linear-gradient(135deg, #0ea5e9, #22c55e)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            {formatTime(timeRemaining)}
          </div>
          <div style={{ fontSize: '1rem', opacity: 0.9 }}>
            {THERAPY_MODES.find(m => m.key === selectedMode)?.label} • {sessionStatus === 'running' ? 'In Progress' : 'Paused'}
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            justifyContent: 'center', 
            marginTop: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {sessionStatus === 'running' ? (
              <button
                onClick={pauseSession}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '2px solid white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Pause size={20} /> Pause
              </button>
            ) : (
              <button
                onClick={resumeSession}
                style={{
                  background: 'white',
                  color: '#0ea5e9',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Play size={20} /> Resume
              </button>
            )}
            
            <button
              onClick={stopSession}
              style={{
                background: 'rgba(239,68,68,0.9)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Square size={20} /> Stop
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Therapy Mode Selection */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>Therapy Mode</h2>
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            {THERAPY_MODES.map(mode => (
              <button
                key={mode.key}
                onClick={() => setSelectedMode(mode.key)}
                disabled={sessionStatus !== 'idle'}
                style={{
                  padding: '1rem',
                  border: selectedMode === mode.key ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  background: selectedMode === mode.key ? '#f0f9ff' : 'white',
                  cursor: sessionStatus === 'idle' ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                  opacity: sessionStatus !== 'idle' ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{mode.icon}</span>
                  <span style={{ fontWeight: '600' }}>{mode.label}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', paddingLeft: '2.25rem' }}>
                  {mode.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Session Duration */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>Session Duration</h2>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[15, 30, 45, 60].map(duration => (
              <button
                key={duration}
                onClick={() => setSessionDuration(duration)}
                disabled={sessionStatus !== 'idle'}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: sessionDuration === duration ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
                  borderRadius: '999px',
                  background: sessionDuration === duration ? '#f0f9ff' : 'white',
                  cursor: sessionStatus === 'idle' ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  opacity: sessionStatus !== 'idle' ? 0.6 : 1
                }}
              >
                {duration} min
              </button>
            ))}
          </div>
        </div>

        {/* Start Session Button */}
        {sessionStatus === 'idle' && (
          <button
            onClick={startSession}
            disabled={!tinnitusPitch}
            style={{
              background: tinnitusPitch ? 'linear-gradient(135deg, #0ea5e9, #22c55e)' : '#e5e7eb',
              color: tinnitusPitch ? 'white' : '#9ca3af',
              border: 'none',
              padding: '1.25rem',
              borderRadius: '1rem',
              fontSize: '1.25rem',
              fontWeight: '700',
              cursor: tinnitusPitch ? 'pointer' : 'not-allowed',
              boxShadow: tinnitusPitch ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
          >
            <Play size={24} />
            Start {THERAPY_MODES.find(m => m.key === selectedMode)?.label}
          </button>
        )}

        {/* Settings Panel */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>Advanced Settings</h2>
          
          {/* Tinnitus Pitch */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: '600' }}>Tinnitus Pitch</label>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>
                {tinnitusPitch ? `${Math.round(tinnitusPitch)} Hz` : 'Not set'}
              </span>
            </div>
            <button
              onClick={() => {
                setIsFirstTime(true);
                setSetupStep('pitch');
              }}
              disabled={sessionStatus !== 'idle'}
              style={{
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: sessionStatus === 'idle' ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem',
                opacity: sessionStatus !== 'idle' ? 0.6 : 1
              }}
            >
              Re-match Pitch
            </button>
          </div>

          {/* Background Sound */}
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.75rem' }}>
              Background Sound
            </label>
            <select
              value={selectedSound.id}
              onChange={(e) => {
                const sound = SOUND_PROFILES.find(s => s.id === e.target.value);
                if (sound) setSelectedSound(sound);
              }}
              disabled={sessionStatus === 'running'}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                fontSize: '1rem',
                cursor: sessionStatus === 'running' ? 'not-allowed' : 'pointer',
                opacity: sessionStatus === 'running' ? 0.6 : 1
              }}
            >
              {SOUND_PROFILES.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.label} - {profile.description}
                </option>
              ))}
            </select>
          </div>

          {/* Volume Controls */}
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.75rem' }}>
              Background Volume: {Math.round(noiseVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={noiseVolume}
              onChange={(e) => setNoiseVolume(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.75rem' }}>
              Tone Volume: {Math.round(toneVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.05"
              value={toneVolume}
              onChange={(e) => setToneVolume(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Info Panel */}
        <div style={{ 
          background: '#fef3cd', 
          padding: '1.5rem', 
          borderRadius: '1rem',
          border: '1px solid #fbbf24'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Info size={20} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>How to use CalmTinnitus</h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                <li>Listen at a comfortable volume - never too loud</li>
                <li>Use daily for 15-30 minutes for best results</li>
                <li>You can change therapy modes between sessions</li>
                <li>Stop if you feel any discomfort or your tinnitus worsens</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '3rem', 
        paddingTop: '2rem', 
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#666'
      }}>
        <p>CalmTinnitus is a self-help sound tool and does not replace medical care.</p>
        <p>For sudden hearing changes or medical concerns, please seek professional help.</p>
      </div>
    </div>
  );
}
