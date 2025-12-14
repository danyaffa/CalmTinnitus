// FILE: /app/program/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getActiveEnrollment,
  createOrReplaceEnrollment,
  ProgramEnrollment,
  ProgramLengthDays,
  getDayNumber,
  getCheckInForDay,
  saveDailyCheckIn,
  getCheckInHistory,
  DailyCheckIn as DailyCheckInType,
} from "@/lib/program";

// DELETE: Chart.js imports and registration have been removed to fix Vercel build.

// --- TYPES & CONSTANTS ---
type CheckIn = Omit<
  DailyCheckInType,
  "userId" | "dayNumber" | "date" | "createdAt" | "updatedAt"
>;
type ViewMode = "dashboard" | "chart";

// Initial state for the check-in form
const initialCheckInState: CheckIn = {
  loudness: 5,
  stress: 5,
  sleepQuality: 5,
  minutesUsed: 30,
  notes: "",
};

// --- UTILITY: CSV DOWNLOADER ---
const downloadProgressData = (
  data: DailyCheckInType[],
  enrollment: ProgramEnrollment
) => {
  if (data.length === 0) return;

  const header =
    "Day,Date,Tinnitus Loudness (0-10),Stress (0-10),Sleep Quality (0-10),Minutes Used,Notes\n";

  const csvContent = data
    .map((item) => {
      const localDate = new Date(item.date).toLocaleDateString();
      return `${item.dayNumber},"${localDate}",${item.loudness},${item.stress},${item.sleepQuality},${item.minutesUsed},"${
        item.notes?.replace(/"/g, '""') || ""
      }"`;
    })
    .join("\n");

  const finalCsv = header + csvContent;
  const blob = new Blob([finalCsv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `CalmTinnitus_Progress_Program_${
    enrollment.lengthDays
  }days_${new Date(enrollment.startDate)
    .toLocaleDateString()
    .replace(/\//g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// -----------------------------------------------------
// ✅ PROGRESS CHART: PURE SVG (Dependency-free fix with points)
// -----------------------------------------------------
const ProgressChartPlaceholder = ({
  enrollment,
  onBack,
  userId,
}: {
  enrollment: ProgramEnrollment;
  onBack: () => void;
  userId: string;
}) => {
  const [chartHistory, setChartHistory] = useState<DailyCheckInType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const h = await getCheckInHistory(userId, enrollment.startDate);
        setChartHistory(Array.isArray(h) ? h : []);
      } catch (e) {
        console.error("Chart load failed:", e);
        setChartHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, enrollment.startDate]);

  // SVG helpers
  const W = 900,
    H = 320,
    L = 44,
    R = 16,
    T = 12,
    B = 32;

  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const y = (v: number) =>
    T + (1 - clamp01((Number(v) || 0) / 10)) * (H - T - B);
  const x = (i: number, n: number) =>
    n <= 1 ? L : L + (i / (n - 1)) * (W - L - R);

  const n = chartHistory.length;

  const loudVals = chartHistory.map((v) => Number(v.loudness) || 0);
  const stressVals = chartHistory.map((v) => Number(v.stress) || 0);
  const sleepVals = chartHistory.map((v) => Number(v.sleepQuality) || 0);

  const mkPts = (vals: number[]) =>
    vals.map((v, i) => ({ x: x(i, n), y: y(v) }));

  const loudPts = mkPts(loudVals);
  const stressPts = mkPts(stressVals);
  const sleepPts = mkPts(sleepVals);

  const ptsStr = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x},${p.y}`).join(" ");

  const labels = chartHistory.map((d) => `D${d.dayNumber}`);
  const hasData = !loading && n > 0;

  return (
    <div className="nq-panel nq-chart-view">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h2 className="nq-title" style={{ color: "#4f46e5" }}>
          Progress Chart: {enrollment.lengthDays} Days
        </h2>

        <button
          className="nq-btn-action"
          onClick={onBack}
          style={{
            background: "#f1f5f9",
            color: "#334155",
            border: "1px solid #e2e8f0",
            flex: "none",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      <p className="nq-subtitle">
        Loudness, Stress, Sleep Quality (0–10). Days tracked: {n}
      </p>

      <div
        style={{
          height: "360px",
          background: "#f8fafc",
          border: "1px dashed #cbd5e1",
          borderRadius: "0.5rem",
          padding: "0.75rem",
        }}
      >
        {loading ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Loading data for chart...
          </div>
        ) : !hasData ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            Your progress chart will appear as you complete daily check-ins.
          </div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
            {/* Grid lines (0..10) */}
            {[0, 2, 4, 6, 8, 10].map((v) => (
              <g key={v}>
                <line
                  x1={L}
                  y1={y(v)}
                  x2={W - R}
                  y2={y(v)}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text x={8} y={y(v) + 4} fontSize="14" fill="#64748b">
                  {v}
                </text>
              </g>
            ))}

            {/* X-axis baseline */}
            <line
              x1={L}
              y1={H - B}
              x2={W - R}
              y2={H - B}
              stroke="#cbd5e1"
              strokeWidth="1"
            />

            {/* X labels (every ~3 points) */}
            {labels.map((lab, i) => {
              const step = Math.max(1, Math.floor(n / 8));
              if (i % step !== 0 && i !== n - 1) return null;
              return (
                <text
                  key={lab + i}
                  x={x(i, n)}
                  y={H - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#64748b"
                >
                  {lab}
                </text>
              );
            })}

            {/* Lines */}
            <polyline
              points={ptsStr(loudPts)}
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={ptsStr(stressPts)}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={ptsStr(sleepPts)}
              fill="none"
              stroke="#16a34a"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* ✅ POINTS (for single-day visibility) */}
            {loudPts.map((p, i) => (
              <circle
                key={"l" + i}
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="2"
              />
            ))}
            {stressPts.map((p, i) => (
              <circle
                key={"s" + i}
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="2"
              />
            ))}
            {sleepPts.map((p, i) => (
              <circle
                key={"q" + i}
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#16a34a"
                stroke="#ffffff"
                strokeWidth="2"
              />
            ))}

            {/* Legend */}
            <g>
              <rect x={L} y={T} width="12" height="12" fill="#2563eb" />
              <text x={L + 18} y={T + 11} fontSize="14" fill="#0f172a">
                Loudness
              </text>

              <rect x={L + 120} y={T} width="12" height="12" fill="#ef4444" />
              <text x={L + 138} y={T + 11} fontSize="14" fill="#0f172a">
                Stress
              </text>

              <rect x={L + 220} y={T} width="12" height="12" fill="#16a34a" />
              <text x={L + 238} y={T + 11} fontSize="14" fill="#0f172a">
                Sleep
              </text>
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};


// --- TIPS COMPONENT ---
const TipsInfo = () => (
  <div
    className="nq-info-box"
    style={{
      background: "#fffbeb",
      border: "1px solid #fcd34d",
      color: "#92400e",
      marginTop: "1.5rem",
      marginBottom: "0.5rem",
    }}
  >
    <h4
      style={{
        margin: "0 0 0.5rem",
        fontSize: "1rem",
        fontWeight: 700,
        color: "#92400e",
      }}
    >
      ⚠️ Quick Tinnitus Management Tips
    </h4>
    <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem" }}>
      If you are noticing a trend of **increased loudness or stress**, consider
      these steps:
    </p>
    <ul style={{ margin: "0", paddingLeft: "1.25rem", fontSize: "0.85rem" }}>
      <li style={{ marginBottom: "0.25rem" }}>
        **Volume Check:** Reduce the **Therapy Tone Volume** slightly on the
        Therapy Dashboard. The sound should be soft enough to ignore.
      </li>
      <li style={{ marginBottom: "0.25rem" }}>
        **Caffeine/Stimulants:** Temporarily reduce caffeine or alcohol intake,
        as these can sometimes contribute to tinnitus perception.
      </li>
      <li style={{ marginBottom: "0.25rem" }}>
        **Screen Time:** Turn off screens (TV, phone) at least 30 minutes before
        sleep to help reduce mental stress.
      </li>
      <li>
        **Relaxation:** Practice mindful breathing or gentle stretches,
        especially before starting a therapy session.
      </li>
    </ul>
    <p
      style={{
        marginTop: "0.75rem",
        marginBottom: "0",
        borderTop: "1px solid #fde68a",
        paddingTop: "0.5rem",
        fontWeight: 600,
        fontSize: "0.8rem",
        color: "#b45309",
      }}
    >
      *If your tinnitus persists, worsens suddenly, or causes strong distress,
      please consult with your auditory health professional.*
    </p>
  </div>
);

// -----------------------------------------------------
// Check-In Modal Component
// -----------------------------------------------------
const CheckInModal = ({
  dayNumber,
  initialData,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  dayNumber: number;
  initialData: CheckIn;
  onSubmit: (data: CheckIn) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) => {
  const [form, setForm] = useState<CheckIn>(initialData);

  // FIX: range inputs must be converted to numbers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target as any;
    const inputType = (e.target as HTMLInputElement).type;

    const shouldBeNumber = inputType === "number" || inputType === "range";

    setForm((prev) => ({
      ...prev,
      [name]: shouldBeNumber ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="rw-overlay">
      <div className="rw-card">
        <button className="rw-close-btn" onClick={onClose}>
          &times;
        </button>

        <p
          style={{
            fontSize: "0.75rem",
            color: "#ef4444",
            textAlign: "center",
            marginBottom: "1rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid #fee2e2",
          }}
        >
          **Disclaimer:** This is a wellness and tracking tool. It does not
          provide medical diagnosis or treatment.
        </p>

        <h2 className="rw-title">Daily Check-in: Day {dayNumber}</h2>
        <p className="rw-subtitle">
          Rate your experience and log your session details for today.
        </p>

        <TipsInfo />

        <form onSubmit={handleSubmit} className="rw-form">
          <label className="rw-label">
            Tinnitus Loudness (0=Silent, 10=Very Loud)
            <input
              className="rw-input"
              type="range"
              min="0"
              max="10"
              name="loudness"
              value={form.loudness}
              onChange={handleChange}
            />
            <span className="rw-range-value">{form.loudness}</span>
          </label>

          <label className="rw-label">
            Stress/Distress Level (0=Calm, 10=High Distress)
            <input
              className="rw-input"
              type="range"
              min="0"
              max="10"
              name="stress"
              value={form.stress}
              onChange={handleChange}
            />
            <span className="rw-range-value">{form.stress}</span>
          </label>

          <label className="rw-label">
            Sleep Quality Last Night (0=Terrible, 10=Excellent)
            <input
              className="rw-input"
              type="range"
              min="0"
              max="10"
              name="sleepQuality"
              value={form.sleepQuality}
              onChange={handleChange}
            />
            <span className="rw-range-value">{form.sleepQuality}</span>
          </label>

          <label className="rw-label">
            Therapy Minutes Used Today (Max 180 min)
            <input
              className="rw-input"
              type="number"
              min="0"
              max="180"
              name="minutesUsed"
              value={form.minutesUsed}
              onChange={handleChange}
            />
          </label>

          <label className="rw-label">
            Notes (Optional)
            <textarea
              className="rw-textarea"
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
            />
          </label>

          <div className="rw-actions">
            <button
              type="button"
              className="rw-btn rw-btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rw-btn rw-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Check-in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -----------------------------------------------------
// Program Pill Component
// -----------------------------------------------------
const ProgramPill = ({
  label,
  days,
  currentDays,
  onClick,
}: {
  label: string;
  days: ProgramLengthDays;
  currentDays: ProgramLengthDays | null;
  onClick: (d: ProgramLengthDays) => void;
}) => (
  <button
    onClick={() => onClick(days)}
    className={`nq-chip ${currentDays === days ? "active" : ""}`}
    style={{ minWidth: "80px", margin: "0.25rem" }}
  >
    {label}
  </button>
);

// -----------------------------------------------------
// Main Program Dashboard Component
// -----------------------------------------------------
export default function ProgramPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<ProgramEnrollment | null>(null);
  const [selectedLength, setSelectedLength] =
    useState<ProgramLengthDays | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<DailyCheckInType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");

  const startOfTodayMs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });
    return () => unsub();
  }, []);

  const loadEnrollment = useCallback(
    async (u: User) => {
      setLoading(true);
      try {
        const activeEnrollment = await getActiveEnrollment(u.uid);
        setEnrollment(activeEnrollment);

        if (activeEnrollment) {
          setSelectedLength(activeEnrollment.lengthDays);
          const dailyData = await getCheckInForDay(u.uid, startOfTodayMs);
          setCheckIn(dailyData);
        } else {
          setSelectedLength(30);
          setCheckIn(null);
        }
      } catch (e) {
        console.error("Failed to load program status:", e);
      } finally {
        setLoading(false);
      }
    },
    [startOfTodayMs]
  );

  useEffect(() => {
    if (user) loadEnrollment(user);
  }, [user, loadEnrollment]);

  const startProgram = useCallback(async () => {
    if (!user || !selectedLength) return;

    setStatusMessage("Starting program...");
    try {
      const newEnrollment = await createOrReplaceEnrollment(
        user.uid,
        selectedLength
      );
      setEnrollment(newEnrollment);
      setCheckIn(null);
      setStatusMessage(
        "Program started successfully! Ready for your first check-in."
      );
    } catch (e) {
      console.error("Failed to start program:", e);
      setStatusMessage(
        "Error starting program. Please check Firebase rules are published."
      );
    }
  }, [user, selectedLength]);

  const handleCheckInSubmit = useCallback(
    async (data: CheckIn) => {
      if (!user || !enrollment) return;

      setIsSubmitting(true);
      setStatusMessage("Submitting daily report...");

      const checkInToSave: Omit<DailyCheckInType, "createdAt" | "updatedAt"> = {
        ...data,
        userId: user.uid,
        dayNumber: getDayNumber(enrollment.startDate),
        date: startOfTodayMs,
      };

      try {
        await saveDailyCheckIn(checkInToSave);
        setCheckIn({
          ...checkInToSave,
          id: `${user.uid}_${startOfTodayMs}`,
        } as DailyCheckInType);
        setIsModalOpen(false);
        setStatusMessage("Daily check-in saved. Great job!");
      } catch (e) {
        console.error("Failed to save check-in:", e);
        setStatusMessage("Error saving daily report. Please check Firebase rules.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, enrollment, startOfTodayMs]
  );

  const handleDownload = useCallback(async () => {
    if (!user || !enrollment) return;
    setIsDownloading(true);
    setStatusMessage("Preparing download...");

    try {
      const history = await getCheckInHistory(user.uid, enrollment.startDate);

      if (history.length === 0) {
        setStatusMessage("No progress data available to download yet.");
      } else {
        downloadProgressData(history, enrollment);
        setStatusMessage("Download complete!");
      }
    } catch (e) {
      console.error("Download failed:", e);
      setStatusMessage(
        "Failed to download data due to a system error. Check console for details."
      );
    } finally {
      setIsDownloading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }, [user, enrollment]);

  const programStatus = useMemo(() => {
    if (!enrollment) return { dayNumber: 0, isComplete: false };
    const dayNumber = getDayNumber(enrollment.startDate);
    const isComplete = dayNumber > enrollment.lengthDays;
    return { dayNumber, isComplete };
  }, [enrollment]);

  if (!user && loading) {
    return (
      <div className="nq-container">
        <h2 className="nq-title">Loading Program...</h2>
        <p className="nq-subtitle">Please wait while we check your session.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="nq-container">
        <h2 className="nq-title">Access Denied</h2>
        <p className="nq-subtitle">
          Please log in or register to access the relief program.
        </p>
        <div style={{ marginTop: "1rem" }}>
          <a href="/login" className="nq-btn-big">
            Go to Login
          </a>
        </div>
        <Style />
      </div>
    );
  }

  const ProgramView = () => {
    if (loading) {
      return <div className="nq-info-box">Loading active program status...</div>;
    }

    if (enrollment) {
      if (viewMode === "chart") {
        return (
          <ProgressChartPlaceholder
            enrollment={enrollment}
            onBack={() => setViewMode("dashboard")}
            userId={user.uid}
          />
        );
      }

      const { dayNumber, isComplete } = programStatus;
      const progress = Math.min(
        100,
        ((dayNumber - 1) / enrollment.lengthDays) * 100
      );
      const isCheckInDue = !isComplete && !checkIn;
      const initialCheckIn = checkIn
        ? (checkIn as unknown as CheckIn)
        : initialCheckInState;

      return (
        <div className="nq-panel">
          <h2 className="nq-title">Program Active: {enrollment.lengthDays} Days</h2>
          <p className="nq-subtitle">
            You are currently on Day **{dayNumber}** of {enrollment.lengthDays} days.
          </p>

          <div className="progressWrap" style={{ marginBottom: "1.5rem" }}>
            <div className="progressBar" style={{ width: `${progress}%` }}></div>
          </div>

          {!isComplete ? (
            <div
              className="nq-btn-group"
              style={{ display: "flex", gap: "1rem", flexDirection: "column" }}
            >
              <button
                onClick={() => setIsModalOpen(true)}
                className={`nq-btn-big ${
                  isCheckInDue ? "nq-btn-due" : "nq-btn-done"
                }`}
              >
                {isCheckInDue
                  ? "📝 Check In Now"
                  : "✅ Check-in Complete (Tap to Edit)"}
              </button>

              <button
                onClick={() => setViewMode("chart")}
                className="nq-btn-action"
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                }}
              >
                📈 View Progress Chart
              </button>

              <a
                href="/therapy"
                className="nq-btn-action"
                style={{ background: "#4f46e5", color: "white" }}
              >
                Go to Therapy Page (Start Session)
              </a>

              <button
                onClick={handleDownload}
                className="nq-btn-action nq-btn-ghost"
                disabled={isDownloading}
                style={{
                  background: "transparent",
                  color: "#4b5563",
                  border: "1px solid #e2e8f0",
                }}
              >
                {isDownloading ? "Preparing Data..." : "⬇️ Download Progress Data (.csv)"}
              </button>
            </div>
          ) : (
            <div className="nq-info-box" style={{ background: "#d1fae5" }}>
              ✅ Program Complete! Day {dayNumber}.
              <br />
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <button
                  onClick={() => setViewMode("chart")}
                  className="nq-btn-action"
                  style={{ background: "#3b82f6", color: "white" }}
                >
                  📈 View Final Chart
                </button>
                <button
                  onClick={handleDownload}
                  className="nq-btn-action nq-btn-ghost"
                  disabled={isDownloading}
                  style={{
                    background: "transparent",
                    color: "#4b5563",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {isDownloading ? "Preparing Data..." : "⬇️ Download Progress Data (.csv)"}
                </button>
                <button
                  onClick={() => setEnrollment(null)}
                  className="nq-btn-action"
                  style={{ background: "#4f46e5", color: "white" }}
                >
                  Start New Program
                </button>
              </div>
            </div>
          )}

          {statusMessage && <p className="nq-status-message">{statusMessage}</p>}

          {isModalOpen && (
            <CheckInModal
              dayNumber={dayNumber}
              initialData={initialCheckIn}
              onSubmit={handleCheckInSubmit}
              onClose={() => setIsModalOpen(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      );
    }

    return (
      <div className="nq-panel nq-step-1">
        <h2 className="nq-title">Start a New Program</h2>
        <p className="nq-subtitle">
          Select the duration for your dedicated training period.
        </p>

        <div className="nq-duration-group" style={{ marginBottom: "1.5rem" }}>
          <ProgramPill
            label="7 Days"
            days={7}
            currentDays={selectedLength}
            onClick={setSelectedLength}
          />
          <ProgramPill
            label="14 Days"
            days={14}
            currentDays={selectedLength}
            onClick={setSelectedLength}
          />
          <ProgramPill
            label="30 Days"
            days={30}
            currentDays={selectedLength}
            onClick={setSelectedLength}
          />
        </div>

        <button
          onClick={startProgram}
          className="nq-btn-big"
          disabled={!selectedLength}
        >
          Start {selectedLength} Day Program
        </button>

        {statusMessage && (
          <p className="nq-status-message" style={{ marginTop: "1rem" }}>
            {statusMessage}
          </p>
        )}
      </div>
    );
  };

  return (
    <main className="nq-container">
      <header className="nq-header">
        <h1 className="nq-brand">Program Dashboard</h1>
      </header>
      <ProgramView />
      <Style />
    </main>
  );
}

// Minimal styles
function Style() {
  return (
    <style jsx global>{`
      :root {
        --primary: #0ea5e9;
        --success: #22c55e;
        --danger: #ef4444;
      }
      .nq-container {
        max-width: 700px;
        margin: 0 auto;
        padding: 2rem 1rem;
        font-family: system-ui, sans-serif;
        color: #0f172a;
      }
      .nq-header {
        margin-bottom: 2rem;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 1rem;
      }
      .nq-brand {
        font-size: 1.8rem;
        margin: 0;
      }
      .nq-title {
        font-size: 1.5rem;
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: var(--primary);
      }
      .nq-subtitle {
        font-size: 1rem;
        color: #4b5563;
        margin-bottom: 1.5rem;
      }
      .nq-panel {
        background: white;
        padding: 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e8f0;
      }
      .nq-step-1 {
        border: 2px solid var(--primary);
      }
      .nq-info-box {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        padding: 1rem;
        border-radius: 0.5rem;
        color: #1e40af;
      }
      .nq-status-message {
        text-align: center;
        font-size: 0.9rem;
        color: #64748b;
      }
      .nq-btn-big {
        width: 100%;
        background: var(--primary);
        color: white;
        border: none;
        padding: 1.2rem;
        border-radius: 1rem;
        font-size: 1.2rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 10px 20px rgba(14, 165, 233, 0.2);
        text-decoration: none;
        display: block;
        text-align: center;
      }
      .nq-btn-big.nq-btn-due {
        background: var(--danger);
        box-shadow: 0 10px 20px rgba(239, 68, 68, 0.2);
      }
      .nq-btn-big.nq-btn-done {
        background: var(--success);
        box-shadow: 0 10px 20px rgba(34, 197, 94, 0.2);
      }
      .nq-btn-action {
        flex: 1;
        padding: 0.75rem 1rem;
        border-radius: 999px;
        font-weight: 600;
        font-size: 1rem;
        text-align: center;
        cursor: pointer;
        text-decoration: none;
        border: none;
        transition: background 0.2s;
        color: white;
        display: block;
      }
      .nq-btn-ghost {
        background: transparent;
        color: #4b5563;
        border: 1px solid #e2e8f0;
      }
      .nq-duration-group {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
      }
      .nq-chip {
        flex: 1;
        max-width: 150px;
        border: 1px solid #e2e8f0;
        background: white;
        padding: 0.75rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 600;
        color: #4b5563;
        transition: all 0.2s;
      }
      .nq-chip.active {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
        box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
      }
      .progressWrap {
        width: 100%;
        height: 14px;
        border-radius: 999px;
        border: 1px solid #d1d5db;
        background: #f3f4f6;
        overflow: hidden;
      }
      .progressBar {
        height: 100%;
        border-radius: 999px;
        background: var(--success);
        transition: width 0.5s ease-out;
      }
      .rw-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483646;
        padding: 1rem;
        animation: rw-fadeIn 0.2s ease-out forwards;
      }
      .rw-card {
        position: relative;
        max-width: 420px;
        width: 100%;
        background: #ffffff;
        border-radius: 20px;
        padding: 2rem 1.5rem 1.8rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        font-family: inherit;
        animation: rw-slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes rw-fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes rw-slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          transform: translateY(0);
        }
      }
      .rw-close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: #f3f4f6;
        color: #6b7280;
        font-size: 1.2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .rw-title {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
        font-weight: 700;
        color: #111827;
      }
      .rw-subtitle {
        margin: 0 0 1.5rem;
        font-size: 0.95rem;
        color: #4b5563;
      }
      .rw-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .rw-label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.85rem;
        font-weight: 500;
        color: #374151;
      }
      .rw-input,
      .rw-textarea {
        border-radius: 10px;
        border: 1px solid #d1d5db;
        padding: 0.75rem;
        font-size: 0.95rem;
        font-family: inherit;
        width: 100%;
        box-sizing: border-box;
      }
      .rw-input[type="range"] {
        padding: 0;
        border: none;
        height: 4px;
        appearance: none;
        background: #e5e7eb;
        accent-color: var(--primary);
      }
      .rw-range-value {
        text-align: center;
        font-weight: 700;
        color: var(--primary);
        font-size: 1rem;
        margin-top: -0.5rem;
      }
      .rw-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
        justify-content: flex-end;
      }
      .rw-btn {
        border-radius: 999px;
        padding: 0.75rem 1.25rem;
        font-size: 0.9rem;
        font-weight: 600;
        border: 1px solid transparent;
        cursor: pointer;
      }
      .rw-btn-primary {
        background: var(--primary);
        color: #ffffff;
      }
      .rw-btn-ghost {
        background: transparent;
        color: #4b5563;
        border: 1px solid #e5e8f0;
      }
    `}</style>
  );
}
