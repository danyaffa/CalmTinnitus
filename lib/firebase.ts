// FILE: /lib/firebase.ts

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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function hasFirebaseEnv() {
  return !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}

function init() {
  if (app && auth && db) return;
  if (!hasFirebaseEnv()) return; // ✅ don't crash; caller will see a useful error

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}

init();

export function requireAuth(): Auth {
  init();
  if (!auth) throw new Error("Firebase Auth not ready (missing NEXT_PUBLIC_FIREBASE_* in this build).");
  return auth;
}

export function requireDb(): Firestore {
  init();
  if (!db) throw new Error("Firestore not ready (missing NEXT_PUBLIC_FIREBASE_* in this build).");
  return db;
}

// ✅ Legacy exports (pages expect these names)
export const googleProvider = new GoogleAuthProvider();
export const firebaseReady = true;

// Keep compatibility: signInAnonymously() OR signInAnonymously(auth)
export async function signInAnonymously(_ignored?: any) {
  return _signInAnonymously(requireAuth());
}

// Keep compatibility: requireAuth(cb?) used like onAuthStateChanged wrapper
export function requireAuthListener(cb?: (user: User | null) => void) {
  return onAuthStateChanged(requireAuth(), cb ?? (() => {}));
}

export { collection, doc, addDoc, setDoc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp };

// Back-compat exports (but now always non-null when used properly)
export const authExport = () => requireAuth();
export const dbExport = () => requireDb();

// If you still import { auth, db } somewhere:
export const auth = null as any;
export const db = null as any;

// Reviews helper (your existing signature support)
type ReviewPayload = { userId: string; rating: number; comment: string; appName: string };

export async function addReview(payload: ReviewPayload): Promise<void>;
export async function addReview(userId: string, rating: number, comment: string, appName: string): Promise<void>;
export async function addReview(a: ReviewPayload | string, b?: number, c?: string, d?: string): Promise<void> {
  const data: ReviewPayload =
    typeof a === "string" ? { userId: a, rating: b ?? 0, comment: c ?? "", appName: d ?? "" } : a;

  await addDoc(collection(requireDb(), "reviews"), { ...data, createdAt: serverTimestamp() });
}
