/**
 * Calm Tinnitus – Evidence-Based Neuromodulation & Notch Therapy
 * Features:
 * - Frequency Matching (Calibration) with Octave Check
 * - Notch Therapy (Lateral Inhibition)
 * - Neuromodulation (10Hz Alpha Entrainment)
 * - Colored Noise Masking + “My Audio”
 * - CBT Micro-Calm module
 * - Firebase Persistence
 */

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  User, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  Volume2, 
  Activity, 
  Settings, 
  Play, 
  Pause, 
  Save, 
  Info,
  CheckCircle,
  BarChart2,
  Zap,
  ShieldOff,
  HelpCircle
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
// @ts-ignore
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
// @ts-ignore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'tinnitus-therapy';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- TYPES ---
type CalibrationStep = 'intro' | 'coarse' | 'fine' | 'octave' | 'volume' | 'complete';
type TherapyMode = 'notch' | 'neuromod' | 'masking';
type NoiseColor = 'white' | 'pink' | 'brown';

interface UserProfile {
  frequency: number;     // Hz
  volume: number;        // 0-1
  lastModified: number;
}

// --- AUDIO ENGINE (Web Audio API) ---
class AudioEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  
  // Oscillators for Calibration
  calibOsc: OscillatorNode | null = null;
  calibGain: GainNode | null = null;

  // Therapy Nodes
  noiseSource: AudioBufferSourceNode | null = null;
  notchFilter: BiquadFilterNode | null = null;
  modulator: OscillatorNode | null = null;
  modulatorGain: GainNode | null = null; // Controls depth of modulation
  carrierGain: GainNode | null = null;   // The gain node being modulated

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- CALIBRATION METHODS ---
  playTone(frequency: number, volume: number) {
    this.stopTone();
    if (!this.ctx || !this.masterGain) return;

    this.calibOsc = this.ctx.createOscillator();
    this.calibOsc.type = 'sine';
    this.calibOsc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    this.calibGain = this.ctx.createGain();
    this.calibGain.gain.setValueAtTime(0, this.ctx.currentTime);
    // lower overall level for safety
    this.calibGain.gain.linearRampToValueAtTime(volume * 0.1, this.ctx.currentTime + 0.1); 

    this.calibOsc.connect(this.calibGain);
    this.calibGain.connect(this.masterGain);
    this.calibOsc.start();
  }

  stopTone() {
    if (this.calibOsc) {
      try {
        this.calibOsc.stop();
        this.calibOsc.disconnect();
      } catch (e) {}
      this.calibOsc = null;
    }
  }

  // --- THERAPY METHODS ---
  
  // Generate Noise Buffer
  createNoiseBuffer(type: NoiseColor): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = 2 * this.ctx.sampleRate; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // Compensate for gain
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Compensate for gain
      }
    }
    return buffer;
  }

  startTherapy(mode: TherapyMode, frequency: number, noiseType: NoiseColor = 'pink') {
    this.stopTherapy();
    if (!this.ctx || !this.masterGain) return;
    this.resume();

    // 1. Source: Noise
    const buffer = this.createNoiseBuffer(noiseType);
    if (!buffer) return;
    
    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    // Chain setup variables
    let lastNode: AudioNode = this.noiseSource;

    // 2. Logic based on Mode
    if (mode === 'notch') {
      // Notch filter (Lateral Inhibition)
      this.notchFilter = this.ctx.createBiquadFilter();
      this.notchFilter.type = 'notch';
      this.notchFilter.frequency.value = frequency;
      this.notchFilter.Q.value = 1.0; // ~1 octave bandwidth
      
      lastNode.connect(this.notchFilter);
      lastNode = this.notchFilter;

    } else if (mode === 'neuromod') {
      // Neuromodulation (10Hz Alpha Entrainment)
      this.carrierGain = this.ctx.createGain();
      this.carrierGain.gain.value = 0.5;
      
      this.modulator = this.ctx.createOscillator();
      this.modulator.frequency.value = 10; // 10Hz Alpha
      this.modulator.type = 'sine';
      
      this.modulatorGain = this.ctx.createGain();
      this.modulatorGain.gain.value = 0.5; // depth

      this.modulator.connect(this.modulatorGain);
      this.modulatorGain.connect(this.carrierGain.gain);
      this.modulator.start();

      lastNode.connect(this.carrierGain);
      lastNode = this.carrierGain;
    }
    // masking = raw noise

    // 3. Connect to Master
    const sessionGain = this.ctx.createGain();
    sessionGain.gain.value = 0.5; // Default therapy volume
    lastNode.connect(sessionGain);
    sessionGain.connect(this.masterGain);

    this.noiseSource.start();
    
    this.noiseSource.onended = () => {
      sessionGain.disconnect();
    };
  }

  stopTherapy() {
    if (this.noiseSource) {
      try { this.noiseSource.stop(); } catch(e){}
      this.noiseSource.disconnect();
    }
    if (this.modulator) {
      try { this.modulator.stop(); } catch(e){}
      this.modulator.disconnect();
    }
    if (this.notchFilter) this.notchFilter.disconnect();
    
    this.noiseSource = null;
    this.notchFilter = null;
    this.modulator = null;
  }
}

