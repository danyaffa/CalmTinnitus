// FILE: app/growth/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Footer from "../../components/Footer";

// ✔ FIXED IMPORTS (these were breaking your build)
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ReviewWidget } from "@/components/ReviewWidgets";

// --- CHECKLIST DATA ---
const STRATEGY_ITEMS = [
  {
    category: "ASO (App Store Optimization)",
    id: "aso_1",
    label: "Keywords in Title & Subtitle",
    desc: "Ensure 'Tinnitus', 'Relief', 'Calm', and 'Therapy' appear in your main App Store title/subtitle.",
  },
  {
    category: "ASO (App Store Optimization)",
    id: "aso_2",
    label: "Screenshots & Video Preview",
    desc: "Upload 5+ screenshots with large text captions explaining the benefit (not just UI).",
  },
  {
    category: "ASO (App Store Optimization)",
    id: "aso_3",
    label: "Get 10 Initial 5-Star Reviews",
    desc: "Use your Review Widget to ask friends/family first. Rating volume is the #1 ranking factor.",
  },
  {
    category: "Web SEO (Google Search)",
    id: "seo_1",
    label: "Submit Sitemap to Google Search Console",
    desc: "Ensure Google indexes your landing page so users find you when searching for cures.",
  },
  {
    category: "Web SEO (Google Search)",
    id: "seo_2",
    label: "Add FAQ Schema Markup",
    desc: "Add JSON-LD Schema to your home page so Google shows your FAQs directly in search results.",
  },
  {
    category: "AI Visibility (ChatGPT/Gemini)",
    id: "ai_1",
    label: "Clear 'About' Context for AI",
    desc: "Ensure your homepage clearly states: 'CalmTinnitus is an app for tinnitus relief using neuromodulation.' AI bots scrape this definition.",
  },
  {
    category: "AI Visibility (ChatGPT/Gemini)",
    id: "ai_2",
    label: "Publish 'Tinnitus Relief' Blog Content",
    desc: "Write articles about 'How to stop ringing in ears'. AI models reference high-authority content.",
  },
];

export default function GrowthDashboard() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // --- LOAD DATA FROM FIRESTORE ---
  useEffect(() => {
    // ✅ Critical fix: create a local reference so TS narrows correctly
    const dbi = db;
    if (!dbi) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        const docRef = doc(dbi, "internal_stats", "growth_checklist");
        const snap = await getDoc(docRef);
        if (cancelled) return;
        if (snap.exists()) setCompleted(snap.data() as any);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // --- TOGGLE ---
  const toggleItem = async (id: string) => {
    const newState = { ...completed, [id]: !completed[id] };
    setCompleted(newState);

    // ✅ Same TS-narrowing fix here
    const dbi = db;
    if (!dbi) {
      console.error("Firestore db is not initialized yet; cannot save checklist.");
      return;
    }

    try {
      await setDoc(doc(dbi, "internal_stats", "growth_checklist"), newState, {
        merge: true,
      });
    } catch (e) {
      console.error("Failed to save", e);
    }
  };

  const calculateProgress = () => {
    const done = Object.values(completed).filter(Boolean).length;
    return Math.round((done / STRATEGY_ITEMS.length) * 100);
  };

  // --- INLINE STYLES ---
  const styles = {
    page: {
      padding: 40,
      fontFamily: "sans-serif",
      background: "#f8fafc",
      minHeight: "100vh",
    },
    container: { maxWidth: 900, margin: "0 auto" },
    header: { marginBottom: 30 },
    title: {
      fontSize: 32,
      fontWeight: 800,
      color: "#0f172a",
      marginBottom: 10,
    },
    subtitle: { color: "#64748b", fontSize: 16 },
    progressCard: {
      background: "linear-gradient(135deg, #2563eb, #1e40af)",
      padding: 30,
      borderRadius: 20,
      color: "white",
      marginBottom: 40,
      boxShadow: "0 10px 30px rgba(37,99,235,0.3)",
    },
    progressTitle: {
      margin: 0,
      fontSize: 14,
      opacity: 0.8,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    progressValue: { fontSize: 48, fontWeight: 800, margin: "10px 0" },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 700,
      color: "#334155",
      marginTop: 40,
      marginBottom: 20,
      borderBottom: "2px solid #e2e8f0",
      paddingBottom: 10,
    },
    card: {
      background: "white",
      borderRadius: 12,
      padding: 20,
      marginBottom: 15,
      display: "flex",
      gap: 20,
      alignItems: "flex-start",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
      border: "1px solid #e2e8f0",
    },
    checkbox: {
      width: 24,
      height: 24,
      marginTop: 4,
      cursor: "pointer",
      accentColor: "#2563eb",
    },
    label: {
      fontSize: 16,
      fontWeight: 600,
      color: "#1e293b",
      marginBottom: 4,
    },
    desc: { fontSize: 14, color: "#64748b", lineHeight: 1.5 },
    categoryBadge: {
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      marginBottom: 8,
      backgroundColor: "#e0f2fe",
      color: "#0369a1",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>🚀 Growth & AI Command Center</h1>
          <p style={styles.subtitle}>
            Track your path to #1 in App Stores and AI Search.
          </p>
        </div>

        <div style={styles.progressCard}>
          <h3 style={styles.progressTitle}>Launch Readiness</h3>
          <div style={styles.progressValue}>
            {loading ? "..." : `${calculateProgress()}%`}
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.2)",
              height: 8,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${calculateProgress()}%`,
                height: "100%",
                background: "#4ade80",
                transition: "width 0.5s",
              }}
            />
          </div>
        </div>

        {[
          "ASO (App Store Optimization)",
          "Web SEO (Google Search)",
          "AI Visibility (ChatGPT/Gemini)",
        ].map((cat) => (
          <div key={cat}>
            <h2 style={styles.sectionTitle}>{cat}</h2>

            {STRATEGY_ITEMS.filter((i) => i.category === cat).map((item) => (
              <div
                key={item.id}
                style={{
                  ...styles.card,
                  opacity: completed[item.id] ? 0.6 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={!!completed[item.id]}
                  onChange={() => toggleItem(item.id)}
                  style={styles.checkbox}
                />
                <div>
                  <span style={styles.categoryBadge}>{item.category}</span>
                  <span
                    style={{
                      ...styles.label,
                      textDecoration: completed[item.id]
                        ? "line-through"
                        : "none",
                    }}
                  >
                    {item.label}
                  </span>
                  <p style={styles.desc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ))}

        <div
          style={{
            marginTop: 60,
            padding: 30,
            background: "#fff",
            borderRadius: 20,
            border: "1px dashed #cbd5e1",
            textAlign: "center",
          }}
        >
          <h3>Review Widget Tester</h3>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            This is how your widget looks to users. Test it here to ensure emails
            are firing.
          </p>

          <ReviewWidget
            appName="CalmTinnitus"
            feedbackEndpoint="/api/review-feedback"
          />
        </div>

        <Footer variant="minimal" />
      </div>
    </div>
  );
}
