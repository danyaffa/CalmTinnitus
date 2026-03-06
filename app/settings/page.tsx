// FILE: app/settings/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import Footer from "../../components/Footer";

import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut, deleteUser, User } from "firebase/auth";
import { deleteDoc, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Delete modal state
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const canDelete = useMemo(() => {
    return confirmCheck && confirmText.trim().toUpperCase() === "DELETE";
  }, [confirmCheck, confirmText]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  async function handleLogout() {
    setMsg("");
    await signOut(auth);
    window.location.href = "/";
  }

  async function handleDeleteAllData() {
    if (!user) {
      setMsg("You must be logged in to delete your account.");
      return;
    }
    if (!canDelete) return;

    setBusy(true);
    setMsg("");

    try {
      // 1) Clear local device data used by the app
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("calmtinnitus_low_stim");
          window.localStorage.removeItem("calmtinnitus_session_logs_v1");
        }
      } catch {
        // ignore
      }

      const uid = user.uid;

      // 2) Delete Firestore user doc
      try {
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          await deleteDoc(userRef);
        }
      } catch {
        // ignore — Firestore doc may not exist
      }

      // 3) Delete session logs from Firestore
      try {
        const sessionsRef = collection(db, "sessions");
        const q = query(sessionsRef, where("userId", "==", uid));
        const sessionsSnap = await getDocs(q);
        const deletePromises = sessionsSnap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      } catch {
        // ignore
      }

      // 4) Delete reviews from Firestore
      try {
        const reviewsRef = collection(db, "reviews");
        const q = query(reviewsRef, where("userId", "==", uid));
        const reviewsSnap = await getDocs(q);
        const deletePromises = reviewsSnap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      } catch {
        // ignore
      }

      // 5) Delete the Firebase Auth account
      await deleteUser(user);

      // 6) Redirect to home
      window.location.href = "/";
    } catch (e: any) {
      const message = String(e?.message || "");
      if (message.toLowerCase().includes("requires-recent-login")) {
        setMsg(
          "For security, please log out and log in again, then return here and press Delete again."
        );
      } else {
        setMsg("Deletion failed. Please try again, or log out and log back in.");
      }
    } finally {
      setBusy(false);
      setOpen(false);
      setConfirmText("");
      setConfirmCheck(false);
    }
  }

  return (
    <main className="settings-page">
      <div className="settings-card">
        <h1>Account Settings</h1>

        {loadingAuth ? (
          <p>Loading…</p>
        ) : !user ? (
          <>
            <p>You are not logged in.</p>
            <div className="row">
              <Link className="btn" href="/login">
                Go to Login
              </Link>
              <Link className="btn secondary" href="/">
                Back to Home
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="muted">
              Logged in as: <strong>{user.email || "User"}</strong>
            </p>

            <div className="section">
              <h2>Privacy</h2>
              <p className="muted">
                CalmTinnitus is designed not to store personal therapy/session
                data. If you want to remove your access and any associated
                records completely, use the options below.
              </p>
              <p className="muted">
                Read: <Link href="/privacy">Privacy Policy</Link>
              </p>
            </div>

            <div className="section danger">
              <h2>Stop / Delete My Account</h2>
              <div className="danger-warning">
                <strong>Warning:</strong> Stopping your account will permanently
                remove all your data, notes, session history, and account access.
                This action cannot be undone. Your subscription (if any) will be
                cancelled and you will lose access to CalmTinnitus immediately.
              </div>

              <button className="dangerBtn" onClick={() => setOpen(true)}>
                Disconnect / Stop My Account
              </button>
            </div>

            <div className="row">
              <button className="btn secondary" onClick={handleLogout}>
                Log out
              </button>
              <Link className="btn" href="/">
                Back to Home
              </Link>
            </div>
          </>
        )}

        {!!msg && <p className="msg">{msg}</p>}
      </div>

      {/* CONFIRMATION MODAL */}
      {open && (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Confirm Account Deletion</h3>

            <div className="danger-warning">
              <strong>This is permanent.</strong> All your data, session notes,
              therapy history, and account access will be permanently removed
              from CalmTinnitus. You will not be able to recover your account.
            </div>

            <label className="checkRow">
              <input
                type="checkbox"
                checked={confirmCheck}
                onChange={(e) => setConfirmCheck(e.target.checked)}
              />
              <span>
                I understand this is permanent and cannot be undone.
              </span>
            </label>

            <label className="inputLabel">
              Type <strong>DELETE</strong> to confirm:
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="textInput"
                autoFocus
              />
            </label>

            <div className="row">
              <button
                className="btn secondary"
                onClick={() => {
                  setOpen(false);
                  setConfirmText("");
                  setConfirmCheck(false);
                }}
                disabled={busy}
              >
                Cancel
              </button>

              <button
                className="dangerBtn"
                onClick={handleDeleteAllData}
                disabled={!canDelete || busy}
                title={!canDelete ? "Tick the box and type DELETE" : undefined}
              >
                {busy ? "Deleting…" : "Permanently Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer variant="minimal" />

      <style jsx>{`
        .settings-page {
          max-width: 920px;
          margin: 0 auto;
          padding: 1.25rem 1rem 2.5rem;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .settings-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 1.25rem;
          padding: 1.25rem 1.25rem;
          box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
          color: #0f172a;
        }

        h1 {
          margin: 0 0 0.75rem;
        }

        h2 {
          margin: 0 0 0.5rem;
          font-size: 1.05rem;
        }

        .muted {
          color: #475569;
          line-height: 1.55;
        }

        .section {
          margin-top: 1.1rem;
          padding-top: 1rem;
          border-top: 1px solid #eef2f7;
        }

        .danger {
          border-top: 1px solid #fee2e2;
        }

        .danger-warning {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #991b1b;
          padding: 0.85rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          line-height: 1.55;
          margin-bottom: 1rem;
        }

        .row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.55rem 1rem;
          border-radius: 999px;
          border: 1px solid #0f172a;
          background: #0f172a;
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          cursor: pointer;
        }

        .btn.secondary {
          background: #fff;
          color: #0f172a;
        }

        .dangerBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.55rem 1rem;
          border-radius: 999px;
          border: 1px solid #b91c1c;
          background: #b91c1c;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }

        .dangerBtn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .msg {
          margin-top: 1rem;
          color: #b91c1c;
          font-weight: 600;
        }

        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 50;
        }

        .modal {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border-radius: 1.25rem;
          border: 1px solid #e5e7eb;
          box-shadow: 0 25px 70px rgba(15, 23, 42, 0.35);
          padding: 1.1rem 1.1rem;
        }

        .checkRow {
          display: flex;
          gap: 0.6rem;
          align-items: flex-start;
          margin: 0.9rem 0 0.9rem;
          color: #334155;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .inputLabel {
          display: block;
          color: #334155;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .textInput {
          width: 100%;
          margin-top: 0.45rem;
          padding: 0.6rem 0.75rem;
          border-radius: 0.8rem;
          border: 1px solid #cbd5e1;
          outline: none;
          font-size: 1rem;
        }
      `}</style>
    </main>
  );
}
