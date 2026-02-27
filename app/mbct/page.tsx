// FILE: /app/mbct/page.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, signInAnonymously } from "@/lib/firebase";
import Link from "next/link";
import Footer from "@/components/Footer";

// --- MBCT 8-WEEK PROGRAM DATA ---
type Exercise = {
  id: string;
  title: string;
  duration: string;
  durationSec: number;
  type: "body-scan" | "breath" | "tinnitus-focus" | "acceptance" | "reflection";
  script: string[];
};

type Week = {
  week: number;
  title: string;
  theme: string;
  description: string;
  exercises: Exercise[];
};

const MBCT_PROGRAM: Week[] = [
  {
    week: 1,
    title: "Arriving & Awareness",
    theme: "Automatic pilot",
    description:
      "This week introduces present-moment awareness. You'll learn to notice when your mind is on 'automatic pilot' — reacting to tinnitus without conscious awareness.",
    exercises: [
      {
        id: "w1e1",
        title: "Breath Anchor",
        duration: "5 min",
        durationSec: 300,
        type: "breath",
        script: [
          "Find a comfortable position and gently close your eyes.",
          "Bring your attention to the sensation of breathing. Notice the air entering and leaving your nostrils.",
          "You don't need to change your breathing — just notice it as it is.",
          "When your mind wanders — to tinnitus, to thoughts, to sounds around you — that's completely normal. Simply notice where it went, and gently guide it back to the breath.",
          "Each time you notice your mind has wandered, that is a moment of awareness. That is the practice.",
          "Continue breathing naturally for the next few minutes, returning to the breath each time your attention drifts.",
        ],
      },
      {
        id: "w1e2",
        title: "Body Scan — Upper Body",
        duration: "8 min",
        durationSec: 480,
        type: "body-scan",
        script: [
          "Lie down or sit comfortably. Close your eyes if that feels right.",
          "Bring your attention to the top of your head. Notice any sensations there — warmth, tingling, pressure, or nothing at all. All are fine.",
          "Slowly move your awareness down to your forehead, your eyes, your jaw. Notice if you're holding any tension. You don't need to change it — just notice.",
          "Now bring awareness to your neck and shoulders. These areas often hold stress. Breathe into any tightness you find there.",
          "Move down through your arms to your fingertips. Notice sensations of warmth, weight, or tingling.",
          "If tinnitus draws your attention at any point, acknowledge it: 'There's the tinnitus.' Then gently return to the body part you were exploring.",
          "Rest here for a moment, feeling your whole upper body at once.",
        ],
      },
    ],
  },
  {
    week: 2,
    title: "Living in Our Heads",
    theme: "Thoughts are not facts",
    description:
      "This week explores how thinking about tinnitus differs from experiencing it directly. You'll practice stepping back from thoughts and observing them without getting caught up.",
    exercises: [
      {
        id: "w2e1",
        title: "Thought Labelling",
        duration: "6 min",
        durationSec: 360,
        type: "acceptance",
        script: [
          "Settle into a comfortable position. Take three slow, deep breaths.",
          "Now let your breathing return to its natural rhythm and simply sit with open awareness.",
          "As thoughts arise — about tinnitus, about your day, about anything — try silently labelling them. 'There's a thought about tinnitus.' 'There's a worry.' 'There's a memory.'",
          "You're not trying to stop thoughts. You're practicing seeing them as mental events rather than facts that need your attention.",
          "If a thought pulls you in, that's fine. The moment you realise you've been pulled in is the moment of waking up. Label it gently and return to watching.",
          "Notice: the tinnitus sound is one thing. Your thoughts about it are another. This week, we practise separating the two.",
        ],
      },
      {
        id: "w2e2",
        title: "Sounds & Silence Meditation",
        duration: "7 min",
        durationSec: 420,
        type: "tinnitus-focus",
        script: [
          "Sit quietly and close your eyes.",
          "Open your awareness to all the sounds around you — near and far. Traffic, birds, appliances, your own breathing.",
          "Notice how sounds arise, stay for a while, and pass away. They come and go without any effort from you.",
          "Now include your tinnitus in this field of sounds. It's another sound in the landscape. It doesn't need a different reaction than any other sound.",
          "Practise holding all sounds equally — external and internal — without preference or resistance.",
          "If you notice yourself tensing against the tinnitus, soften. Imagine the sound floating on a wide, open space of awareness.",
          "Rest in this open listening for the remaining time.",
        ],
      },
    ],
  },
  {
    week: 3,
    title: "Gathering the Scattered Mind",
    theme: "Mindful movement & body",
    description:
      "This week adds gentle movement and full body awareness. Learning to anchor attention in the body reduces the mind's tendency to fixate on tinnitus.",
    exercises: [
      {
        id: "w3e1",
        title: "Full Body Scan",
        duration: "12 min",
        durationSec: 720,
        type: "body-scan",
        script: [
          "Lie down comfortably. Let your body be supported by the surface beneath you.",
          "Starting at the soles of your feet, bring a gentle curiosity to the sensations there. Tingling, warmth, contact with your socks or the floor.",
          "Slowly scan upward through your ankles, calves, knees, and thighs. Breathing into each area as you arrive.",
          "Move through your hips, lower back, and abdomen. Notice the gentle rise and fall of your belly with each breath.",
          "Continue up through your chest, upper back, and shoulders. Let each area soften as you notice it.",
          "Scan through your arms, hands, and fingers.",
          "Now move to your neck, face, and the top of your head.",
          "If tinnitus pulls your attention, treat it the same way: notice it, acknowledge it, and return to the body scan. It's one sensation among many.",
          "Finally, expand your awareness to feel your whole body at once — breathing, alive, and present.",
        ],
      },
      {
        id: "w3e2",
        title: "Mindful Stretching",
        duration: "5 min",
        durationSec: 300,
        type: "body-scan",
        script: [
          "Stand comfortably. Feel your feet on the ground.",
          "Slowly raise your arms overhead, noticing every sensation as they rise. The stretch in your sides, the effort in your shoulders.",
          "Hold at the top and breathe. Notice what your body feels like in this stretch.",
          "Lower your arms slowly, paying attention to the changing sensations as you return.",
          "Roll your shoulders gently — forward, then backward. Notice the small muscles working.",
          "Tilt your head gently to each side, stretching your neck. Breathe into the stretch.",
          "The purpose is not the stretch itself — it's the quality of attention you bring to it.",
        ],
      },
    ],
  },
  {
    week: 4,
    title: "Recognising Aversion",
    theme: "Relating differently to tinnitus",
    description:
      "The midpoint of the program. This week directly addresses the natural aversion to tinnitus and practises a different relationship with the sound — one of allowing rather than fighting.",
    exercises: [
      {
        id: "w4e1",
        title: "Tinnitus Approach Meditation",
        duration: "10 min",
        durationSec: 600,
        type: "tinnitus-focus",
        script: [
          "Sit comfortably. Begin with a few breaths to settle.",
          "Now, deliberately bring your attention to your tinnitus. Not to fight it, not to wish it away — just to observe it as a scientist might observe a phenomenon.",
          "What does it actually sound like right now? Is it high or low? Does it have texture? Is it steady or does it shift?",
          "Notice any emotions that arise as you pay attention. Frustration? Anxiety? Sadness? Name them gently: 'There's frustration.' Let the emotion be there alongside the sound.",
          "Now imagine creating space around the tinnitus. As if the sound is sitting in a vast, open room. It's there, but it doesn't fill the whole room.",
          "Practise softening your body — especially your jaw, shoulders, and belly — as you hold the tinnitus in awareness.",
          "You're not trying to make it go away. You're practising being with it without the struggle. That shift — from fighting to allowing — is what reduces suffering.",
          "Rest here for the remaining time, breathing gently, allowing the sound to be present without resistance.",
        ],
      },
      {
        id: "w4e2",
        title: "Breathing Space — 3-Minute",
        duration: "3 min",
        durationSec: 180,
        type: "breath",
        script: [
          "Step 1 — Awareness: What is happening right now? What thoughts are here? What feelings? What body sensations? Acknowledge them.",
          "Step 2 — Gathering: Now narrow your attention to just the breath. Feel each inhale and exhale. Let the breath be an anchor.",
          "Step 3 — Expanding: Widen your awareness again to include your whole body, your posture, your expression. Carry this wider awareness with you as you continue your day.",
        ],
      },
    ],
  },
  {
    week: 5,
    title: "Allowing & Letting Be",
    theme: "Acceptance practice",
    description:
      "Building on last week, this week deepens the practice of allowing difficult experiences — including tinnitus — without trying to fix or avoid them.",
    exercises: [
      {
        id: "w5e1",
        title: "Open Awareness Sitting",
        duration: "10 min",
        durationSec: 600,
        type: "acceptance",
        script: [
          "Sit with your eyes closed. Begin by feeling the breath for a minute.",
          "Now widen your awareness. Instead of focusing on one thing, be open to whatever arises — sounds, body sensations, thoughts, emotions.",
          "Imagine your awareness is like a wide sky, and experiences are like clouds passing through. Some are pleasant, some unpleasant. The sky doesn't push any cloud away.",
          "If tinnitus is prominent, let it be one cloud among many. If it's quiet, notice that too.",
          "When you find yourself narrowing onto something — fixating, worrying, analysing — gently widen back to open awareness.",
          "This practice builds the capacity to hold difficult experiences without being overwhelmed by them.",
          "Continue sitting in this open, receptive awareness for the remaining time.",
        ],
      },
      {
        id: "w5e2",
        title: "Difficulty Meditation",
        duration: "8 min",
        durationSec: 480,
        type: "acceptance",
        script: [
          "Settle into a comfortable position. Find the breath.",
          "Now bring to mind a moderately difficult situation or feeling — perhaps a moment when tinnitus felt particularly intrusive, or a stressful interaction.",
          "Notice where in your body you feel this difficulty. Tightness in the chest? Tension in the stomach? A clenching somewhere?",
          "Breathe into that area. On each exhale, imagine softening around the tension. Not removing it — softening around it.",
          "Say silently: 'It's okay. Whatever it is, it's already here. Let me feel it.'",
          "This practice teaches the mind that discomfort can be held with kindness rather than resistance.",
          "When you're ready, release the difficult situation and return to simply breathing.",
        ],
      },
    ],
  },
  {
    week: 6,
    title: "Thoughts Are Mental Events",
    theme: "Cognitive defusion",
    description:
      "This week practises seeing thoughts about tinnitus as passing mental events rather than truths that demand a response. This is the cognitive core of MBCT.",
    exercises: [
      {
        id: "w6e1",
        title: "Leaves on a Stream",
        duration: "8 min",
        durationSec: 480,
        type: "acceptance",
        script: [
          "Close your eyes and imagine you are sitting beside a gently flowing stream.",
          "As thoughts arise — any thought at all — place each one on a leaf and watch it float downstream. Don't try to speed it up or hold it back.",
          "If a thought about tinnitus appears ('It will never go away', 'I can't cope'), place it on a leaf just like any other thought. Watch it drift away.",
          "If you find yourself getting pulled into the stream — lost in a thought — that's fine. The moment you notice, you're back on the bank. Place that thought on a leaf too.",
          "Some leaves will carry worries. Some will carry plans. Some will carry judgments about whether you're doing this right. All go on leaves.",
          "The practice is not to empty the stream. It's to sit on the bank and watch, rather than being swept along.",
          "Continue for the remaining time. Each thought, a leaf. Each leaf, released.",
        ],
      },
      {
        id: "w6e2",
        title: "Reframing Practice",
        duration: "5 min",
        durationSec: 300,
        type: "reflection",
        script: [
          "Take a moment to notice a thought about your tinnitus that has been recurring. Write it down mentally or on paper.",
          "Now ask: 'Is this thought a fact, or is it an interpretation?' For example, 'My tinnitus is ruining my life' is an interpretation. 'I hear a ringing sound' is closer to a fact.",
          "Can you rephrase the thought in a more balanced way? Not positively — just more accurately. For instance: 'My tinnitus is difficult today, and there are also other things happening in my life.'",
          "Notice how the emotional charge changes when you hold the more balanced version.",
          "This isn't about positive thinking. It's about accurate thinking — seeing the full picture rather than the tinnitus-filtered version.",
        ],
      },
    ],
  },
  {
    week: 7,
    title: "How Can I Best Take Care of Myself?",
    theme: "Self-care & activity planning",
    description:
      "This week connects mindfulness to daily life. You'll identify activities that nourish you and those that deplete you, creating a self-care plan that supports tinnitus management.",
    exercises: [
      {
        id: "w7e1",
        title: "Nourishing & Depleting Activities",
        duration: "5 min",
        durationSec: 300,
        type: "reflection",
        script: [
          "Take a moment to reflect on your typical day.",
          "What activities give you energy, satisfaction, or a sense of accomplishment? These are nourishing activities. They might include walking, cooking, talking to a friend, or listening to music.",
          "What activities drain you, increase stress, or make tinnitus worse? These are depleting activities. They might include doom-scrolling, over-working, or sitting in silence focusing on the ringing.",
          "Can you add one more nourishing activity to tomorrow? Can you reduce or modify one depleting activity?",
          "This isn't about perfection. Small shifts in the balance between nourishing and depleting can meaningfully change how you experience your tinnitus day to day.",
        ],
      },
      {
        id: "w7e2",
        title: "Compassionate Body Scan",
        duration: "10 min",
        durationSec: 600,
        type: "body-scan",
        script: [
          "Lie down comfortably. This body scan adds an element of warmth and self-compassion.",
          "As you scan from feet to head, at each area, silently offer a phrase of kindness: 'May you be at ease.' 'May you be comfortable.'",
          "When you reach areas of tension or discomfort, spend extra time there. Breathe warmth into them.",
          "When you reach your head and ears, you might notice tinnitus more strongly. Offer the same compassion: 'This is difficult. May I be kind to myself in this difficulty.'",
          "The practice of self-compassion has been shown to reduce the distress component of tinnitus — the suffering layered on top of the sound itself.",
          "Rest in a sense of whole-body kindness for the remaining time.",
        ],
      },
    ],
  },
  {
    week: 8,
    title: "Maintaining & Extending",
    theme: "Building a lasting practice",
    description:
      "The final week consolidates everything you've learned and helps you build a sustainable daily practice for long-term tinnitus management.",
    exercises: [
      {
        id: "w8e1",
        title: "Complete Sitting Practice",
        duration: "15 min",
        durationSec: 900,
        type: "tinnitus-focus",
        script: [
          "This is your graduation meditation. Sit comfortably and close your eyes.",
          "Begin with breath awareness for a few minutes. Let the breath anchor you.",
          "Expand to a body scan — brief, moving through your body in a gentle sweep.",
          "Now open to sounds. Let all sounds — external and tinnitus — be part of your field of awareness.",
          "Shift to open awareness — thoughts, feelings, sensations, sounds, all held equally.",
          "If at any point something becomes difficult, return to the breath. It's always there as your anchor.",
          "Over these eight weeks, you've built a new way of relating to your tinnitus. Not a cure — but a fundamentally different relationship with it.",
          "The tinnitus may still be there. But the struggle around it, the fear, the frustration — these can soften. That softening is real and meaningful progress.",
          "Continue sitting in open awareness. You know how to do this now. Trust your practice.",
        ],
      },
      {
        id: "w8e2",
        title: "Your Personal Practice Plan",
        duration: "5 min",
        durationSec: 300,
        type: "reflection",
        script: [
          "Take a moment to reflect on the past seven weeks.",
          "Which exercises resonated most with you? Which felt most helpful on difficult tinnitus days?",
          "Design a realistic daily practice. It might be as simple as: 3-minute breathing space in the morning, one longer practice (10–15 min) in the evening, and a compassionate body scan when tinnitus spikes.",
          "Remember: consistency matters more than duration. Five minutes every day is better than thirty minutes once a week.",
          "You now have a toolkit. The practices are yours to use whenever you need them. Your relationship with tinnitus can continue to evolve.",
        ],
      },
    ],
  },
];

