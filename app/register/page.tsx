// /app/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";

const STRIPE_LINK =
  "https://buy.stripe.com/4gM5kD6cC0PK2YP39i4F20b"; // your live payment link

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goToStripe = () => {
    window.location.href = STRIPE_LINK;
  };

  const handleEmailRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      goToStripe();
    } catch (err: any) {
      setError(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      goToStripe();
    } catch (err: any) {
      setError(err.message ?? "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Create your NeuroQuiet account</h1>
        <p className="auth-sub">
          We&apos;ll keep your tinnitus profiles and history synced across
          devices.
        </p>

        <form className="auth-form" onSubmit={handleEmailRegister}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <div className="pw-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "See"}
              </button>
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Register & go to payment"}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-secondary auth-btn"
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          Sign up with Google & go to payment
        </button>

        <p className="auth-footer">
          Already have an account?{" "}
          <a href="/login" className="btn-link">
            Log in
          </a>
        </p>
        <p className="auth-footer">
          <a href="/" className="btn-link">
            ← Back to NeuroQuiet
          </a>
        </p>
      </div>
    </main>
  );
};

export default RegisterPage;
