// FILE: /app/ptm/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, signInAnonymously } from "@/lib/firebase";
import Link from "next/link";
import Footer from "@/components/Footer";

// --- TFI (Tinnitus Functional Index) Screening ---
// Simplified 8-question version based on TFI domains
type TFIQuestion = {
  id: string;
  domain: string;
  question: string;
};

const TFI_QUESTIONS: TFIQuestion[] = [
  { id: "q1", domain: "Intrusiveness", question: "Over the past week, how much of the time were you consciously aware of your tinnitus?" },
  { id: "q2", domain: "Sense of Control", question: "Over the past week, how much of the time did you feel in control of your tinnitus?" },
  { id: "q3", domain: "Cognitive", question: "Over the past week, how much has your tinnitus made it difficult to concentrate?" },
  { id: "q4", domain: "Sleep", question: "Over the past week, how much has your tinnitus interfered with falling or staying asleep?" },
  { id: "q5", domain: "Auditory", question: "Over the past week, how much difficulty have you had hearing clearly because of your tinnitus?" },
  { id: "q6", domain: "Relaxation", question: "Over the past week, how much has your tinnitus interfered with your ability to relax?" },
  { id: "q7", domain: "Quality of Life", question: "Over the past week, how much has your tinnitus interfered with your enjoyment of life?" },
  { id: "q8", domain: "Emotional", question: "Over the past week, how bothered or upset have you been because of your tinnitus?" },
];

// PTM stepped-care levels
type PTMLevel = {
  level: number;
  name: string;
  scoreRange: string;
  severity: string;
  color: string;
  description: string;
  recommendations: string[];
  resources: { title: string; description: string; link?: string }[];
};

