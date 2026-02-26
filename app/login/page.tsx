// FILE: /app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db, firebaseReady } from "../../lib/firebase";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check user's subscription status and redirect accordingly
  const handleRedirection = async (user: User) => {
    if (!firebaseReady || !db) {
      router.push("/");
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.subscriptionStatus === "active") {
          router.push("/therapy");
          return;
        }
      }
      // No active subscription — send to register to complete payment/promo
      router.push("/register");
    } catch (err) {
      console.error("Failed to check subscription:", err);
      router.push("/");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!auth) {
      setError(
        "Authentication is not ready yet. Please refresh and try again."
      );
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await handleRedirection(userCredential.user);
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    if (!auth) {
      setError(
        "Authentication is not ready yet. Please refresh and try again."
      );
      setLoading(false);
      return;
    }

    try {
      let user: User;
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        user = result.user as unknown as User;
      } else {
        if (!googleProvider) {
          setError("Google sign-in is not available.");
          setLoading(false);
          return;
        }
        const userCredential = await signInWithPopup(auth, googleProvider);
        user = userCredential.user;
      }

      await handleRedirection(user);
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
            {loading ? "Logging in..." : "Log in"}
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
            Back to CalmTinnitus
          </a>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
