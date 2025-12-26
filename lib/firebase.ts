// FILE: lib/firebase.ts
// 🔒 FINAL CONTRACT — pages depend on THIS, not the other way around

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInAnonymously as _signInAnonymously,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

/* ------------------------------------------------------------------ */
/* INIT                                                               */
/* ------------------------------------------------------------------ */

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function hasConfig(cfg: Record<string, any>) {
  // projectId is the hard requirement; the rest are also required for real auth
  return Boolean(
    cfg?.apiKey &&
      cfg?.authDomain &&
      cfg?.projectId &&
      cfg?.storageBucket &&
      cfg?.messagingSenderId &&
      cfg?.appId
  );
}

function readConfig() {
  // 1) Standard Next env (baked at build time)
  const envCfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // 2) Optional runtime injection (useful in WebView / edge cases)
  const winCfg =
    typeof window !== "undefined"
      ? (window as any).__FIREBASE_CONFIG__
      : undefined;

  return hasConfig(envCfg) ? envCfg : winCfg;
}

function init() {
  if (app && auth && db) return true;

  const config = readConfig();

  // ✅ Never crash at import-time. If config is missing, app still loads.
  if (!config || !hasConfig(config)) {
    if (typeof window !== "undefined") {
      console.warn(
        "[Firebase] Config missing. Firebase disabled.\n" +
          "Expected NEXT_PUBLIC_FIREBASE_* env vars at build-time (or window.__FIREBASE_CONFIG__)."
      );
    }
    return false;
  }

  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  return true;
}

/* ------------------------------------------------------------------ */
/* 🔒 LEGACY EXPORTS (EVERY PAGE EXPECTS THESE)                        */
/* ------------------------------------------------------------------ */

// Keep named exports. They may be undefined if Firebase is not configured.
export { auth, db };

// Provider is safe to create even if Firebase isn't ready yet.
export const googleProvider = new GoogleAuthProvider();

// ✅ Accurate readiness flag (NOT always true)
export const firebaseReady = init();

/* ------------------------------------------------------------------ */
/* AUTH — ACCEPTS ANY CALL SHAPE                                       */
/* ------------------------------------------------------------------ */

// pages call: signInAnonymously()
// pages call: signInAnonymously(requireAuth())
export async function signInAnonymously(_ignored?: any) {
  if (!init() || !auth) {
    // Don’t crash UI; reject so callers can handle it.
    return Promise.reject(
      new Error(
        "Firebase not configured (missing NEXT_PUBLIC_FIREBASE_*). Cannot sign in."
      )
    );
  }
  return _signInAnonymously(auth);
}

// pages call: requireAuth()
export function requireAuth(cb?: (user: User | null) => void) {
  if (!init() || !auth) {
    // No-op unsubscribe + callback with null (keeps app running)
    try {
      cb?.(null);
    } catch {}
    return () => {};
  }
  return onAuthStateChanged(auth, cb ?? (() => {}));
}

/* ------------------------------------------------------------------ */
/* FIRESTORE — ACCEPT ALL CALL SHAPES                                  */
/* ------------------------------------------------------------------ */

type ReviewPayload = {
  userId: string;
  rating: number;
  comment: string;
  appName: string;
};

// pages call: addReview(userId, rating, comment, appName)
// widgets call: addReview({ userId, rating, comment, appName })
export async function addReview(
  a: string | ReviewPayload,
  b?: number,
  c?: string,
  d?: string
): Promise<void> {
  if (!init() || !db) {
    console.warn("[Firebase] addReview skipped (Firebase not configured).");
    return;
  }

  const data: ReviewPayload =
    typeof a === "string"
      ? { userId: a, rating: b ?? 0, comment: c ?? "", appName: d ?? "" }
      : a;

  await addDoc(collection(db, "reviews"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

/* ------------------------------------------------------------------ */
/* RE-EXPORTS USED ACROSS APP                                          */
/* ------------------------------------------------------------------ */

export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
};