const PTM_LEVELS: PTMLevel[] = [
  {
    level: 1,
    name: "Triage",
    scoreRange: "0–17",
    severity: "Mild / Not a problem",
    color: "#22c55e",
    description:
      "Your tinnitus is present but does not significantly affect your daily life. This is a good sign! Many people at this level benefit from basic education about tinnitus and light sound enrichment.",
    recommendations: [
      "Continue using CalmTinnitus sound therapy as needed for comfort",
      "Use background sound enrichment during quiet times",
      "No clinical intervention typically needed at this level",
    ],
    resources: [
      { title: "Understanding Your Tinnitus", description: "Learn how tinnitus works and why your brain generates the sound" },
      { title: "Sound Enrichment Basics", description: "How to use gentle background sound to reduce contrast with silence" },
    ],
  },
  {
    level: 2,
    name: "Audiologic Evaluation",
    scoreRange: "18–31",
    severity: "Mild–Moderate",
    color: "#eab308",
    description:
      "Your tinnitus causes some interference with daily activities. At this level, most people benefit from hearing evaluation (to rule out treatable causes) and structured sound therapy with education.",
    recommendations: [
      "Consider a hearing evaluation with an audiologist if you haven't recently",
      "Use daily sound therapy sessions (30 min, 2x/day) with CalmTinnitus",
      "Try the SR (Stochastic Resonance) mode if you have any hearing loss",
      "Start the MBCT mindfulness program for tinnitus distress reduction",
      "Track your progress using the program tracker",
    ],
    resources: [
      { title: "The Habituation Model", description: "How your brain naturally learns to filter tinnitus over time — and how to support this process" },
      { title: "Sound Therapy Guide", description: "Choosing the right sound level: the 'mixing point' principle" },
      { title: "When to See a Doctor", description: "Signs that warrant medical evaluation for your tinnitus" },
    ],
  },
  {
    level: 3,
    name: "Group Education",
    scoreRange: "32–53",
    severity: "Moderate",
    color: "#f97316",
    description:
      "Your tinnitus is having a meaningful impact on your quality of life. At this level, a combination of sound therapy and psychological skills (like those in our MBCT program) shows the best results in clinical trials.",
    recommendations: [
      "Daily sound therapy is strongly recommended (30–60 min/day)",
      "Complete the 8-week MBCT mindfulness program — this has the strongest evidence at your severity level",
      "Use the 3-minute breathing space exercise when tinnitus spikes",
      "Consider the SR mode with a hearing profile for personalised sound therapy",
      "Seek an audiological assessment if not done in the past year",
      "Keep a daily check-in to monitor progress over time",
    ],
    resources: [
      { title: "MBCT for Tinnitus", description: "An 8-week evidence-based mindfulness program designed specifically for tinnitus sufferers", link: "/mbct" },
      { title: "The Stress–Tinnitus Cycle", description: "How stress amplifies tinnitus perception and practical ways to break the loop" },
      { title: "Sleep Strategies", description: "Evidence-based techniques for falling asleep with tinnitus" },
      { title: "Cognitive Reframing", description: "Changing your relationship with tinnitus-related thoughts" },
    ],
  },
  {
    level: 4,
    name: "Interdisciplinary Evaluation",
    scoreRange: "54–72",
    severity: "Moderate–Severe",
    color: "#ef4444",
    description:
      "Your tinnitus is significantly affecting multiple areas of your life. Clinical research shows that at this severity, the best outcomes come from combining sound therapy with professional psychological support.",
    recommendations: [
      "Strongly consider consultation with an ENT specialist or audiologist who specialises in tinnitus",
      "The MBCT mindfulness program is especially valuable at this level",
      "Daily sound therapy with CalmTinnitus (minimum 30 min, 2x/day)",
      "Consider professional CBT or counselling alongside self-help tools",
      "Track daily check-ins to share with your healthcare provider",
      "Use sound enrichment throughout the day, especially in quiet environments",
    ],
    resources: [
      { title: "Finding Professional Help", description: "How to find a tinnitus-specialised audiologist or therapist in your area" },
      { title: "MBCT Program", description: "Start the structured 8-week mindfulness program", link: "/mbct" },
      { title: "Understanding CBT for Tinnitus", description: "What to expect from cognitive-behavioural therapy for tinnitus" },
      { title: "Hearing Aids & Tinnitus", description: "When amplification can help reduce tinnitus perception" },
    ],
  },
  {
    level: 5,
    name: "Individualised Management",
    scoreRange: "73–100",
    severity: "Severe",
    color: "#dc2626",
    description:
      "Your tinnitus is having a severe impact. At this level, professional clinical support is strongly recommended alongside self-help tools. CalmTinnitus can be a valuable part of your toolkit, but should be used in conjunction with professional care.",
    recommendations: [
      "Please consult an ENT doctor and/or audiologist specialising in tinnitus — this is the most important step",
      "Ask about tinnitus-focused CBT or MBCT with a trained therapist",
      "Use CalmTinnitus sound therapy daily as a complement to professional treatment",
      "Start the MBCT mindfulness program — it helps even while awaiting professional care",
      "If hearing loss is involved, discuss hearing aid options with your audiologist",
      "Consider whether stress, sleep difficulties, or mood may be amplifying your tinnitus — these are treatable",
    ],
    resources: [
      { title: "Crisis & Support", description: "If tinnitus is causing severe distress, contact your healthcare provider. You deserve support." },
      { title: "MBCT Program", description: "Begin structured mindfulness training for tinnitus", link: "/mbct" },
      { title: "Building Your Care Team", description: "Audiologist, ENT, psychologist — who does what in tinnitus management" },
      { title: "The Science of Hope", description: "Research progress in tinnitus treatment and why outcomes are improving" },
    ],
  },
];

// --- EDUCATION MODULES ---
type EducationModule = {
  id: string;
  title: string;
  icon: string;
  content: string[];
};