// --- COMPONENT ---
function MBCTInner() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [scriptStep, setScriptStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Track completed exercises
  const [completed, setCompleted] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("calmtinnitus_mbct_completed");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "calmtinnitus_mbct_completed",
        JSON.stringify(completed)
      );
    } catch {}
  }, [completed]);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else signInAnonymously().catch(() => {});
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const startExercise = (exercise: Exercise) => {
    setActiveExercise(exercise);
    setScriptStep(0);
    setTimeRemaining(exercise.durationSec);
    setIsPlaying(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
          setCompleted((c) => {
            if (c.indexOf(exercise.id) === -1) return c.concat(exercise.id);
            return c;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopExercise = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
    setActiveExercise(null);
    setScriptStep(0);
    setTimeRemaining(0);
  };

  const nextStep = () => {
    if (activeExercise && scriptStep < activeExercise.script.length - 1) {
      setScriptStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (scriptStep > 0) setScriptStep((s) => s - 1);
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const typeIcons: Record<Exercise["type"], string> = {
    "body-scan": "🧘",
    breath: "🌬️",
    "tinnitus-focus": "🎯",
    acceptance: "🌊",
    reflection: "📝",
  };

  const week = selectedWeek !== null ? MBCT_PROGRAM[selectedWeek] : null;

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/therapy" style={{ color: "#0ea5e9", textDecoration: "none", fontSize: "0.9rem" }}>
          ← Back to Therapy
        </Link>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0.5rem 0 0.25rem" }}>
          Mindfulness for Tinnitus
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
          8-week MBCT program — clinically proven to reduce tinnitus distress
        </p>
      </div>

      {/* Active exercise overlay */}
      {activeExercise && (
        <div style={{
          background: "linear-gradient(135deg, #065f46, #0f766e)",
          color: "white",
          borderRadius: "1rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>{typeIcons[activeExercise.type]} {activeExercise.type.replace("-", " ")}</div>
              <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.2rem" }}>{activeExercise.title}</h2>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800 }}>{formatTime(timeRemaining)}</div>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            marginBottom: "1rem",
            minHeight: "120px",
            fontSize: "1rem",
            lineHeight: 1.6,
          }}>
            {activeExercise.script[scriptStep]}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
            <span>Step {scriptStep + 1} of {activeExercise.script.length}</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={prevStep}
                disabled={scriptStep === 0}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "0.4rem 1rem", borderRadius: "99px", cursor: "pointer", opacity: scriptStep === 0 ? 0.4 : 1 }}
              >
                ← Prev
              </button>
              <button
                onClick={nextStep}
                disabled={scriptStep >= activeExercise.script.length - 1}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "0.4rem 1rem", borderRadius: "99px", cursor: "pointer", opacity: scriptStep >= activeExercise.script.length - 1 ? 0.4 : 1 }}
              >
                Next →
              </button>
              <button
                onClick={stopExercise}
                style={{ background: "rgba(239,68,68,0.8)", border: "none", color: "white", padding: "0.4rem 1rem", borderRadius: "99px", cursor: "pointer" }}
              >
                ✕ End
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Week list or week detail */}
      {selectedWeek === null ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {MBCT_PROGRAM.map((w, idx) => {
            const weekExerciseIds = w.exercises.map((e) => e.id);
            const weekDone = weekExerciseIds.every((id) => completed.includes(id));
            const weekPartial = weekExerciseIds.some((id) => completed.includes(id));

            return (
              <button
                key={w.week}
                onClick={() => setSelectedWeek(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  textAlign: "left",
                  width: "100%",
                  background: weekDone ? "#f0fdf4" : "white",
                  border: weekDone ? "2px solid #86efac" : "1px solid #e2e8f0",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: weekDone ? "#22c55e" : weekPartial ? "#fbbf24" : "#e2e8f0",
                  color: weekDone || weekPartial ? "white" : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  flexShrink: 0,
                }}>
                  {weekDone ? "✓" : w.week}
                </div>
                <div>
                  <strong style={{ color: "#0f172a" }}>Week {w.week}: {w.title}</strong>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                    {w.theme}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Progress summary */}
          <div style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "0.75rem",
            padding: "1rem",
            textAlign: "center",
            marginTop: "0.5rem",
          }}>
            <strong>{completed.length}</strong> of{" "}
            <strong>{MBCT_PROGRAM.reduce((a, w) => a + w.exercises.length, 0)}</strong>{" "}
            exercises completed
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => { setSelectedWeek(null); setActiveExercise(null); }}
            style={{ background: "none", border: "none", color: "#0ea5e9", cursor: "pointer", padding: 0, marginBottom: "1rem", fontSize: "0.9rem" }}
          >
            ← All weeks
          </button>

          {week && (
            <>
              <div style={{
                background: "linear-gradient(135deg, #0ea5e9, #0891b2)",
                color: "white",
                borderRadius: "1rem",
                padding: "1.25rem",
                marginBottom: "1.5rem",
              }}>
                <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>Week {week.week}</div>
                <h2 style={{ margin: "0.25rem 0", fontSize: "1.3rem" }}>{week.title}</h2>
                <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.9 }}>{week.theme}</p>
              </div>

              <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                {week.description}
              </p>

              <div style={{ display: "grid", gap: "0.75rem" }}>
                {week.exercises.map((ex) => (
                  <div
                    key={ex.id}
                    style={{
                      background: completed.includes(ex.id) ? "#f0fdf4" : "white",
                      border: completed.includes(ex.id) ? "2px solid #86efac" : "1px solid #e2e8f0",
                      borderRadius: "0.75rem",
                      padding: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {typeIcons[ex.type]} {ex.type.replace("-", " ")} • {ex.duration}
                        </span>
                        <h3 style={{ margin: "0.25rem 0 0", fontSize: "1rem", color: "#0f172a" }}>
                          {ex.title} {completed.includes(ex.id) && "✅"}
                        </h3>
                      </div>
                      <button
                        onClick={() => startExercise(ex)}
                        disabled={isPlaying}
                        style={{
                          background: isPlaying ? "#94a3b8" : "#0ea5e9",
                          color: "white",
                          border: "none",
                          padding: "0.5rem 1.2rem",
                          borderRadius: "99px",
                          cursor: isPlaying ? "not-allowed" : "pointer",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                        }}
                      >
                        {isPlaying && activeExercise?.id === ex.id ? "Playing..." : "▶ Start"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <Footer variant="full" />
    </main>
  );
}

export default function MBCTPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading MBCT program...</div>;
  return <MBCTInner />;
}
