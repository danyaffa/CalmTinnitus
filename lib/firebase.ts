// FILE: /lib/firebase.ts
// Safe Firebase init (never hard-crashes at import-time)

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInAnonymously,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  limit,
  type Firestore,
} from "firebase/firestore";

// ---- Config ----
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const hasFirebaseConfig =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId;

// ---- Internal singletons (NO name collisions) ----
let firebaseAppInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

try {
  if (hasFirebaseConfig) {
    firebaseAppInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(firebaseAppInstance);
    dbInstance = getFirestore(firebaseAppInstance);
  }
} catch (err) {
  firebaseAppInstance = null;
  authInstance = null;
  dbInstance = null;
  // eslint-disable-next-line no-console
  console.error("[Firebase] init failed (app will run without Firebase):", err);
}

export const firebaseReady = !!firebaseAppInstance && !!authInstance && !!dbInstance;

// ---- Exports (services) ----
export const firebaseApp = firebaseAppInstance;
export const authClient = authInstance;
export const dbClient = dbInstance;

// Backward-compatible names used across the repo
// NOTE: These remain nullable for "safe init" behavior.
export const auth = authClient;
export const db = dbClient;

export const provider = new GoogleAuthProvider();
export const googleProvider = provider;

// ✅ NEW: Non-null accessors (stop TypeScript chasing everywhere)
//
// Use these in pages/components where Firebase is REQUIRED.
// They throw a clear error if Firebase isn't configured, instead of causing TS null issues.
export function requireAuth(): Auth {
  if (!authInstance) {
    throw new Error(
      "Firebase Auth is not initialised. Check NEXT_PUBLIC_FIREBASE_* env vars."
    );
  }
  return authInstance;
}

export function requireDb(): Firestore {
  if (!dbInstance) {
    throw new Error(
      "Firebase Firestore is not initialised. Check NEXT_PUBLIC_FIREBASE_* env vars."
    );
  }
  return dbInstance;
}

export function requireFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!firebaseAppInstance || !authInstance || !dbInstance) {
    throw new Error(
      "Firebase is not initialised. Check NEXT_PUBLIC_FIREBASE_* env vars."
    );
  }
  return { app: firebaseAppInstance, auth: authInstance, db: dbInstance };
}

// ---- Re-export helpers ----
export {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInAnonymously,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  limit,
};

export type { User };
