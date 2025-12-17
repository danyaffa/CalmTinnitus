"use client";

import React, { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  // Layout fields (based on your preferred style)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Auth fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Hardcoded Stripe Payment Link (as you requested)
  // NOTE: If Stripe shows "The link is no longer active", you must re-enable/recreate it in Stripe.
  const checkoutUrl = "https://buy.stripe.com/fZu4gz44u2XS1UL9xG4F20e";

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
      setError("Stripe checkout URL is missing.");
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

    // ⚠️ Keep this warning so you don’t get surprised with Play/App Store policy later
    if (isNative()) {
      return setError(
        "You are using the mobile (native) build. Stripe checkout may not be allowed inside store apps. Use the website for Stripe payments, or switch to in-app purchases for Google Play later."
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

      // 2) Set display name
      await updateProfile(cred.user, { displayName: `${fn} ${ln}` });

      // 3) Create Firestore user doc (so you see it in Firestore)
      await ensureUserDoc(cred.user, {
        email: em,
        firstName: fn,
        lastName: ln,
        displayName: `${fn} ${ln}`,
        provider: "email",
      });

      // 4) Redirect to Stripe payment BEFORE access
      goToStripe(em);

      // NOTE: we do NOT route into the app here.
      // router.push("/therapy") must only happen after confirmed payment (webhook/return page).
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

      await ensureUserDoc(cred.user, {
        email: em || null,
        firstName: fn || null,
        lastName: ln || null,
        displayName: displayName || `${fn} ${ln}`.trim() || null,
        provider: "google",
      });

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
              onError={(e) =>
                ((e.currentTarget as HTMLImageElement).style.display = "none")
              }
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
              Step 1: Register (Firebase). Step 2: Pay (Stripe). After payment,
              you can log in anytime.
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
                    type={showPassword ? "text" : "password"}
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
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={loading}
                style={styles.pwToggle}
              >
                {showPassword ? "Hide password" : "See password"}
              </button>

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

              <p style={styles.smallMuted}>
                If Stripe shows “The link is no longer active”, the payment link
                must be re-enabled in your Stripe dashboard.
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
  pwToggle: {
    background: "none",
    border: "none",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
    textAlign: "left",
    padding: 0,
    marginTop: -2,
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
  smallMuted: { marginTop: 2, color: "#64748b", fontSize: 12 },
  footer: {
    maxWidth: 980,
    margin: "40px auto 0",
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
  },
};
