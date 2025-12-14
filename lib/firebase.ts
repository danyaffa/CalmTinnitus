// FILE: /lib/firebase.ts
//
// IMPORTANT:
// This file must NEVER hard-crash the app at import-time.
// If Firebase env vars are missing (common in local Android/Capacitor builds),
// we keep the app running and expose a 'firebaseReady' flag for the UI.

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

// ---- Config + Safe init ----
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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  if (hasFirebaseConfig) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (err) {
  // Never crash the whole app at import time.
  app = null;
  auth = null;
  db = null;
  // eslint-disable-next-line no-console
  console.error("[Firebase] init failed (app will run without Firebase):", err);
}

export const firebaseReady = !!app && !!auth && !!db;

// ---- Exports (services) ----
// These are nullable by design; callers must guard with `firebaseReady`.
export const firebaseApp = app;
export const authClient = auth;
export const dbClient = db;

// Backward-compatible aliases (older files import these names)
export const auth = authClient;
export const db = dbClient;

export const provider = new GoogleAuthProvider();
export const googleProvider = provider;

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
