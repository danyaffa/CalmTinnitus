// FILE: /app/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSuccessfulAuth = (userEmail: string | null) => {
    router.push("/therapy");
  };

  const handleEmailRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // ✅ CRITICAL FIX — narrow Auth | null
    const authInstance = auth;
    if (!authInstance) {
      setError("Authentication is not ready yet. Please refresh and try again.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        authInstance,
        email,
        password
      );

      handleSuccessfulAuth(userCredential.user.email || email);
    } catch (err: any) {
      setError(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setLoading(true);

    // ✅ CRITICAL FIX — narrow Auth | null
    const authInstance = auth;
    if (!authInstance) {
      setError("Authentication is not ready yet. Please refresh and try again.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithPopup(
        authInstance,
        googleProvider
      );

      handleSuccessfulAuth(userCredential.user.email);
    } catch (err: any) {
      setError(err.message ?? "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Create your CalmTinnitus account</h1>
        <p className="auth-sub">
          Start your personalised tinnitus relief journey.
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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-secondary auth-btn"
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          Sign up with Google
        </button>

        <p className="auth-footer">
          Already have an account?{" "}
          <a href="/login" className="btn-link">
            Log in
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

export default RegisterPage;
