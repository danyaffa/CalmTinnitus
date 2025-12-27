// FILE: lib/firebase.ts
// 🔒 FINAL CONTRACT — STRICT VERSION
// This forces the build to fail if keys are missing, preventing empty-key builds.

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
/* 1. CONFIGURATION & SANITY CHECK                                    */
/* ------------------------------------------------------------------ */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 🛑 HARD STOP: If these are missing during build, THROW ERROR.
// This prevents "Collecting page data" hangs and "api-key-not-valid" at runtime.
Object.entries(config).forEach(([key, value]) => {
  if (!value) {
    const errorMsg = `❌ FATAL BUILD ERROR: Missing 'NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}' in .env.local`;
    console.error(errorMsg);
    // Throwing here stops the build immediately if variables aren't found.
    if (typeof window === "undefined") throw new Error(errorMsg);
  }
});

/* ------------------------------------------------------------------ */
/* 2. INITIALIZATION                                                  */
/* ------------------------------------------------------------------ */

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  // Singleton pattern: if app exists, use it; otherwise init
  app = getApps().length ? getApp() : initializeApp(config as any);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Initialization Failed:", error);
  // Re-throw so we know it broke
  throw error;
}

// Export instances directly
export { auth, db };
export const googleProvider = new GoogleAuthProvider();
export const firebaseReady = true;

/* ------------------------------------------------------------------ */
/* 3. HELPERS (Updated to use the reliable instances)                 */
/* ------------------------------------------------------------------ */

export async function signInAnonymously() {
  return _signInAnonymously(auth);
}

export function requireAuth(cb?: (user: User | null) => void) {
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
