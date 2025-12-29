// FILE: /app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
// NEW: Imports for Android compatibility
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';

const DEVELOPER_EMAIL = "leffleryd@gmail.com";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRedirection = (userEmail: string | null) => {
    if (userEmail?.toLowerCase() === DEVELOPER_EMAIL) {
      router.push("/therapy");
    } else {
      router.push("/");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const authInstance = auth;
    if (!authInstance) {
      setError("Authentication is not ready yet. Please refresh and try again.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        authInstance,
        email,
        password
      );
      handleRedirection(userCredential.user.email);
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    const authInstance = auth;
    if (!authInstance) {
      setError("Authentication is not ready yet. Please refresh and try again.");
      setLoading(false);
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        // Native Android Login Flow
        const result = await FirebaseAuthentication.signInWithGoogle();
        handleRedirection(result.user?.email || null);
      } else {
        // Standard Web Login Flow
        const userCredential = await signInWithPopup(authInstance, googleProvider);
        handleRedirection(userCredential.user.email);
      }
    } catch (err: any) {
      setError(err.message ?? "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Log in to CalmTinnitus</h1>
        <p className="auth-sub">
          Access your saved tinnitus sessions and progress from any device.
        </p>

        <form className="auth-form" onSubmit={handleEmailLogin}>
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
                autoComplete="current-password"
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
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-secondary auth-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Continue with Google
        </button>

        <p className="auth-footer">
          New here?{" "}
          <a href="/register" className="btn-link">
            Create an account
          </a>
        </p>
        <p className="auth-footer">
          <a href="/" className="btn-link">
            ← Back to CalmTinnitus
          </a>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
