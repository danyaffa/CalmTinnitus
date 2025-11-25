// FILE: app/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase"; // ⚠️ ADJUST PATH
import {
  getTherapySessions,
  TherapySession,
} from "@/lib/therapyStorage";

// Simple helper to format dates
function formatDate(ts: Date) {
  return ts.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Build simple chart points for SVG (0–100% scaled)
function buildChartPoints(sessions: TherapySession[]) {
  const points: { x: number; y: number }[] = [];
  const values = sessions
    .map((s) => s.perceivedLoudnessAfter ?? s.perceivedLoudnessBefore)
    .filter((v) => typeof v === "number") as number[];

  if (!values.length) return points;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  sessions.forEach((s, index) => {
    const v =
      (s.perceivedLoudnessAfter ?? s.perceivedLoudnessBefore ?? minVal) as number;
    const normalized = (v - minVal) / range; // 0–1
    const x = (index / Math.max(1, sessions.length - 1)) * 100;
    const y = 100 - normalized * 100; // invert for SVG (0 at top)
    points.push({ x, y });
  });

  return points;
}

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const data = await getTherapySessions(u.uid);
        setSessions(data);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const points = buildChartPoints(sessions);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Therapy History & Progress</h1>
          <p className="text-sm text-slate-300">
            Here you can review your past CalmTinnitus sessions, track changes
            in your tinnitus loudness, and see which sounds worked best for you.
          </p>
          <p className="text-xs text-slate-400">
            Tinnitus neuromodulation and habituation are usually{" "}
            <span className="font-semibold">slow processes</span>. Many
            patients need regular sessions over{" "}
            <span className="font-semibold">
              several months (often 3–12 months)
            </span>{" "}
            before they notice meaningful improvement.
          </p>
        </header>

        {/* PROGRESS GRAPH */}
        <section className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Tinnitus Loudness Over Time</h2>
            <span className="text-xs text-slate-400">
              Lower is better (0–10 scale)
            </span>
          </div>

          {loading && (
            <p className="text-sm text-slate-400">Loading your sessions…</p>
          )}

          {!loading && !sessions.length && (
            <p className="text-sm text-slate-400">
              No sessions saved yet. After you finish a session and add your
              rating, it will appear here.
            </p>
          )}

          {!!points.length && (
            <div className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden p-2">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                {/* grid lines */}
                <polyline
                  points="0,0 100,0"
                  stroke="rgba(148,163,184,0.25)"
                  strokeWidth="0.3"
                />
                <polyline
                  points="0,50 100,50"
                  stroke="rgba(148,163,184,0.25)"
                  strokeWidth="0.3"
                />
                <polyline
                  points="0,100 100,100"
                  stroke="rgba(148,163,184,0.25)"
                  strokeWidth="0.3"
                />
                {/* graph line */}
                <polyline
                  points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                  stroke="rgba(56,189,248,1)"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* points */}
                {points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={1.2}
                    fill="rgba(56,189,248,1)"
                  />
                ))}
              </svg>
            </div>
          )}

          {!!points.length && (
            <p className="text-xs text-slate-400">
              Tip: focus on the{" "}
              <span className="font-semibold">overall trend</span> over many
              weeks, not single days. Tinnitus naturally fluctuates.
            </p>
          )}
        </section>

        {/* SESSION LIST WITH NOTES */}
        <section className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <h2 className="text-lg font-medium">Session Log</h2>
          <p className="text-xs text-slate-400">
            Each row is one therapy session. You can later use this for
            statistics and to see which sounds work best for you.
          </p>

          {!loading && !sessions.length && (
            <p className="text-sm text-slate-400">
              You have no saved sessions yet.
            </p>
          )}

          {!!sessions.length && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="border-b border-slate-700 text-slate-300">
                  <tr>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Mode</th>
                    <th className="py-2 pr-4">Sound</th>
                    <th className="py-2 pr-4">Duration</th>
                    <th className="py-2 pr-4">Loudness (Before → After)</th>
                    <th className="py-2 pr-4">Relief</th>
                    <th className="py-2 pr-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions
                    .slice()
                    .reverse()
                    .map((s) => {
                      const d = s.createdAt.toDate
                        ? s.createdAt.toDate()
                        : new Date((s.createdAt as any).seconds * 1000);
                      return (
                        <tr key={s.id} className="border-b border-slate-800">
                          <td className="py-1 pr-4">
                            {formatDate(d)}
                          </td>
                          <td className="py-1 pr-4">{s.mode}</td>
                          <td className="py-1 pr-4">
                            {s.backgroundSound || "none"}
                          </td>
                          <td className="py-1 pr-4">
                            {s.durationMinutes} min
                          </td>
                          <td className="py-1 pr-4">
                            {s.perceivedLoudnessBefore ?? "-"} →{" "}
                            {s.perceivedLoudnessAfter ?? "-"}
                          </td>
                          <td className="py-1 pr-4">
                            {typeof s.reliefScore === "number"
                              ? `${s.reliefScore}/10`
                              : "-"}
                          </td>
                          <td className="py-1 pr-4 max-w-xs">
                            <span className="line-clamp-3 text-slate-200">
                              {s.notes || ""}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
