"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getTherapySessions,
  TherapySession,
} from "@/lib/therapyStorage";

// [NEW] Shared key for localStorage
const SESSION_LOG_KEY = "calmtinnitus_session_logs_v1";

// Helpers
function formatDate(ts: Date | string) {
  const dateObj = typeof ts === "string" ? new Date(ts) : ts;
  return dateObj.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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
    const y = 100 - normalized * 100;
    points.push({ x, y });
  });
  return points;
}

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Load from localStorage immediately (robust to old formats)
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(SESSION_LOG_KEY);
        if (raw) {
          let parsed: any = JSON.parse(raw);
          let asArray: TherapySession[] = [];

          if (Array.isArray(parsed)) {
            asArray = parsed as TherapySession[];
          } else if (parsed && typeof parsed === "object") {
            // support older single-object format
            asArray = [parsed as TherapySession];
          }

          if (asArray.length > 0) {
            setSessions(asArray);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to load session logs from storage", err);
      }
    }

    // 2. Auth & Firebase check (Optional / Background sync)
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          // make sure we have an anonymous user
          const cred = await signInAnonymously(auth);
          u = cred.user;
        }
        setUser(u);

        // Only try fetching firebase if we don't have local logs yet
        // or you can merge them. For now, we prioritize local logs
        // to ensure the user sees their data instantly.
        if (sessions.length === 0) {
          const data = await getTherapySessions(u.uid);
          if (data && data.length > 0) {
            setSessions(data);
          }
        }
      } catch (err) {
        console.error("Failed to load sessions from Firebase", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const points = buildChartPoints(sessions);

  return (
    <main className="hist-container">
      <div className="hist-inner">
        <header className="hist-header">
          <h1>Therapy History &amp; Progress</h1>
          <p>
            Review your CalmTinnitus sessions, track changes in tinnitus
            loudness, and see which sounds work best for you.
          </p>
          <p className="hist-note">
            Improvement is usually gradual. Many people need regular sessions
            over <strong>3–12 months</strong> before they notice meaningful
            change.
          </p>
        </header>

        {/* Graph card */}
        <section className="hist-card">
          <div className="hist-card-header">
            <div>
              <h2>Tinnitus Loudness Over Time</h2>
              <p className="hist-sub">
                Each point is one session (0–10 scale). Lower is better.
              </p>
            </div>
          </div>

          {loading && (
            <p className="hist-muted">Loading your sessions…</p>
          )}

          {!loading && !sessions.length && (
            <p className="hist-muted">
              No sessions saved yet. After you finish a session and save the
              log, it will appear here.
            </p>
          )}

          {!!points.length && (
            <>
              <div className="hist-graph-wrap">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="hist-graph"
                >
                  {/* grid */}
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
                  {/* line */}
                  <polyline
                    points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                    stroke="#0ea5e9"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* dots */}
                  {points.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={p.x}
                      cy={p.y}
                      r={1.2}
                      fill="#0ea5e9"
                    />
                  ))}
                </svg>
              </div>
              <p className="hist-footnote">
                Tip: look at the{" "}
                <strong>overall trend across many weeks</strong>, not single
                days. Tinnitus naturally goes up and down.
              </p>
            </>
          )}
        </section>

        {/* Table card */}
        <section className="hist-card">
          <div className="hist-card-header">
            <h2>Session Log</h2>
            <p className="hist-sub">
              Each row is one therapy session with your notes – useful later for
              statistics and monetization.
            </p>
          </div>

          {!loading && !sessions.length && (
            <p className="hist-muted">You have no saved sessions yet.</p>
          )}

          {!!sessions.length && (
            <div className="hist-table-wrap">
              <table className="hist-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Sound</th>
                    <th>Duration</th>
                    <th>Loudness (Before → After)</th>
                    <th>Relief</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions
                    .slice()
                    .reverse()
                    .map((s) => {
                      // Robust date handling for both Firestore Timestamps and LocalStorage ISO Strings
                      let d: Date;
                      if (typeof s.createdAt === "string") {
                        d = new Date(s.createdAt);
                      } else if ((s.createdAt as any).toDate) {
                        d = (s.createdAt as any).toDate();
                      } else {
                        d = new Date((s.createdAt as any).seconds * 1000);
                      }

                      return (
                        <tr key={s.id}>
                          <td>{formatDate(d)}</td>
                          <td>{s.mode}</td>
                          <td>{s.backgroundSound || "none"}</td>
                          <td>{s.durationMinutes.toFixed(1)} min</td>
                          <td>
                            {s.perceivedLoudnessBefore ?? "-"} →{" "}
                            {s.perceivedLoudnessAfter ?? "-"}
                          </td>
                          <td>
                            {typeof s.reliefScore === "number"
                              ? `${s.reliefScore}/10`
                              : "-"}
                          </td>
                          <td className="hist-notes">
                            {s.notes || ""}
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

      <HistoryStyle />
    </main>
  );
}

function HistoryStyle() {
  return (
    <style>{`
      .hist-container {
        min-height: 100vh;
        background: #f8fafc;
        padding: 2rem 1rem 3rem;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #0f172a;
      }
      .hist-inner {
        max-width: 960px;
        margin: 0 auto;
      }
      .hist-header h1 {
        margin: 0 0 0.5rem;
        font-size: 1.75rem;
      }
      .hist-header p {
        margin: 0.25rem 0;
        font-size: 0.9rem;
        color: #475569;
      }
      .hist-note {
        font-size: 0.8rem;
        color: #64748b;
      }
      .hist-card {
        background: #ffffff;
        margin-top: 1.5rem;
        padding: 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06);
        border: 1px solid #e2e8f0;
      }
      .hist-card-header h2 {
        margin: 0 0 0.25rem;
        font-size: 1.05rem;
      }
      .hist-sub {
        margin: 0;
        font-size: 0.8rem;
        color: #64748b;
      }
      .hist-muted {
        font-size: 0.85rem;
        color: #94a3b8;
        margin-top: 0.75rem;
      }
      .hist-graph-wrap {
        margin-top: 1rem;
        background: #0f172a;
        border-radius: 0.75rem;
        border: 1px solid #1e293b;
        padding: 0.5rem;
      }
      .hist-graph {
        width: 100%;
        height: 200px;
        display: block;
      }
      .hist-footnote {
        margin-top: 0.75rem;
        font-size: 0.8rem;
        color: #64748b;
      }
      .hist-table-wrap {
        margin-top: 1rem;
        overflow-x: auto;
      }
      .hist-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8rem;
      }
      .hist-table thead {
        background: #f1f5f9;
      }
      .hist-table th,
      .hist-table td {
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid #e2e8f0;
        text-align: left;
        vertical-align: top;
      }
      .hist-table th {
        font-weight: 600;
        color: #475569;
        font-size: 0.75rem;
      }
      .hist-table tbody tr:hover {
        background: #f8fafc;
      }
      .hist-notes {
        max-width: 260px;
        white-space: pre-wrap;
      }
      @media (max-width: 640px) {
        .hist-container {
          padding: 1.5rem 0.75rem 2.5rem;
        }
        .hist-card {
          padding: 1.25rem;
        }
        .hist-header h1 {
          font-size: 1.4rem;
        }
      }
    `}</style>
  );
}
