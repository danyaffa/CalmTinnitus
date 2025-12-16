// FILE: /app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";

// --- NEW CONSTANT FOR DEVELOPER ACCESS ---
// Assuming the correct email is leffleryd@gmail.com
const DEVELOPER_EMAIL = "leffleryd@gmail.com";
// -----------------------------------------

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- NEW FUNCTION TO HANDLE REDIRECTION ---
  const handleRedirection = (userEmail: string | null) => {
    if (userEmail?.toLowerCase() === DEVELOPER_EMAIL) {
      // Developer bypass: Go directly to therapy page
      router.push("/therapy");
    } else {
      // Standard user: Go to home page (or wherever the auth provider redirects non-paying users)
      router.push("/");
    }
  };
  // --------------------------------------------

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // ✅ CRITICAL FIX: auth can be Auth | null. Narrow it BEFORE calling Firebase.
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

      // Use the new function to handle redirection
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

    // ✅ CRITICAL FIX: auth can be Auth | null. Narrow it BEFORE calling Firebase.
    const authInstance = auth;
    if (!authInstance) {
      setError("Authentication is not ready yet. Please refresh and try again.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithPopup(authInstance, googleProvider);

      // Use the new function to handle redirection
      handleRedirection(userCredential.user.email);
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
