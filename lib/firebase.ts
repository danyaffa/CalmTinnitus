// /lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import type { User } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";

// Use env vars but DON'T force non-null – avoid crashes if not set
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ✅ Important: do NOT initialize Firebase on the server (build time)
const isBrowser = typeof window !== "undefined";

const app = isBrowser
  ? !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

// These will be real instances in the browser, and harmless placeholders on the server
export const auth = app ? getAuth(app) : (null as any);
export const googleProvider = app ? new GoogleAuthProvider() : (null as any);
export const db = app ? getFirestore(app) : (null as any);

// Re-export auth + firestore helpers used in AuthProvider and pages
export {
  onAuthStateChanged,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
};

// ✅ Type-only re-export
export type { User };

// Small helper functions used in pages (login, therapy, etc.)
export const firebaseGoogleSignIn = async () => {
  if (!auth || !googleProvider) {
    // Should never happen in the browser, but protects build/server
    throw new Error("Firebase Auth not initialized in this environment.");
  }
  await signInWithPopup(auth, googleProvider);
};

export const firebaseSignOut = async () => {
  if (!auth) return;
  await signOut(auth);
};
