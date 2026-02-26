// FILE: lib/firebase.ts

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
/* 1. CONFIGURATION                                                    */
/* ------------------------------------------------------------------ */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check for missing config — warn but don't crash the build
let configValid = true;
Object.entries(config).forEach(([key, value]) => {
  if (!value) {
    configValid = false;
    console.warn(
      `⚠ Missing NEXT_PUBLIC_FIREBASE_${key
        .replace(/([A-Z])/g, "_$1")
        .toUpperCase()} — Firebase features will be unavailable until set.`
    );
  }
});

/* ------------------------------------------------------------------ */
/* 2. INITIALIZATION                                                  */
/* ------------------------------------------------------------------ */

let app: FirebaseApp;
let _auth: Auth;
let _db: Firestore;
let firebaseReady = false;

if (configValid) {
  try {
    app = getApps().length ? getApp() : initializeApp(config as any);
    _auth = getAuth(app);
    _db = getFirestore(app);
    firebaseReady = true;
  } catch (error) {
    console.error("Firebase Initialization Failed:", error);
  }
}

// Exported as non-null for backward compatibility — check `firebaseReady` before use
const auth = _auth!;
const db = _db!;

export { auth, db, firebaseReady };
export const googleProvider = configValid ? new GoogleAuthProvider() : null;

/* ------------------------------------------------------------------ */
/* 3. HELPERS                                                          */
/* ------------------------------------------------------------------ */

export async function signInAnonymously() {
  if (!auth) throw new Error("Firebase auth not initialized");
  return _signInAnonymously(auth);
}

export function requireAuth(cb?: (user: User | null) => void) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, cb ?? (() => {}));
}

type ReviewPayload = {
  userId: string;
  rating: number;
  comment: string;
  appName: string;
};

export async function addReview(
  a: string | ReviewPayload,
  b?: number,
  c?: string,
  d?: string
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
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
/* 4. RE-EXPORTS                                                      */
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
