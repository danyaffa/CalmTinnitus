"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Head from "next/head";

import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../../lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const year = useMemo(() => new Date().getFullYear(), []);

  // Optional name capture (matches your uploaded layout)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkoutUrl =
    process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL ||
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_URL ||
    "";

  const isNative = () =>
    typeof window !== "undefined" &&
    // @ts-ignore
    !!window.Capacitor &&
    // @ts-ignore
    typeof window.Capacitor.isNativePlatform === "function" &&
    // @ts-ignore
    window.Capacitor.isNativePlatform();

  const ensureUserDoc = async (user: User, payload: any) => {
    const ref = doc(db, "users", user.uid);
    await setDoc(
      ref,
      {
        uid: user.uid,
        createdAt: serverTimestamp(),
        subscriptionStatus: "pending_payment",
        ...payload,
      },
      { merge: true }
    );
  };

  const goToStripe = (prefillEmail?: string) => {
    if (!checkoutUrl) {
      setError(
        "Stripe checkout URL is missing. Set NEXT_PUBLIC_STRIPE_CHECKOUT_URL in Vercel."
      );
      return;
    }
    const url = new URL(checkoutUrl);
    if (prefillEmail) url.searchParams.set("prefilled_email", prefillEmail);
    window.location.href = url.toString();
  };

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim().toLowerCase();

    if (!fn || !ln) return setError("Please enter your first and last name.");
    if (!em) return setError("Please enter your email.");
    if (!password || password.length < 6)
      return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    // IMPORTANT: Stripe in native builds can violate store rules (warning)
    if (isNative()) {
      return setError(
        "You are using the mobile (native) build. Stripe checkout may not be allowed inside store apps. Use the website for Stripe payments, or switch to in-app purchases for Google Play later."
      );
    }

    if (!checkoutUrl) {
      return setError(
        "Stripe checkout URL is missing. Set NEXT_PUBLIC_STRIPE_CHECKOUT_URL in Vercel."
      );
    }

    const authInstance = auth;
    if (!authInstance) {
      return setError(
        "Authentication is not ready yet. Please refresh and try again."
      );
    }

    try {
      setLoading(true);

      // 1) Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(authInstance, em, password);

      // 2) Update display name (nice to have)
      await updateProfile(cred.user, { displayName: `${fn} ${ln}` });

      // 3) Write Firestore user doc (this is what you’re missing today)
      await ensureUserDoc(cred.user, {
        email: em,
        firstName: fn,
        lastName: ln,
        displayName: `${fn} ${ln}`,
        provider: "email",
      });

      // 4) Redirect to Stripe (payment required BEFORE access)
      goToStripe(em);

      // NOTE: do NOT push to /therapy here
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err);

      if (msg.includes("auth/email-already-in-use")) {
        setError("This email is already registered. Please log in instead.");
      } else if (msg.includes("auth/invalid-email")) {
        setError("That email looks invalid. Please check and try again.");
      } else if (msg.includes("auth/weak-password")) {
        setError("Password is too weak. Please use at least 6 characters.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSubmit() {
    setError("");

    if (isNative()) {
      return setError(
        "You are using the mobile (native) build. Stripe checkout may not be allowed inside store apps. Use the website for Stripe payments, or switch to in-app purchases for Google Play later."
      );
    }

    if (!checkoutUrl) {
      return setError(
        "Stripe checkout URL is missing. Set NEXT_PUBLIC_STRIPE_CHECKOUT_URL in Vercel."
      );
    }

    const authInstance = auth;
    if (!authInstance) {
      return setError(
        "Authentication is not ready yet. Please refresh and try again."
      );
    }

    try {
      setLoading(true);

      const cred = await signInWithPopup(authInstance, googleProvider);

      const displayName = cred.user.displayName || "";
      const parts = displayName.split(" ").filter(Boolean);
      const fn = (parts[0] || firstName || "").trim();
      const ln = (parts.slice(1).join(" ") || lastName || "").trim();
      const em = (cred.user.email || email || "").trim().toLowerCase();

      // Write Firestore user doc
      await ensureUserDoc(cred.user, {
        email: em || null,
        firstName: fn || null,
        lastName: ln || null,
        displayName: displayName || `${fn} ${ln}`.trim() || null,
        provider: "google",
      });

      // Redirect to Stripe
      goToStripe(em || undefined);
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err);
      setError(msg || "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Register — CalmTinnitus</title>
        <meta
          name="description"
          content="Create your CalmTinnitus account and activate access."
        />
      </Head>

      <div style={styles.page}>
        <header style={styles.header}>
          <div style={styles.brand}>
            <img
              src="/logo.png"
              alt="CalmTinnitus"
              style={{ height: 42 }}
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
          </div>

          <nav style={styles.nav}>
            <Link href="/qa" style={styles.link}>
              Q&amp;A
            </Link>
            <Link href="/login" style={styles.link}>
              Log in
            </Link>
            <span style={styles.activePill}>Register</span>
          </nav>
        </header>

        <main style={styles.main}>
          <div style={styles.card}>
            <h1 style={styles.h1}>Create your account</h1>
            <p style={styles.p}>
              Register first (Firebase account), then complete payment (Stripe).
              After that you can log in anytime.
            </p>

            {error ? <div style={styles.error}>{error}</div> : null}

            <form onSubmit={handleEmailSubmit} style={styles.form}>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>First name</label>
                  <input
                    style={styles.input}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    disabled={loading}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Last name</label>
                  <input
                    style={styles.input}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Password</label>
                  <input
                    style={styles.input}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Confirm</label>
                  <input
                    style={styles.input}
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>

              <button style={styles.button} disabled={loading}>
                {loading ? "Creating account…" : "Register & Pay"}
              </button>

              <button
                type="button"
                style={styles.buttonSecondary}
                onClick={handleGoogleSubmit}
                disabled={loading}
              >
                {loading ? "Please wait…" : "Register with Google & Pay"}
              </button>

              <p style={styles.small}>
                Already registered? <Link href="/login">Log in</Link>
              </p>
            </form>
          </div>
        </main>

        <footer style={styles.footer}>
          © {year} Leffler International Investments Pty Ltd
        </footer>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f6fbff 0%, #ffffff 60%)",
    padding: 20,
    fontFamily:
      'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    color: "#0f172a",
  },
  header: {
    maxWidth: 980,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 0 20px",
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  nav: { display: "flex", alignItems: "center", gap: 14 },
  link: { textDecoration: "none", color: "#0f172a", fontWeight: 600 },
  activePill: {
    background: "#0f172a",
    color: "white",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 13,
  },
  main: {
    maxWidth: 980,
    margin: "0 auto",
    display: "flex",
    justifyContent: "center",
    paddingTop: 30,
  },
  card: {
    width: "100%",
    maxWidth: 560,
    background: "white",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid rgba(15, 23, 42, 0.06)",
  },
  h1: { margin: 0, fontSize: 26, letterSpacing: -0.3 },
  p: { marginTop: 8, marginBottom: 16, color: "#334155", lineHeight: 1.5 },
  error: {
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#9f1239",
    padding: "10px 12px",
    borderRadius: 12,
    marginBottom: 14,
    fontWeight: 600,
  },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(15, 23, 42, 0.15)",
    outline: "none",
    fontSize: 14,
  },
  button: {
    marginTop: 6,
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    background: "#0f172a",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  },
  buttonSecondary: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(15, 23, 42, 0.2)",
    background: "white",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  },
  small: { marginTop: 6, color: "#475569", fontSize: 13 },
  footer: {
    maxWidth: 980,
    margin: "40px auto 0",
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
  },
};