const EDUCATION_MODULES: EducationModule[] = [
  {
    id: "what-is-tinnitus",
    title: "What Is Tinnitus?",
    icon: "🧠",
    content: [
      "Tinnitus is the perception of sound when no external sound is present. It's commonly described as ringing, buzzing, hissing, or humming.",
      "Around 10–15% of the population experience some form of tinnitus. For most, it's a mild background noise. For some, it can significantly affect daily life.",
      "Tinnitus is not a disease itself — it's a symptom. It most commonly occurs with some degree of hearing loss, but can also be triggered by stress, noise exposure, medication, or other factors.",
      "The sound is generated by your brain, not your ears. When sensory input is reduced (often due to hearing loss), the brain compensates by increasing neural activity — which you perceive as tinnitus.",
    ],
  },
  {
    id: "habituation",
    title: "How Habituation Works",
    icon: "🔄",
    content: [
      "Habituation is the brain's natural ability to filter out constant, non-threatening stimuli. Think of how you stop noticing the hum of a refrigerator or the feeling of clothes on your skin.",
      "Your brain is capable of habituating to tinnitus too. Many people with tinnitus reach a point where they only notice it when they think about it — and it no longer causes distress.",
      "Habituation has two components: you stop reacting emotionally to the sound, and you stop noticing it as often. The emotional response typically improves first.",
      "Sound therapy supports habituation by reducing the contrast between tinnitus and silence. The 'mixing point' — where external sound just blends with your tinnitus — is the optimal level for promoting habituation.",
      "Stress, anxiety, and focused attention on tinnitus can slow habituation. That's why the combination of sound therapy and mindfulness/CBT is more effective than either alone.",
    ],
  },
  {
    id: "sound-therapy-guide",
    title: "How to Use Sound Therapy",
    icon: "🎵",
    content: [
      "Sound therapy works by providing your brain with alternative auditory input, reducing the prominence of tinnitus. There are several approaches, and CalmTinnitus offers multiple modes.",
      "The 'mixing point' principle: Set your therapy sound just loud enough that your tinnitus blends with it but is still faintly audible. This promotes habituation better than full masking.",
      "Consistency matters more than duration. Two 30-minute sessions daily is a good starting point. Some people prefer longer sessions or continuous background sound.",
      "Relief (CR) mode plays tones in a pattern designed to desynchronise overactive brain networks. The clicks and gaps are intentional. Stochastic Resonance (SR) mode shapes noise to your hearing profile at very quiet levels.",
      "You can use sound therapy while doing other activities — working, reading, watching TV. It doesn't require your full attention. In fact, passive listening is exactly the right approach.",
      "Results typically develop gradually over weeks to months. Most clinical trials show significant improvement at 3–6 months of regular use.",
    ],
  },
  {
    id: "stress-cycle",
    title: "The Stress–Tinnitus Cycle",
    icon: "😰",
    content: [
      "Tinnitus and stress have a bidirectional relationship. Stress can increase tinnitus perception, and tinnitus can cause stress — creating a cycle that amplifies both.",
      "When you're stressed, your brain's limbic system (the emotional centre) becomes more active. This increases vigilance and attention to perceived threats — including tinnitus.",
      "Cortisol (the stress hormone) can directly increase neural excitability in auditory areas, making tinnitus literally louder during stressful periods.",
      "Breaking the cycle doesn't require eliminating stress. Even small reductions in stress response — through breathing, mindfulness, or the MBCT exercises — can measurably reduce tinnitus perception.",
      "The 3-minute breathing space (available in the MBCT program) is designed as a quick 'circuit breaker' you can use whenever tinnitus spikes during the day.",
    ],
  },
  {
    id: "sleep-strategies",
    title: "Sleeping with Tinnitus",
    icon: "🌙",
    content: [
      "Sleep difficulty is one of the most common complaints among people with tinnitus. The quiet of bedtime makes tinnitus more noticeable, and the resulting anxiety can prevent sleep.",
      "Use low-level background sound throughout the night. CalmTinnitus Sleep Support mode is designed for this. Set the volume just loud enough to reduce the contrast with your tinnitus — not to fully mask it.",
      "Maintain consistent sleep and wake times. This strengthens your circadian rhythm and makes falling asleep easier regardless of tinnitus.",
      "Avoid silence in the bedroom. Even a fan or white noise machine can help. The goal is a comfortable sound floor, not complete masking.",
      "If you notice yourself monitoring your tinnitus while trying to sleep, the MBCT acceptance practices can help. The paradox is that trying to not hear your tinnitus keeps you focused on it.",
      "Reduce screen time for 30 minutes before bed, limit caffeine after midday, and consider a brief relaxation exercise or body scan before sleep.",
    ],
  },
];

