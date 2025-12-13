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
  DailyCheckIn as DailyCheckInType,
} from "@/lib/program"; // Importing logic from the new utility file

// --- TYPES & CONSTANTS ---
type CheckIn = Omit<DailyCheckInType, "userId" | "dayNumber" | "date" | "createdAt" | "updatedAt">;

// Initial state for the check-in form
const initialCheckInState: CheckIn = {
  loudness: 5,
  stress: 5,
  sleepQuality: 5,
  minutesUsed: 30,
  notes: "",
};

// --- COMPONENTS ---

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
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
        <h2 className="rw-title">Daily Check-in: Day {dayNumber}</h2>
        <p className="rw-subtitle">
          Rate your experience and log your session details for today.
        </p>

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
// Program Pill Component (reused)
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
  const [selectedLength, setSelectedLength] = useState<ProgramLengthDays | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<DailyCheckInType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startOfTodayMs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }, []);

  // 1. Authentication Check
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // 2. Load Active Enrollment AND Check-in
  const loadEnrollment = useCallback(async (u: User) => {
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
      setStatusMessage("Error loading program status.");
    } finally {
      setLoading(false);
    }
  }, [startOfTodayMs]);

  useEffect(() => {
    if (user) {
      loadEnrollment(user);
    }
  }, [user, loadEnrollment]);

  // 3. Handle Enrollment/Start Program
  const startProgram = useCallback(async () => {
    if (!user || !selectedLength) return;

    setStatusMessage("Starting program...");
    try {
      const newEnrollment = await createOrReplaceEnrollment(
        user.uid,
        selectedLength
      );
      setEnrollment(newEnrollment);
      setCheckIn(null); // Clear any existing check-in data from a previous day's load
      setStatusMessage("Program started successfully! Ready for your first check-in.");
    } catch (e) {
      console.error("Failed to start program:", e);
      setStatusMessage("Error starting program.");
    }
  }, [user, selectedLength]);


  // 4. Handle Daily Check-in Submission
  const handleCheckInSubmit = useCallback(async (data: CheckIn) => {
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
      setCheckIn({ ...checkInToSave, id: `${user.uid}_${startOfTodayMs}` } as DailyCheckInType);
      setIsModalOpen(false);
      setStatusMessage("Daily check-in saved. Great job!");
    } catch (e) {
      console.error("Failed to save check-in:", e);
      setStatusMessage("Error saving daily report.");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, enrollment, startOfTodayMs]);

  // Calculate current day number and check if program is complete
  const programStatus = useMemo(() => {
    if (!enrollment) return { dayNumber: 0, isComplete: false };

    const dayNumber = getDayNumber(enrollment.startDate);
    const isComplete = dayNumber > enrollment.lengthDays;

    return { dayNumber, isComplete };
  }, [enrollment]);

  // Handle Authentication and Loading States
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

  // Render Logic
  const ProgramView = () => {
    if (loading) {
      return (
        <div className="nq-info-box">Loading active program status...</div>
      );
    }

    if (enrollment) {
      const { dayNumber, isComplete } = programStatus;
      const progress = Math.min(
        100,
        ((dayNumber - 1) / enrollment.lengthDays) * 100
      );
      const isCheckInDue = !isComplete && !checkIn;
      const initialCheckIn = checkIn ? (checkIn as CheckIn) : initialCheckInState;


      return (
        <div className="nq-panel">
          <h2 className="nq-title">
            Program Active: {enrollment.lengthDays} Days
          </h2>
          <p className="nq-subtitle">
            You are currently on Day **{dayNumber}** of{" "}
            {enrollment.lengthDays} days.
          </p>

          <div className="progressWrap" style={{ marginBottom: "1.5rem" }}>
            <div
              className="progressBar"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {!isComplete ? (
            <div className="nq-btn-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="/therapy" className="nq-btn-action">
                Start Today's Session
              </a>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className={`nq-btn-action ${isCheckInDue ? 'nq-btn-due' : 'nq-btn-done'}`}
              >
                {isCheckInDue ? "📝 Check In Now" : "✅ Check-in Complete"}
              </button>
            </div>
          ) : (
            <div className="nq-info-box" style={{ background: "#d1fae5" }}>
              ✅ Program Complete! Day {dayNumber}.
              <br />
              Consider starting a new program.
              <button
                onClick={() => setEnrollment(null)}
                className="nq-btn-action"
                style={{ marginTop: '1rem', background: '#3b82f6', color: 'white' }}
              >
                Start New Program
              </button>
            </div>
          )}

          {statusMessage && (
            <p className="nq-status-message">{statusMessage}</p>
          )}

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

    // No active enrollment - show setup
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

        <button onClick={startProgram} className="nq-btn-big" disabled={!selectedLength}>
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

// Minimal styles to ensure the page looks functional
function Style() {
  return (
    <style jsx global>{`
      /* Common Styles */
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
      .nq-btn-action {
        flex: 1;
        padding: 0.75rem 1rem;
        border-radius: 999px;
        font-weight: 600;
        font-size: 1rem;
        text-align: center;
        cursor: pointer;
        text-decoration: none;
        border: 1px solid #e2e8f0;
      }

      /* Program Pills */
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

      /* Progress Bar Styling */
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
      
      /* Check-in Buttons */
      .nq-btn-action {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 999px;
          font-weight: 600;
          font-size: 1rem;
          text-align: center;
          cursor: pointer;
          text-decoration: none;
          border: none; /* Removed border */
          transition: background 0.2s;
          color: white;
      }
      .nq-btn-action:first-child {
          background: #4f46e5; /* Indigo for Therapy Session button */
      }
      .nq-btn-action.nq-btn-due {
          background: var(--danger); /* Red for urgency */
      }
      .nq-btn-action.nq-btn-done {
          background: var(--success); /* Green when complete */
      }
      
      /* ------------------------------------------- */
      /* Modal Styles (Duplicated from review-widgets.css for local use) */
      /* ------------------------------------------- */
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
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes rw-slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
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
        font-weight: 400;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      .rw-title {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
        font-weight: 700;
        color: #111827;
        line-height: 1.3;
      }
      .rw-subtitle {
        margin: 0 0 1.5rem;
        font-size: 0.95rem;
        line-height: 1.5;
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
        transition: border-color 0.2s, box-shadow 0.2s;
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
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .rw-btn-primary {
        background: var(--primary);
        color: #ffffff;
      }
      .rw-btn-ghost {
        background: transparent;
        color: #4b5563;
        border: 1px solid #e5e7eb;
      }
      /* ------------------------------------------- */
    `}</style>
  );
}
