// FILE: /lib/firebase.ts
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
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

/* ------------------------------------------------------------------ */
/* SINGLETON INIT                                                       */
/* ------------------------------------------------------------------ */

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

function init() {
  if (app && auth && db) return;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!config.projectId) throw new Error("Firebase env missing");

  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}

init();

/* ------------------------------------------------------------------ */
/* 🔒 LEGACY EXPORTS (EVERY PAGE EXPECTS THESE)                          */
/* ------------------------------------------------------------------ */

export { auth, db };
export const googleProvider = new GoogleAuthProvider();
export const firebaseReady = true;

/* ------------------------------------------------------------------ */
/* AUTH — ACCEPTS ANY CALL SHAPE                                        */
/* ------------------------------------------------------------------ */

// pages call: signInAnonymously()
// pages call: signInAnonymously(requireAuth())
export async function signInAnonymously(_ignored?: any) {
  return _signInAnonymously(auth);
}

// pages call: requireAuth()
export function requireAuth(cb?: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb ?? (() => {}));
}

/* ------------------------------------------------------------------ */
/* FIRESTORE RE-EXPORTS (DO NOT REMOVE)                                 */
/* ------------------------------------------------------------------ */

export {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
};

/* ------------------------------------------------------------------ */
/* REVIEWS — BACKWARD + FORWARD SAFE                                   */
/* ------------------------------------------------------------------ */

type ReviewPayload = {
  userId: string;
  rating: number;
  comment: string;
  appName: string;
};

export async function addReview(payload: ReviewPayload): Promise<void>;
export async function addReview(
  userId: string,
  rating: number,
  comment: string,
  appName: string
): Promise<void>;

export async function addReview(
  a: ReviewPayload | string,
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