// --- COMPONENT ---
function PTMInner() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState<"menu" | "screening" | "results" | "education">("menu");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [openModule, setOpenModule] = useState<string | null>(null);

  // Load previous score
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("calmtinnitus_ptm_score");
      if (saved) setPreviousScore(Number(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else signInAnonymously().catch(() => {});
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const submitScreening = () => {
    const totalPossible = TFI_QUESTIONS.length * 10;
    const rawSum = Object.values(answers).reduce((a, b) => a + b, 0);
    const normalized = Math.round((rawSum / totalPossible) * 100);
    setScore(normalized);
    try {
      window.localStorage.setItem("calmtinnitus_ptm_score", String(normalized));
      window.localStorage.setItem("calmtinnitus_ptm_date", new Date().toISOString());
    } catch {}
    setView("results");
  };

  const getLevel = (s: number): PTMLevel => {
    if (s <= 17) return PTM_LEVELS[0];
    if (s <= 31) return PTM_LEVELS[1];
    if (s <= 53) return PTM_LEVELS[2];
    if (s <= 72) return PTM_LEVELS[3];
    return PTM_LEVELS[4];
  };

  const level = score !== null ? getLevel(score) : null;

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/therapy" style={{ color: "#0ea5e9", textDecoration: "none", fontSize: "0.9rem" }}>
          ← Back to Therapy
        </Link>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0.5rem 0 0.25rem" }}>
          Education Library
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
          Understanding tinnitus, habituation, sound therapy &amp; sleep
        </p>
      </div>

      {/* MENU VIEW — Education only */}
      {view === "menu" && (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <button
            onClick={() => setView("education")}
            style={{
              display: "flex", alignItems: "center", gap: "1rem", textAlign: "left", width: "100%",
              background: "linear-gradient(135deg, #0ea5e9, #0891b2)", color: "white",
              border: "none", padding: "1.25rem", borderRadius: "0.75rem", cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "1.8rem" }}>📖</span>
            <div>
              <strong style={{ fontSize: "1.05rem" }}>Browse Education Topics</strong>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                Learn about tinnitus, habituation, sound therapy, stress and sleep strategies
              </p>
            </div>
          </button>
        </div>
      )}

      {/* SCREENING VIEW */}
      {view === "screening" && (
        <div>
          <button
            onClick={() => setView("menu")}
            style={{ background: "none", border: "none", color: "#0ea5e9", cursor: "pointer", padding: 0, marginBottom: "1rem", fontSize: "0.9rem" }}
          >
            ← Back
          </button>

          {/* Progress bar */}
          <div style={{ background: "#e2e8f0", borderRadius: "99px", height: "8px", marginBottom: "1.5rem" }}>
            <div style={{
              background: "#0ea5e9",
              borderRadius: "99px",
              height: "100%",
              width: `${((currentQ + 1) / TFI_QUESTIONS.length) * 100}%`,
              transition: "width 0.3s",
            }} />
          </div>

          <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>
            Question {currentQ + 1} of {TFI_QUESTIONS.length} — {TFI_QUESTIONS[currentQ].domain}
          </div>

          <h2 style={{ fontSize: "1.1rem", color: "#0f172a", marginBottom: "1.5rem", lineHeight: 1.5 }}>
            {TFI_QUESTIONS[currentQ].question}
          </h2>

          <div style={{ marginBottom: "1.5rem" }}>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={answers[TFI_QUESTIONS[currentQ].id] ?? 5}
              onChange={(e) => setAnswers({ ...answers, [TFI_QUESTIONS[currentQ].id]: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#0ea5e9" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>
              <span>{TFI_QUESTIONS[currentQ].id === "q2" ? "Never in control" : "Not at all"}</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
                {answers[TFI_QUESTIONS[currentQ].id] ?? 5}
              </span>
              <span>{TFI_QUESTIONS[currentQ].id === "q2" ? "Always in control" : "Extremely"}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {currentQ > 0 && (
              <button
                onClick={() => setCurrentQ((q) => q - 1)}
                style={{
                  flex: 1, background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "0.8rem",
                  borderRadius: "0.75rem", cursor: "pointer", fontWeight: 600, color: "#475569",
                }}
              >
                ← Previous
              </button>
            )}
            {currentQ < TFI_QUESTIONS.length - 1 ? (
              <button
                onClick={() => {
                  if (answers[TFI_QUESTIONS[currentQ].id] === undefined) {
                    setAnswers({ ...answers, [TFI_QUESTIONS[currentQ].id]: 5 });
                  }
                  setCurrentQ((q) => q + 1);
                }}
                style={{
                  flex: 1, background: "#0ea5e9", color: "white", border: "none", padding: "0.8rem",
                  borderRadius: "0.75rem", cursor: "pointer", fontWeight: 600, fontSize: "1rem",
                }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={submitScreening}
                style={{
                  flex: 1, background: "#22c55e", color: "white", border: "none", padding: "0.8rem",
                  borderRadius: "0.75rem", cursor: "pointer", fontWeight: 700, fontSize: "1rem",
                }}
              >
                ✓ See Results
              </button>
            )}
          </div>
        </div>
      )}

      {/* RESULTS VIEW */}
      {view === "results" && level && score !== null && (
        <div>
          <button
            onClick={() => setView("menu")}
            style={{ background: "none", border: "none", color: "#0ea5e9", cursor: "pointer", padding: 0, marginBottom: "1rem", fontSize: "0.9rem" }}
          >
            ← Back to hub
          </button>

          <div style={{
            background: `linear-gradient(135deg, ${level.color}, ${level.color}cc)`,
            color: "white",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "3rem", fontWeight: 800 }}>{score}</div>
            <div style={{ fontSize: "1rem", fontWeight: 600 }}>{level.severity}</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "0.25rem" }}>
              PTM Level {level.level}: {level.name}
            </div>
          </div>

          <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            {level.description}
          </p>

          <h3 style={{ color: "#0f172a", margin: "0 0 0.75rem", fontSize: "1rem" }}>
            Recommended Actions
          </h3>
          <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {level.recommendations.map((rec, idx) => (
              <div key={idx} style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                padding: "0.75rem",
                fontSize: "0.88rem",
                color: "#334155",
                display: "flex",
                gap: "0.5rem",
              }}>
                <span style={{ color: level.color, fontWeight: 700 }}>•</span>
                {rec}
              </div>
            ))}
          </div>

          <h3 style={{ color: "#0f172a", margin: "0 0 0.75rem", fontSize: "1rem" }}>
            Resources for You
          </h3>
          <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {level.resources.map((res, idx) =>
              res.link ? (
                <Link key={idx} href={res.link} style={{
                  background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem",
                  padding: "0.75rem", textDecoration: "none", color: "inherit", display: "block",
                }}>
                  <strong style={{ color: "#0ea5e9", fontSize: "0.9rem" }}>{res.title} →</strong>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "#64748b" }}>{res.description}</p>
                </Link>
              ) : (
                <div key={idx} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "0.75rem" }}>
                  <strong style={{ color: "#0f172a", fontSize: "0.9rem" }}>{res.title}</strong>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "#64748b" }}>{res.description}</p>
                </div>
              )
            )}
          </div>

          <div style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "0.75rem",
            padding: "0.75rem",
            fontSize: "0.82rem",
            color: "#0c4a6e",
          }}>
            <strong>Note:</strong> This screening is informational and based on your self-reported responses. It is not a clinical diagnosis. If your tinnitus is causing significant distress, please consult a qualified healthcare professional.
          </div>
        </div>
      )}

      {/* EDUCATION VIEW */}
      {view === "education" && (
        <div>
          <button
            onClick={() => { setView("menu"); setOpenModule(null); }}
            style={{ background: "none", border: "none", color: "#0ea5e9", cursor: "pointer", padding: 0, marginBottom: "1rem", fontSize: "0.9rem" }}
          >
            ← Back
          </button>

          <h2 style={{ fontSize: "1.2rem", color: "#0f172a", marginBottom: "1rem" }}>
            Understanding Tinnitus
          </h2>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {EDUCATION_MODULES.map((mod) => (
              <div key={mod.id}>
                <button
                  onClick={() => setOpenModule(openModule === mod.id ? null : mod.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "left", width: "100%",
                    background: openModule === mod.id ? "#f0f9ff" : "white",
                    border: openModule === mod.id ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
                    padding: "1rem", borderRadius: "0.75rem", cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{mod.icon}</span>
                  <strong style={{ color: "#0f172a" }}>{mod.title}</strong>
                  <span style={{ marginLeft: "auto", color: "#94a3b8" }}>{openModule === mod.id ? "▾" : "▸"}</span>
                </button>
                {openModule === mod.id && (
                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderTop: "none",
                    borderRadius: "0 0 0.75rem 0.75rem",
                    padding: "1rem",
                  }}>
                    {mod.content.map((para, idx) => (
                      <p key={idx} style={{ color: "#334155", fontSize: "0.9rem", lineHeight: 1.65, margin: idx === mod.content.length - 1 ? 0 : "0 0 0.75rem" }}>
                        {para}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer variant="full" />
    </main>
  );
}

export default function PTMPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading...</div>;
  return <PTMInner />;
}