// --- MAIN COMPONENT ---
export default function TinnitusApp() {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Calibration
  const [calibStep, setCalibStep] = useState<CalibrationStep>('intro');
  const [calibFreq, setCalibFreq] = useState(8000); // Default start
  const [calibVol, setCalibVol] = useState(0.5);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // Therapy
  const [activeMode, setActiveMode] = useState<TherapyMode | null>(null);
  const [noiseColor, setNoiseColor] = useState<NoiseColor>('pink');
  const [useExternalAudio, setUseExternalAudio] = useState(false);
  const [showStressCoach, setShowStressCoach] = useState(false);
  
  // Audio Engine
  const engine = useRef<AudioEngine | null>(null);

  // --- AUTH & DATA LOADING ---
  useEffect(() => {
    engine.current = new AudioEngine();

    const initAuth = async () => {
      // @ts-ignore
      const customToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
      if (customToken) {
        await signInWithCustomToken(auth, customToken);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'data', 'profile');
        const unsubDoc = onSnapshot(docRef, 
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              setProfile(data);
              setCalibFreq(data.frequency);
            }
            setLoading(false);
          },
          (err) => {
            console.error("Error loading profile:", err);
            setLoading(false);
          }
        );
        return () => unsubDoc();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- CALIBRATION HANDLERS ---
  const toggleTestTone = () => {
    if (!engine.current) return;
    
    if (isPlayingTest) {
      engine.current.stopTone();
    } else {
      engine.current.resume();
      engine.current.playTone(calibFreq, calibVol);
    }
    setIsPlayingTest(!isPlayingTest);
  };

  // Update tone in real-time if playing
  useEffect(() => {
    if (isPlayingTest && engine.current) {
      engine.current.playTone(calibFreq, calibVol);
    }
  }, [calibFreq, calibVol, isPlayingTest]);

  const saveProfile = async () => {
    if (!user) return;
    const newProfile: UserProfile = {
      frequency: calibFreq,
      volume: calibVol,
      lastModified: Date.now()
    };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'profile'), newProfile);
      setProfile(newProfile);
      setCalibStep('complete');
      if (isPlayingTest) toggleTestTone();
    } catch (e) {
      console.error("Error saving:", e);
    }
  };

  // --- THERAPY HANDLERS ---
  const toggleTherapy = (mode: TherapyMode, noiseOverride?: NoiseColor) => {
    if (!engine.current) return;

    // If user selected "My Audio", we don't start internal masking.
    if (useExternalAudio && mode === 'masking') {
      // just flip off any current internal sound
      engine.current.stopTherapy();
      setActiveMode(null);
      return;
    }

    const effectiveNoise = noiseOverride ?? noiseColor;

    if (activeMode === mode) {
      engine.current.stopTherapy();
      setActiveMode(null);
    } else {
      engine.current.resume();
      engine.current.startTherapy(mode, profile?.frequency || 8000, effectiveNoise);
      setActiveMode(mode);
    }
  };

  // Stop everything on unmount
  useEffect(() => {
    return () => {
      engine.current?.stopTone();
      engine.current?.stopTherapy();
    };
  }, []);

  // --- RENDER HELPERS ---
  const FreqSlider = () => (
    <div className="w-full space-y-4">
      <div className="flex justify-between text-sm text-cyan-200">
        <span>Low (100Hz)</span>
        <span className="font-bold text-white">{calibFreq} Hz</span>
        <span>High (12kHz)</span>
      </div>
      <input
        type="range"
        min="100"
        max="12000"
        step="10"
        value={calibFreq}
        onChange={(e) => setCalibFreq(Number(e.target.value))}
        className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
      />
      <div className="flex gap-2 justify-center">
        <button 
          onClick={() => setCalibFreq(Math.max(100, calibFreq - 10))}
          className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 transition"
        >
          -10Hz
        </button>
        <button 
          onClick={() => setCalibFreq(Math.min(12000, calibFreq + 10))}
          className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 transition"
        >
          +10Hz
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1b2a] flex items-center justify-center text-cyan-400 animate-pulse">
        Initializing Calm Tinnitus...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="p-4 border-b border-slate-800 bg-[#101c2f]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-cyan-400 w-6 h-6" />
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Calm Tinnitus
            </h1>
          </div>
          {profile && (
            <button 
              onClick={() => setCalibStep('intro')}
              className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition"
            >
              <Settings className="w-3 h-3" /> Recalibrate
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 pb-24 space-y-6">
        {/* CALIBRATION FLOW */}
        {(!profile || calibStep !== 'complete') ? (
          <div className="bg-[#101c2f] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            {calibStep === 'intro' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto text-cyan-400">
                  <Volume2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Tinnitus Calibration</h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    To provide effective Notch Therapy and Neuromodulation, we need to identify your specific tinnitus frequency. 
                    Find a quiet room and use headphones if possible.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    engine.current?.resume();
                    setCalibStep('coarse');
                  }}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-900/20"
                >
                  Start Calibration
                </button>
              </div>
            )}

            {calibStep === 'coarse' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">Find Your Pitch</h3>
                  <p className="text-xs text-slate-300">Move the slider until the tone matches your tinnitus pitch.</p>
                </div>

                <div className="h-40 bg-[#0b1725] rounded-xl flex items-center justify-center border border-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" style={{ animationDuration: `${10000/calibFreq}s` }}></div>
                  <button 
                    onClick={toggleTestTone}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isPlayingTest ? 'bg-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)]' : 'bg-slate-800 hover:bg-slate-700'}`}
                  >
                    {isPlayingTest ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
                  </button>
                </div>

                <FreqSlider />

                <button 
                  onClick={() => {
                    if(isPlayingTest) toggleTestTone();
                    setCalibStep('octave');
                  }}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition"
                >
                  Next: Check Accuracy
                </button>
              </div>
            )}

            {calibStep === 'octave' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">Octave Check</h3>
                  <p className="text-xs text-slate-300">
                    Common mistake: tinnitus often sounds higher or lower than it is. Let&apos;s check.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => {
                      engine.current?.playTone(calibFreq * 0.5, calibVol);
                      setIsPlayingTest(true);
                    }}
                    className="p-4 bg-slate-900 rounded-xl hover:bg-slate-800 border border-slate-700 text-left"
                  >
                    <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Try Lower</span>
                    <div className="text-lg font-semibold">{calibFreq * 0.5} Hz</div>
                    <div className="text-xs text-slate-400 mt-1">Is this closer?</div>
                  </button>

                  <button 
                    onClick={() => {
                      engine.current?.playTone(calibFreq, calibVol);
                      setIsPlayingTest(true);
                    }}
                    className="p-4 bg-cyan-900/30 border border-cyan-500/50 rounded-xl text-left"
                  >
                    <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Current Match</span>
                    <div className="text-lg font-semibold text-cyan-100">{calibFreq} Hz</div>
                    <div className="text-xs text-cyan-300/70 mt-1">Your selection</div>
                  </button>

                  <button 
                    onClick={() => {
                      engine.current?.playTone(calibFreq * 2, calibVol);
                      setIsPlayingTest(true);
                    }}
                    className="p-4 bg-slate-900 rounded-xl hover:bg-slate-800 border border-slate-700 text-left"
                  >
                    <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Try Higher</span>
                    <div className="text-lg font-semibold">{calibFreq * 2} Hz</div>
                    <div className="text-xs text-slate-400 mt-1">Is this closer?</div>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      engine.current?.stopTone();
                      setCalibStep('coarse');
                    }}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl transition"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => {
                      engine.current?.stopTone();
                      setIsPlayingTest(false);
                      setCalibStep('volume');
                    }}
                    className="flex-[2] py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition"
                  >
                    Confirm {calibFreq} Hz
                  </button>
                </div>
              </div>
            )}

            {calibStep === 'volume' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">Match Volume</h3>
                  <p className="text-xs text-slate-300">
                    Adjust the volume until it feels as loud as your tinnitus.
                  </p>
                </div>

                <div className="flex justify-center py-6">
                  <button 
                    onClick={toggleTestTone}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isPlayingTest ? 'bg-cyan-500' : 'bg-slate-800'}`}
                  >
                    {isPlayingTest ? <Pause className="text-white" /> : <Play className="text-white ml-1" />}
                  </button>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={calibVol}
                  onChange={(e) => setCalibVol(Number(e.target.value))}
                  className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                
                <button 
                  onClick={saveProfile}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Profile
                </button>
              </div>
            )}
          </div>
        ) : (
          /* THERAPY DASHBOARD */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Card */}
            <div className="bg-gradient-to-br from-[#101c2f] to-[#16253a] border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="w-32 h-32 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-1">
                  Your Calibrated Profile
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{profile.frequency}</span>
                  <span className="text-slate-300">Hz</span>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <div className="bg-slate-900/60 backdrop-blur px-3 py-1 rounded-full text-xs text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Calibrated
                  </div>
                  <div className="bg-slate-900/40 px-3 py-1 rounded-full text-xs text-slate-300 border border-slate-700/60 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> 
                    Use 10–20 minutes per session.
                  </div>
                </div>
              </div>
            </div>

            {/* Noise / Audio Selection */}
            <div className="bg-[#101c2f] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex gap-2 overflow-x-auto">
                {(['white', 'pink', 'brown'] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setUseExternalAudio(false);
                      setNoiseColor(color);
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap ${
                      !useExternalAudio && noiseColor === color 
                        ? 'bg-slate-800 text-white shadow-lg' 
                        : 'text-slate-300 hover:text-white bg-slate-900/40'
                    }`}
                  >
                    {color} Noise
                  </button>
                ))}

                {/* My Audio */}
                <button
                  onClick={() => {
                    setUseExternalAudio(true);
                    // stop internal masking if running
                    engine.current?.stopTherapy();
                    setActiveMode(null);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    useExternalAudio
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white bg-slate-900/40'
                  }`}
                >
                  My Audio
                </button>
              </div>

              {useExternalAudio && (
                <div className="flex gap-2 items-start text-xs text-emerald-100 bg-emerald-900/30 border border-emerald-700/60 rounded-xl p-3">
                  <HelpCircle className="w-4 h-4 mt-0.5" />
                  <p>
                    Now play any **music, podcast, or nature sounds** on your phone. 
                    Your own audio acts as masking and stress-reduction. 
                    Calm Tinnitus focuses on **calibration & coaching** while your audio plays in the background.
                  </p>
                </div>
              )}
            </div>

            {/* Therapy Modes */}
            <div className="grid gap-4">
              {/* Card 1: Brown Noise Masking */}
              <button
                onClick={() => {
                  setUseExternalAudio(false);
                  setNoiseColor('brown');
                  toggleTherapy('masking', 'brown');
                }}
                className={`relative group p-6 rounded-2xl border text-left transition-all duration-300 overflow-hidden ${
                  activeMode === 'masking' && !useExternalAudio
                    ? 'bg-emerald-900/30 border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.25)]' 
                    : 'bg-[#101c2f] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-3 rounded-xl ${
                    activeMode === 'masking' && !useExternalAudio ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-300'
                  }`}>
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  {activeMode === 'masking' && !useExternalAudio && (
                    <div className="text-xs font-bold text-emerald-300 animate-pulse uppercase tracking-wider">
                      Active
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Brown Noise Masking
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Deep brown noise for **immediate calm** and gentle **residual inhibition**. 
                  Ideal when the tinnitus feels loud or stressful.
                </p>
              </button>

              {/* Card 2: Notch Therapy */}
              <button
                onClick={() => {
                  setUseExternalAudio(false);
                  toggleTherapy('notch');
                }}
                className={`relative group p-6 rounded-2xl border text-left transition-all duration-300 overflow-hidden ${
                  activeMode === 'notch' 
                    ? 'bg-cyan-900/30 border-cyan-500/60 shadow-[0_0_40px_rgba(6,182,212,0.25)]' 
                    : 'bg-[#101c2f] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-3 rounded-xl ${
                    activeMode === 'notch' ? 'bg-cyan-500 text-white' : 'bg-slate-900 text-slate-300'
                  }`}>
                    <ShieldOff className="w-6 h-6" />
                  </div>
                  {activeMode === 'notch' && (
                    <div className="text-xs font-bold text-cyan-300 animate-pulse uppercase tracking-wider">
                      Active
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Notch Therapy (Tone-Matched)
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Removes ~{profile.frequency}Hz from the soundscape to drive **lateral inhibition** of the specific neurons 
                  linked to your tinnitus tone.
                </p>
              </button>

              {/* Card 3: Neuromodulation */}
              <button
                onClick={() => {
                  setUseExternalAudio(false);
                  toggleTherapy('neuromod');
                }}
                className={`relative group p-6 rounded-2xl border text-left transition-all duration-300 overflow-hidden ${
                  activeMode === 'neuromod' 
                    ? 'bg-purple-900/30 border-purple-500/60 shadow-[0_0_40px_rgba(168,85,247,0.25)]' 
                    : 'bg-[#101c2f] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-3 rounded-xl ${
                    activeMode === 'neuromod' ? 'bg-purple-500 text-white' : 'bg-slate-900 text-slate-300'
                  }`}>
                    <Zap className="w-6 h-6" />
                  </div>
                  {activeMode === 'neuromod' && (
                    <div className="text-xs font-bold text-purple-300 animate-pulse uppercase tracking-wider">
                      Active
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Neuromodulation – 10Hz Alpha
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  **Heavy reset** mode. 10Hz amplitude modulation to nudge brain rhythms toward calming alpha activity. 
                  Use 10–15 minutes, ideally while relaxed.
                </p>
              </button>

              {/* Card 4: Stress-Reduction (CBT Micro-Calm) */}
              <button
                onClick={() => setShowStressCoach(!showStressCoach)}
                className={`relative group p-6 rounded-2xl border text-left transition-all duration-300 overflow-hidden ${
                  showStressCoach
                    ? 'bg-amber-900/25 border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.25)]'
                    : 'bg-[#101c2f] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-3 rounded-xl ${
                    showStressCoach ? 'bg-amber-500 text-white' : 'bg-slate-900 text-slate-300'
                  }`}>
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  {showStressCoach && (
                    <div className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                      Open
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Stress-Reduction (CBT Micro-Calm)
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  2–3 minute mental reset using **breathing, re-focusing and reframing**. 
                  Designed to lower the emotional “alarm” around the tinnitus.
                </p>
              </button>
            </div>

            {/* CBT MICRO-CALM PANEL */}
            {showStressCoach && (
              <div className="bg-[#101c2f] border border-slate-800 rounded-2xl p-5 space-y-3 text-sm text-slate-200">
                <h4 className="font-semibold mb-1">Micro-Calm Script (anywhere, any time)</h4>
                <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed">
                  <li>
                    <strong>Anchor your breath.</strong> Inhale slowly for 4 seconds, hold 2, exhale for 6. 
                    Repeat 6–10 breaths. Let the shoulders drop.
                  </li>
                  <li>
                    <strong>Rename the sound.</strong> Silently say: “This is just a harmless brain sound. 
                    It&apos;s annoying, not dangerous.” Notice any tension and soften it.
                  </li>
                  <li>
                    <strong>Shift attention.</strong> Gently bring focus to something neutral: the feeling of the chair, 
                    your feet on the floor, or soft background sounds.
                  </li>
                  <li>
                    <strong>Finish with choice.</strong> Decide one small pleasant action now: a warm drink, a short walk, 
                    or listening to calming audio. This teaches the brain that **life continues even with the sound.**
                  </li>
                </ol>
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-4 bg-[#101c2f] rounded-xl border border-slate-800 flex gap-3 items-start mt-4">
              <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                Calm Tinnitus is for tinnitus management and relaxation. It is not a medical device. 
                Benefits are based on masking, residual inhibition, lateral inhibition and stress-reduction, 
                not acoustic wave “cancellation”. Consult a hearing professional or doctor for medical advice, 
                sudden hearing loss or pain.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
