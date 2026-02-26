// FILE: app/settings/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

// ✅ Adjust these imports ONLY if your firebase exports differ.
// Most CalmTinnitus builds use /lib/firebase.ts exporting `auth` and `db`.
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut, deleteUser, User } from "firebase/auth";
import { deleteDoc, doc, getDoc } from "firebase/firestore";

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
      // IMPORTANT:
      // If Firebase requires a recent login, deleteUser() will fail.
      // We must NOT delete Firestore first, otherwise the user can get stuck
      // (Auth user still exists but profile doc is gone).

      // 1) Clear local device data used by the app
      try {
        if (typeof window !== "undefined") {
          // Remove known CalmTinnitus local keys:
          window.localStorage.removeItem("calmtinnitus_low_stim");
          // If you store any session prefs locally later, you can clear them too:
          // window.localStorage.removeItem("calmtinnitus_sessions");
          // As a strict privacy option:
          // window.localStorage.clear();
        }
      } catch {
        // ignore
      }

      // 2) Delete the authentication account
      // Note: Firebase may require "recent login". If so, user must re-login then try again.
      await deleteUser(user);

      // 3) Delete Firestore user doc IF it exists (best-effort)
      try {
        const uid = user.uid;
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          await deleteDoc(userRef);
        }
      } catch {
        // ignore
      }

      // 4) Redirect to home
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
                records completely, use Delete below.
              </p>
              <p className="muted">
                Read: <Link href="/privacy">Privacy Policy</Link>
              </p>
            </div>

            <div className="section danger">
              <h2>Delete my data</h2>
              <p className="muted">
                By deleting your data, all access to your account will be
                removed. Any associated records (if they exist) will be deleted.
                This action is permanent and cannot be undone.
              </p>

              <button className="dangerBtn" onClick={() => setOpen(true)}>
                Delete my data
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
            <h3>Confirm deletion</h3>
            <p className="muted">
              This will permanently delete your account access and remove any
              associated records (if any exist). You will be signed out.
            </p>

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
                {busy ? "Deleting…" : "Confirm delete"}
              </button>
            </div>
          </div>
        </div>
      )}

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
