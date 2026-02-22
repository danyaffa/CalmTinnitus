// FILE: app/register/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, googleProvider, db, firebaseReady } from "../../lib/firebase";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";

// PayPal subscription plan ID — replace with your real PayPal plan ID
const PAYPAL_PLAN_ID = "P-XXXXXXXXXXXXXXXXXXXXXXXX";
// PayPal client ID — replace with your real PayPal client ID
const PAYPAL_CLIENT_ID = "YOUR_PAYPAL_CLIENT_ID";

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const year = useMemo(() => new Date().getFullYear(), []);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step tracking: "register" -> "pay"
  const [step, setStep] = useState<"register" | "pay">("register");
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalScriptLoaded = useRef(false);

  const ensureUserDoc = async (user: User, payload: any) => {
    if (!firebaseReady) return;

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

  const activateSubscription = async (
    user: User,
    subscriptionId: string
  ) => {
    if (!firebaseReady) return;

    const ref = doc(db, "users", user.uid);
    await setDoc(
      ref,
      {
        subscriptionStatus: "active",
        paypalSubscriptionId: subscriptionId,
        paymentProvider: "paypal",
        subscribedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // Load PayPal SDK and render button when entering the pay step
  useEffect(() => {
    if (step !== "pay" || !paypalContainerRef.current || !registeredUser) return;

    const renderPayPalButton = () => {
      if (!window.paypal || !paypalContainerRef.current) return;

      // Clear any existing buttons
      paypalContainerRef.current.innerHTML = "";

      window.paypal
        .Buttons({
          style: {
            shape: "pill",
            color: "blue",
            layout: "vertical",
            label: "subscribe",
          },
          createSubscription: (_data: any, actions: any) => {
            return actions.subscription.create({
              plan_id: PAYPAL_PLAN_ID,
            });
          },
          onApprove: async (data: any) => {
            try {
              await activateSubscription(registeredUser, data.subscriptionID);
              router.push("/therapy");
            } catch (err) {
              console.error("Failed to activate subscription:", err);
              setError(
                "Payment received but account activation failed. Please contact support."
              );
            }
          },
          onError: (err: any) => {
            console.error("PayPal error:", err);
            setError("Payment failed. Please try again.");
          },
        })
        .render(paypalContainerRef.current);
    };

    if (window.paypal) {
      renderPayPalButton();
      return;
    }

    if (!paypalScriptLoaded.current) {
      paypalScriptLoaded.current = true;
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
      script.setAttribute("data-sdk-integration-source", "button-factory");
      script.onload = renderPayPalButton;
      script.onerror = () =>
        setError("Failed to load PayPal. Please refresh and try again.");
      document.body.appendChild(script);
    }
  }, [step, registeredUser, router]);

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

    const authInstance = auth;
    if (!authInstance) {
      return setError(
        "Authentication is not ready yet. Please refresh and try again."
      );
    }

    try {
      setLoading(true);

      const cred = await createUserWithEmailAndPassword(
        authInstance,
        em,
        password
      );
      await updateProfile(cred.user, { displayName: `${fn} ${ln}` });
      await ensureUserDoc(cred.user, {
        email: em,
        firstName: fn,
        lastName: ln,
        displayName: `${fn} ${ln}`,
        provider: "email",
      });

      setRegisteredUser(cred.user);
      setStep("pay");
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSubmit() {
    setError("");

    const authInstance = auth;
    if (!authInstance) {
      return setError(
        "Authentication is not ready yet. Please refresh and try again."
      );
    }

    try {
      setLoading(true);

      let user;
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        user = result.user;
      } else {
        const cred = await signInWithPopup(authInstance, googleProvider);
        user = cred.user;
      }

      if (user) {
        const displayName = user.displayName || "";
        const parts = displayName.split(" ").filter(Boolean);
        const fn = (parts[0] || firstName || "").trim();
        const ln = (parts.slice(1).join(" ") || lastName || "").trim();
        const em = (user.email || email || "").trim().toLowerCase();

        await ensureUserDoc(user as User, {
          email: em || null,
          firstName: fn || null,
          lastName: ln || null,
          displayName: displayName || `${fn} ${ln}`.trim() || null,
          provider: "google",
        });

        setRegisteredUser(user as User);
        setStep("pay");
      }
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err);
      setError(msg || "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <img
            src="/CalmTinnitus-Logo.png"
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
          {step === "register" ? (
            <>
              <h1 style={styles.h1}>Create your account</h1>
              <p style={styles.p}>
                Step 1: Register. Step 2: Subscribe via PayPal. After payment,
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
                  {loading ? "Creating account..." : "Register & Continue to Payment"}
                </button>

                <button
                  type="button"
                  style={styles.buttonSecondary}
                  onClick={handleGoogleSubmit}
                  disabled={loading}
                >
                  {loading ? "Please wait..." : "Register with Google"}
                </button>

                <p style={styles.small}>
                  Already registered? <Link href="/login">Log in</Link>
                </p>
              </form>
            </>
          ) : (
            <>
              <h1 style={styles.h1}>Subscribe to CalmTinnitus</h1>
              <p style={styles.p}>
                Account created! Complete your subscription below via PayPal to
                get full access.
              </p>

              <div style={styles.priceBox}>
                <span style={styles.priceAmount}>$19.80 / month</span>
                <span style={styles.priceDetail}>Cancel anytime</span>
              </div>

              {error ? <div style={styles.error}>{error}</div> : null}

              <div
                ref={paypalContainerRef}
                id="paypal-button-container"
                style={{ minHeight: 55, marginTop: 16 }}
              />

              <p style={styles.smallMuted}>
                Payments are processed securely by PayPal. You can cancel your
                subscription anytime from your PayPal account settings.
              </p>
            </>
          )}
        </div>
      </main>

      <footer style={styles.footer}>
        &copy; {year} Leffler International Investments Pty Ltd
      </footer>
    </div>
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
    flexWrap: "wrap" as const,
    gap: 10,
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  nav: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const },
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
    fontSize: 14,
  },
  buttonSecondary: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(15, 23, 42, 0.2)",
    background: "white",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14,
  },
  priceBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "16px",
    background: "#f0f9ff",
    borderRadius: 12,
    border: "1px solid #bae6fd",
  },
  priceAmount: {
    fontWeight: 800,
    fontSize: 22,
    color: "#0369a1",
  },
  priceDetail: {
    fontSize: 13,
    color: "#64748b",
  },
  small: { marginTop: 6, color: "#475569", fontSize: 13 },
  smallMuted: { marginTop: 12, color: "#64748b", fontSize: 12, textAlign: "center" as const },
  footer: {
    maxWidth: 980,
    margin: "40px auto 0",
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
  },
};
