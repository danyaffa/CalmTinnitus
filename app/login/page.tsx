// FILE: app/login/page.tsx
"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import Footer from "../../components/Footer";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, firebaseReady } from "../../lib/firebase";

const PROMO_CODE = process.env.NEXT_PUBLIC_PROMO_CODE || "";

function friendlyAuthError(codeOrMsg: string) {
  const s = (codeOrMsg || "").toLowerCase();
  if (s.includes("auth/invalid-credential") || s.includes("wrong-password")) return "Incorrect email or password. Try again, or use Forgot password.";
  if (s.includes("auth/user-not-found")) return "No account found for this email. Please register.";
  if (s.includes("auth/too-many-requests")) return "Too many attempts. Please wait a few minutes and try again.";
  if (s.includes("auth/popup-closed-by-user")) return "Google sign-in popup was closed. Please try again.";
  if (s.includes("auth/operation-not-allowed")) return "Google sign-in is not enabled in Firebase Auth yet.";
  if (s.includes("auth/unauthorized-domain")) return "This domain is not authorized for Google sign-in.";
  return "Login failed. Please try again.";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 6, [email, password]);

  const firebaseDebug = useMemo(() => {
    const projectId = (auth as any)?.app?.options?.projectId || "";
    return { projectId };
  }, []);

  async function activatePromo(uid: string): Promise<boolean> {
    const code = promoCode.trim();
    if (!code) return false;
    if (!PROMO_CODE) { setMsg("Promo codes are not enabled right now."); return false; }
    if (code.toUpperCase() !== PROMO_CODE.trim().toUpperCase()) { setMsg("Invalid promo code."); return false; }
    if (firebaseReady && db) {
      const ref = doc(db, "users", uid);
      await setDoc(ref, { uid, subscriptionStatus: "active", accessType: "promo", promoCodeUsed: code.toUpperCase(), promoActivatedAt: serverTimestamp() }, { merge: true });
    }
    return true;
  }

  async function onLoginEmail(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setSuccessMsg(""); setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (promoCode.trim()) {
        const ok = await activatePromo(cred.user.uid);
        if (!ok) { setBusy(false); return; }
        setSuccessMsg("Promo code activated! Redirecting...");
        setTimeout(() => { window.location.href = "/therapy"; }, 1200);
        return;
      }
      window.location.href = "/therapy";
    } catch (err: any) {
      const em = email.trim().toLowerCase();
      const codeOrMsg = String(err?.code || err?.message || "");
      if (codeOrMsg.includes("auth/user-not-found") || codeOrMsg.includes("auth/invalid-credential")) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, em);
          if (methods?.length && !methods.includes("password") && methods.includes("google.com")) {
            setMsg("This email is registered with Google sign-in. Please click Continue with Google.");
            return;
          }
        } catch {}
      }
      setMsg(friendlyAuthError(codeOrMsg));
    } finally { setBusy(false); }
  }

  async function onLoginGoogle() {
    setMsg(""); setSuccessMsg(""); setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(auth, provider);
      if (promoCode.trim()) {
        const ok = await activatePromo(cred.user.uid);
        if (!ok) { setBusy(false); return; }
        setSuccessMsg("Promo code activated! Redirecting...");
        setTimeout(() => { window.location.href = "/therapy"; }, 1200);
        return;
      }
      window.location.href = "/therapy";
    } catch (err: any) {
      setMsg(friendlyAuthError(err?.code || err?.message));
    } finally { setBusy(false); }
  }

  async function onForgotPassword() {
    setMsg("");
    const em = email.trim();
    if (!em) { setMsg("Enter your email above first, then click Forgot password."); return; }
    setBusy(true);
    try {
      const emNorm = em.toLowerCase();
      const methods = await fetchSignInMethodsForEmail(auth, emNorm);
      if (!methods || methods.length === 0) {
        setMsg("No account found for this email. Please check or register a new account.");
        return;
      }
      if (!methods.includes("password")) {
        if (methods.includes("google.com")) { setMsg("This email uses Google sign-in. Please click Continue with Google."); return; }
        setMsg("This email does not have a password login. Please use the sign-in method you originally used.");
        return;
      }
      await sendPasswordResetEmail(auth, emNorm);
      setMsg("Password reset email sent. Check your inbox (and spam).");
    } catch (err: any) {
      setMsg(friendlyAuthError(err?.code || err?.message));
    } finally { setBusy(false); }
  }

  return (
    <main className="auth-page">
      <div className="auth-brand">
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="auth-logo-text">CalmTinnitus</span>
        </Link>
        <p className="auth-tagline">Tinnitus Relief &amp; Neuromodulation</p>
      </div>

      <div className="card">
        <h1>Welcome back</h1>
        <p className="muted">Log in to continue your tinnitus therapy sessions.</p>

        {msg ? <div className="alert">{msg}</div> : null}
        {successMsg ? <div className="success">{successMsg}</div> : null}

        <form onSubmit={onLoginEmail} className="form">
          <label className="label">Email
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" />
          </label>

          <label className="label">Password
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" type="password" autoComplete="current-password" />
          </label>

          <label className="label">Promo Code <span className="optional">(optional)</span>
            <input className="input promo-input" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="ENTER PROMO CODE FOR FULL ACCESS" maxLength={30} autoComplete="off" />
          </label>

          <button className="btn primary" disabled={!canSubmit || busy} type="submit">
            {busy ? "Working..." : "Log in"}
          </button>

          <div className="btn-row">
            <button className="btn secondary" type="button" onClick={onForgotPassword} disabled={busy}>Forgot password</button>
            <button className="btn google" type="button" onClick={onLoginGoogle} disabled={busy}>Continue with Google</button>
          </div>

          <p className="small center">
            {"Don't have an account? "}
            <Link href="/register" className="link-accent">Register</Link>
          </p>
        </form>
      </div>

      <Footer variant="minimal" />

      <style jsx>{`
        .auth-page { max-width:980px; margin:0 auto; padding:3rem 1rem 2.5rem; font-family:system-ui,-apple-system,sans-serif; display:flex; flex-direction:column; align-items:center; min-height:100vh; }
        .auth-brand { text-align:center; margin-bottom:1.5rem; }
        .auth-logo-text { font-size:1.8rem; font-weight:800; background:linear-gradient(135deg,#0ea5e9,#22c55e); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .auth-tagline { margin:0.25rem 0 0; font-size:0.85rem; color:#64748b; font-weight:500; }
        .card { width:100%; max-width:420px; background:#fff; border:1px solid #e5e7eb; border-radius:1.25rem; padding:2rem 1.75rem; box-shadow:0 14px 35px rgba(15,23,42,0.08); }
        h1 { margin:0 0 0.35rem; font-size:1.5rem; color:#0f172a; }
        .muted { margin:0 0 1.25rem; color:#64748b; line-height:1.5; font-size:0.9rem; }
        .alert { background:#fff7ed; border:1px solid #fed7aa; color:#9a3412; padding:0.75rem; border-radius:0.75rem; margin-bottom:1rem; font-weight:600; font-size:0.88rem; }
        .success { background:#f0fdf4; border:1px solid #86efac; color:#166534; padding:0.75rem; border-radius:0.75rem; margin-bottom:1rem; font-weight:700; text-align:center; font-size:0.88rem; }
        .form { display:grid; gap:0.9rem; }
        .label { display:grid; gap:0.3rem; color:#0f172a; font-weight:600; font-size:0.88rem; }
        .input { padding:0.7rem 0.85rem; border-radius:0.6rem; border:1px solid #d1d5db; outline:none; font-size:1rem; transition:border-color 0.2s; }
        .input:focus { border-color:#0ea5e9; box-shadow:0 0 0 3px rgba(14,165,233,0.1); }
        .promo-input { letter-spacing:1px; text-transform:uppercase; }
        .optional { font-weight:400; color:#94a3b8; font-size:0.82rem; }
        .btn { padding:0.7rem 1rem; border-radius:0.6rem; border:1px solid #d1d5db; font-weight:700; cursor:pointer; font-size:0.95rem; transition:0.2s; }
        .btn:disabled { opacity:0.5; cursor:not-allowed; }
        .btn.primary { background:linear-gradient(135deg,#0ea5e9,#0891b2); color:#fff; border:none; box-shadow:0 4px 12px rgba(14,165,233,0.25); }
        .btn.primary:hover:not(:disabled) { filter:brightness(1.05); }
        .btn-row { display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; }
        .btn.secondary { background:#fff; color:#475569; }
        .btn.secondary:hover:not(:disabled) { background:#f8fafc; }
        .btn.google { background:#fff; color:#0f172a; border-color:#d1d5db; }
        .btn.google:hover:not(:disabled) { background:#f8fafc; }
        .small { margin:0.5rem 0 0; color:#475569; font-size:0.9rem; }
        .center { text-align:center; }
        .link-accent { color:#0ea5e9; font-weight:600; text-decoration:none; }
        .link-accent:hover { text-decoration:underline; }
        @media (max-width:480px) { .card { padding:1.5rem 1.25rem; } .btn-row { grid-template-columns:1fr; } }
      `}</style>
    </main>
  );
}
