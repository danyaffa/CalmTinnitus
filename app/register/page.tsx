// /app/register/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  firebaseEmailSignUp,
  firebaseGoogleSignIn,
} from "../../lib/firebase";

const STRIPE_LINK = "https://buy.stripe.com/4gM5kxxxxxxxxx";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await firebaseEmailSignUp(email, password);
      window.location.href = STRIPE_LINK;
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await firebaseGoogleSignIn();
      window.location.href = STRIPE_LINK;
    } catch (err: any) {
      setError(err.message || "Google sign-up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Create Your NeuroQuiet Account</h1>
        <p className="auth-sub">
          Your therapy history will sync between devices. After sign-up you
          will be redirected to our Stripe page.
        </p>

        <form onSubmit={handleEmailRegister} className="auth-form">
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
            {busy ? "Registering…" : "Register & Go to Stripe"}
          </button>
        </form>

        <button
          className="btn btn-secondary auth-btn"
          onClick={handleGoogle}
          disabled={busy}
        >
          Sign with Google & Go to Stripe
        </button>

        <p className="auth-footer">
          Already have an account? <Link href="/login">Login</Link>
        </p>
        <p className="auth-footer">
          <Link href="/">← Back to app</Link>
        </p>
      </div>
    </main>
  );
}
