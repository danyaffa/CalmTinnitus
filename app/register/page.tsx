"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  fetchSignInMethodsForEmail,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, googleProvider, db, firebaseReady } from "../../lib/firebase";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor-core";

// PayPal config from env vars
const PAYPAL_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "";
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

// Promo code from env var
const PROMO_CODE = process.env.NEXT_PUBLIC_PROMO_CODE || "";

declare global {
  interface Window {
    paypal?: any;
  }
}

/**
 * Maps technical Firebase error codes to user-friendly messages.
 */
function friendlyFirebaseError(err: any) {
  const code = String(err?.code || "");
  const msg = String(err?.message || err || "");

  if (code === "auth/email-already-in-use" || msg.toLowerCase().includes("email-already-in-use")) {
    return "This email is already registered. Please click Log in (top right). If you forgot your password, use Forgot Password on the login page.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Google sign-in is not enabled. Please contact support.";
  }
  if (code === "auth/unauthorized-domain") {
    return "Google sign-in is blocked for this domain. Please contact support.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Sign-in window was closed before completion. Please try again.";
  }
  if (code === "auth/network-request-failed") {
    return "Network issue. Please check your connection and try again.";
  }
  return msg || "Something went wrong. Please try again.";
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

  // Promo code state
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState(false);

  // Intake capture state
  const [familyHistory, setFamilyHistory] = useState(false);
  const [sleepImpact, setSleepImpact] = useState(5);
  const [triggers, setTriggers] = useState<string[]>([]);

  const TRIGGER_OPTIONS = [
    "Loud noise exposure",
    "Stress or anxiety",
    "Lack of sleep",
    "Caffeine",
    "Medication side effects",
    "Jaw or neck tension",
  ];

  const toggleTrigger = (t: string) => {
    setTriggers((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const ensureUserDoc = async (user: User, payload: any) => {
    if (!firebaseReady || !db) return;

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

  const saveIntakeData = async (user: User) => {
    if (!firebaseReady || !db) return;

    const ref = doc(db, "users", user.uid);
    await setDoc(
      ref,
      {
        intake: {
          familyHistoryOfTinnitus: familyHistory,
          sleepImpactScore: sleepImpact,
          triggers,
          capturedAt: serverTimestamp(),
        },
      },
      { merge: true }
    );
  };

  const activateSubscription = async (
    user: User,
    subscriptionId: string
  ) => {
    if (!firebaseReady || !db) return;

    const ref = doc(db, "users", user.uid);
    await setDoc(
      ref,
      {
        subscriptionStatus: "active",
        accessType: "paypal",
        paypalSubscriptionId: subscriptionId,
        subscribedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // Load PayPal SDK and render button when entering the pay step
  useEffect(() => {
    if (step !== "pay" || !paypalContainerRef.current || !registeredUser) return;

    if (!PAYPAL_CLIENT_ID || !PAYPAL_PLAN_ID) return;

    const renderPayPalButton = () => {
      if (!window.paypal || !paypalContainerRef.current) return;

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

  // Handle promo code 
  const handlePromoSubmit = async () => {
    if (!registeredUser || !promoCode.trim()) return;

    setPromoError("");
    setPromoLoading(true);

    try {
      if (!PROMO_CODE) {
        setPromoError("Promo codes are not enabled right now.");
        return;
      }

      if (promoCode.trim().toUpperCase() !== PROMO_CODE.trim().toUpperCase()) {
        setPromoError("Invalid promo code.");
        return;
      }

      if (firebaseReady && db) {
        const ref = doc(db, "users", registeredUser.uid);
        await setDoc(
          ref,
          {
            subscriptionStatus: "active",
            accessType: "promo",
            promoCodeUsed: promoCode.trim().toUpperCase(),
            promoActivatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      setPromoSuccess(true);
      setTimeout(() => {
        router.push("/therapy");
      }, 1500);
    } catch (err) {
      console.error("Promo activation failed:", err);
      setPromoError("Something went wrong. Please try again.");
    } finally {
      setPromoLoading(false);
    }
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

    if (!auth) {
      return setError(
        "Authentication is not ready yet. Please refresh and try again."
      );
    }

    try {
      setLoading(true);

      // ✅ Check if user already exists before attempting registration
      const methods = await fetchSignInMethodsForEmail(auth, em);
      if (methods && methods.length > 0) {
        setError(friendlyFirebaseError({ code: "auth/email-already-in-use" }));
        setLoading(false);
        // Redirect to login with email pre-filled
        router.push(`/login?email=${encodeURIComponent(em)}`);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, em, password);
      await updateProfile(cred.user, { displayName: `${fn} ${ln}` });
      await ensureUserDoc(cred.user, {
        email: em,
        firstName: fn,
        lastName: ln,
        displayName: `${fn} ${ln}`,
        provider: "email",
      });
      await saveIntakeData(cred.user);

      setRegisteredUser(cred.user);
      setStep("pay");
    } catch (err: any) {
      setError(friendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSubmit() {
    setError("");

    if (!auth || !googleProvider) {
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
        const cred = await signInWithPopup(auth, googleProvider);
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
        await saveIntakeData(user as User);

        setRegisteredUser(user as User);
        setStep("pay");
      }
    } catch (err: any) {
      setError(friendlyFirebaseError(err));
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
                Step 1: Register. Step 2: Subscribe via PayPal or use a promo
                code. After that, you can log in anytime.
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

                {/* Intake capture */}
                <div style={styles.intakeSection}>
                  <p style={styles.intakeTitle}>
                    Help us personalise your experience (optional)
                  </p>

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={familyHistory}
                      onChange={(e) => setFamilyHistory(e.target.checked)}
                      style={styles.checkbox}
                    />
                    Family history of tinnitus
                  </label>

                  <div style={styles.field}>
                    <label style={styles.label}>
                      How much does tinnitus affect your sleep? ({sleepImpact}
                      /10)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={sleepImpact}
                      onChange={(e) => setSleepImpact(Number(e.target.value))}
                      style={{ width: "100%" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11,
                        color: "#64748b",
                      }}
                    >
                      <span>No impact</span>
                      <span>Severe</span>
                    </div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>
                      Common triggers (select any that apply)
                    </label>
                    <div style={styles.triggerGrid}>
                      {TRIGGER_OPTIONS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTrigger(t)}
                          style={{
                            ...styles.triggerChip,
                            ...(triggers.includes(t)
                              ? styles.triggerChipActive
                              : {}),
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button style={styles.button} disabled={loading}>
                  {loading
                    ? "Creating account..."
                    : "Register & Continue to Payment"}
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
                Account created! Complete your subscription below via PayPal, or
                enter a promo code to get access.
              </p>

              <div style={styles.priceBox}>
                <span style={styles.priceAmount}>$19.80 / month</span>
                <span style={styles.priceDetail}>Cancel anytime</span>
              </div>

              {error ? <div style={styles.error}>{error}</div> : null}

              {/* PayPal button */}
              {PAYPAL_CLIENT_ID && PAYPAL_PLAN_ID ? (
                <div
                  ref={paypalContainerRef}
                  id="paypal-button-container"
                  style={{ minHeight: 55, marginTop: 16 }}
                />
              ) : (
                <div style={styles.paypalMissing}>
                  PayPal is not configured yet. Please use a promo code below or
                  contact support.
                </div>
              )}

              {/* Promo code section */}
              <div style={styles.promoSection}>
                {!showPromo ? (
                  <button
                    type="button"
                    onClick={() => setShowPromo(true)}
                    style={styles.promoToggle}
                  >
                    Have a promo code?
                  </button>
                ) : promoSuccess ? (
                  <div style={styles.promoSuccessBox}>
                    Access activated! Redirecting to therapy...
                  </div>
                ) : (
                  <div style={styles.promoForm}>
                    <label style={styles.label}>Promo Code</label>
                    <div style={styles.promoInputRow}>
                      <input
                        style={styles.promoInput}
                        value={promoCode}
                        onChange={(e) =>
                          setPromoCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter code"
                        disabled={promoLoading}
                        maxLength={30}
                      />
                      <button
                        type="button"
                        onClick={handlePromoSubmit}
                        disabled={promoLoading || !promoCode.trim()}
                        style={styles.promoApplyBtn}
                      >
                        {promoLoading ? "Checking..." : "Apply"}
                      </button>
                    </div>
                    {promoError ? (
                      <div style={styles.promoError}>{promoError}</div>
                    ) : null}
                  </div>
                )}
              </div>

              <p style={styles.smallMuted}>
                Payments are processed securely by PayPal. You can cancel your
                subscription anytime from your PayPal account settings.
              </p>

              <p style={styles.disclaimer}>
                CalmTinnitus is a self-help sound tool and does not replace
                medical care. For sudden hearing changes or medical concerns,
                please seek professional help.
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
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap" as const,
  },
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
  smallMuted: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 12,
    textAlign: "center" as const,
  },
  footer: {
    maxWidth: 980,
    margin: "40px auto 0",
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
  },
  promoSection: {
    marginTop: 20,
    borderTop: "1px solid rgba(15, 23, 42, 0.08)",
    paddingTop: 16,
  },
  promoToggle: {
    background: "none",
    border: "none",
    color: "#0369a1",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
    textDecoration: "underline",
  },
  promoForm: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  promoInputRow: {
    display: "flex",
    gap: 8,
  },
  promoInput: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(15, 23, 42, 0.15)",
    outline: "none",
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  promoApplyBtn: {
    padding: "10px 20px",
    borderRadius: 12,
    border: "none",
    background: "#0f172a",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14,
    whiteSpace: "nowrap" as const,
  },
  promoError: {
    color: "#9f1239",
    fontSize: 13,
    fontWeight: 600,
  },
  promoSuccessBox: {
    background: "#f0fdf4",
    border: "1px solid #86efac",
    color: "#166534",
    padding: "12px 14px",
    borderRadius: 12,
    fontWeight: 700,
    textAlign: "center" as const,
  },
  paypalMissing: {
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    color: "#92400e",
    fontSize: 13,
    textAlign: "center" as const,
  },
  disclaimer: {
    marginTop: 16,
    padding: "10px 12px",
    background: "#f8fafc",
    borderRadius: 10,
    fontSize: 11,
    color: "#64748b",
    lineHeight: 1.5,
    textAlign: "center" as const,
  },
  intakeSection: {
    borderTop: "1px solid rgba(15, 23, 42, 0.08)",
    paddingTop: 14,
    marginTop: 4,
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  intakeTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
    margin: 0,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "#0f172a",
    cursor: "pointer",
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: "#0369a1",
  },
  triggerGrid: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
  },
  triggerChip: {
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#334155",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 500,
  },
  triggerChipActive: {
    background: "#0369a1",
    color: "white",
    borderColor: "#0369a1",
  },
};
