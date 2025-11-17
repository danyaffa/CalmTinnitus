// /app/login/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  firebaseEmailSignIn,
  firebaseGoogleSignIn,
} from "../../lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await firebaseEmailSignIn(email, password);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await firebaseGoogleSignIn();
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Login to NeuroQuiet</h1>
        <p className="auth-sub">
          Sync your therapy sessions across devices.
        </p>

        <form onSubmit={handleEmailLogin} className="auth-form">
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Password
            <div className="pw-wrapper">
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? "Hide" : "See"}
              </button>
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-primary auth-btn" disabled={busy}>
            {busy ? "Logging in…" : "Login"}
          </button>
        </form>

        <button
          className="btn btn-secondary auth-btn"
          onClick={handleGoogle}
          disabled={busy}
        >
          Sign with Google
        </button>

        <p className="auth-footer">
          No account yet? <Link href="/register">Register here</Link>
        </p>
        <p className="auth-footer">
          <Link href="/">← Back to app</Link>
        </p>
      </div>
    </main>
  );
}
