// FILE: app/login/page.tsx
"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

function friendlyAuthError(codeOrMsg: string) {
  const s = (codeOrMsg || "").toLowerCase();

  if (s.includes("auth/invalid-credential") || s.includes("wrong-password")) {
    return "Incorrect email or password. Try again, or use “Forgot password”.";
  }
  if (s.includes("auth/user-not-found")) {
    return "No account found for this email. Please register.";
  }
  if (s.includes("auth/too-many-requests")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (s.includes("auth/popup-closed-by-user")) {
    return "Google sign-in popup was closed. Please try again.";
  }
  if (s.includes("auth/operation-not-allowed")) {
    return "Google sign-in is not enabled in Firebase Auth yet. Enable Google provider.";
  }
  if (s.includes("auth/unauthorized-domain")) {
    return "This domain is not authorized for Google sign-in. Add your domain in Firebase Auth settings.";
  }
  return "Login failed. Please try again.";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6;
  }, [email, password]);

  const firebaseDebug = useMemo(() => {
    // Helps diagnose: “Register says exists but Login says none”.
    const projectId = (auth as any)?.app?.options?.projectId || "";
    const authDomain = (auth as any)?.app?.options?.authDomain || "";
    const apiKeyTail = String((auth as any)?.app?.options?.apiKey || "").slice(
      -6
    );
    return { projectId, authDomain, apiKeyTail };
  }, []);

  async function onLoginEmail(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      window.location.href = "/therapy";
    } catch (err: any) {
      // If the email exists but ONLY via Google, explain clearly.
      const em = email.trim().toLowerCase();
      const codeOrMsg = String(err?.code || err?.message || "");
      if (
        codeOrMsg.includes("auth/user-not-found") ||
        codeOrMsg.includes("auth/invalid-credential")
      ) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, em);
          if (
            methods?.length &&
            !methods.includes("password") &&
            methods.includes("google.com")
          ) {
            setMsg(
              "This email is registered with Google sign-in. Please click “Continue with Google”."
            );
            return;
          }
        } catch {
          // ignore
        }
      }

      setMsg(`Firebase: ${friendlyAuthError(codeOrMsg)}`);
    } finally {
      setBusy(false);
    }
  }

  async function onLoginGoogle() {
    setMsg("");
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      window.location.href = "/therapy";
    } catch (err: any) {
      setMsg(`Firebase: ${friendlyAuthError(err?.code || err?.message)}`);
    } finally {
      setBusy(false);
    }
  }

  async function onForgotPassword() {
    setMsg("");
    const em = email.trim();
    if (!em) {
      setMsg("Enter your email above first, then click “Forgot password”.");
      return;
    }

    setBusy(true);
    try {
      const emNorm = em.toLowerCase();
      const methods = await fetchSignInMethodsForEmail(auth, emNorm);

      if (!methods || methods.length === 0) {
        setMsg(
          `No account found for this email in this Firebase project. (Project: ${
            firebaseDebug.projectId || "unknown"
          }). If you are sure the account exists, your deployment is pointing to a different Firebase project (env vars).`
        );
        return;
      }

      if (!methods.includes("password")) {
        if (methods.includes("google.com")) {
          setMsg(
            "This email uses Google sign-in (no password). Please click “Continue with Google”."
          );
          return;
        }
        setMsg(
          "This email does not have a password login method. Please use the sign-in method you originally used."
        );
        return;
      }

      await sendPasswordResetEmail(auth, emNorm);
      setMsg("Password reset email sent. Check your inbox (and spam).");
    } catch (err: any) {
      setMsg(`Firebase: ${friendlyAuthError(err?.code || err?.message)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="card">
        <h1>Log in</h1>
        <p className="muted">
          Log in with your email/password or Google. If you forgot your password,
          use the reset button.
        </p>

        {msg ? <div className="alert">{msg}</div> : null}

        <form onSubmit={onLoginEmail} className="form">
          <label className="label">
            Email
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </label>

          <label className="label">
            Password
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              type="password"
              autoComplete="current-password"
            />
          </label>

          <button className="btn" disabled={!canSubmit || busy} type="submit">
            {busy ? "Working..." : "Log in"}
          </button>

          <button
            className="btn secondary"
            type="button"
            onClick={onForgotPassword}
            disabled={busy}
          >
            Forgot password
          </button>

          <button
            className="btn google"
            type="button"
            onClick={onLoginGoogle}
            disabled={busy}
          >
            Continue with Google
          </button>

          <p className="small">
            Don’t have an account? <Link href="/register">Register</Link>
          </p>

          <p className="tiny">
            Firebase project:{" "}
            <strong>{firebaseDebug.projectId || "unknown"}</strong>
          </p>
        </form>
      </div>

      <style jsx>{`
        .auth-page {
          max-width: 980px;
          margin: 0 auto;
          padding: 1.25rem 1rem 2.5rem;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }
        .card {
          max-width: 520px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 1.25rem;
          padding: 1.25rem;
          box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
        }
        h1 {
          margin: 0 0 0.5rem;
        }
        .muted {
          margin: 0 0 1rem;
          color: #475569;
          line-height: 1.5;
        }
        .alert {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
          padding: 0.75rem;
          border-radius: 0.9rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        .form {
          display: grid;
          gap: 0.85rem;
        }
        .label {
          display: grid;
          gap: 0.35rem;
          color: #0f172a;
          font-weight: 600;
        }
        .input {
          padding: 0.65rem 0.75rem;
          border-radius: 0.85rem;
          border: 1px solid #cbd5e1;
          outline: none;
          font-size: 1rem;
        }
        .btn {
          padding: 0.65rem 0.9rem;
          border-radius: 999px;
          border: 1px solid #0f172a;
          background: #0f172a;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn.secondary {
          background: #fff;
          color: #0f172a;
        }
        .btn.google {
          background: #fff;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .small {
          margin: 0.5rem 0 0;
          color: #475569;
          font-size: 0.92rem;
        }
        .tiny {
          margin: 0.1rem 0 0;
          color: #94a3b8;
          font-size: 0.78rem;
        }
      `}</style>
    </main>
  );
}
