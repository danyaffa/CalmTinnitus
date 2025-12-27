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

let app!: FirebaseApp;
let auth!: Auth;
let db!: Firestore;

// We keep the “don’t crash at import time” behavior,
// BUT we also keep exports strongly typed so pages compile.
let _firebaseReady = false;

function init() {
  if (_firebaseReady) return;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };

  // ✅ Don’t crash at import time on Android/WebView.
  // If env is missing, we mark firebaseReady=false and keep the app running.
  if (!config.projectId) {
    if (typeof window !== "undefined") {
      console.warn(
        "[Firebase] Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID. Firebase will be disabled at runtime."
      );
    }
    _firebaseReady = false;
    return;
  }

  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);

  _firebaseReady = true;
}

init();

/* ------------------------------------------------------------------ */
/* 🔒 LEGACY EXPORTS (EVERY PAGE EXPECTS THESE)                        */
/* ------------------------------------------------------------------ */

// ✅ Strongly typed exports so TypeScript doesn’t break all pages.
export { auth, db };

export const googleProvider = new GoogleAuthProvider();

// ✅ Accurate readiness flag
export const firebaseReady = _firebaseReady;

/* ------------------------------------------------------------------ */
/* AUTH — ACCEPTS ANY CALL SHAPE                                       */
/* ------------------------------------------------------------------ */

// pages call: signInAnonymously()
// pages call: signInAnonymously(requireAuth())
export async function signInAnonymously(_ignored?: any) {
  init();
  if (!_firebaseReady) {
    return Promise.reject(
      new Error("Firebase not configured (missing NEXT_PUBLIC_FIREBASE_*).")
    );
  }
  return _signInAnonymously(auth);
}

// pages call: requireAuth()
export function requireAuth(cb?: (user: User | null) => void) {
  init();
  if (!_firebaseReady) {
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
  init();
  if (!_firebaseReady) {
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
