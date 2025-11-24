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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// Firebase config via environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Avoid SSR initialization crash
const isBrowser = typeof window !== "undefined";

// Initialize app safely
const app = isBrowser
  ? !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

// Export usable Firebase services
export const auth = app ? getAuth(app) : (null as any);
export const googleProvider = app ? new GoogleAuthProvider() : (null as any);
export const db = app ? getFirestore(app) : (null as any);

// Re-export helpers
export {
  onAuthStateChanged,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
};

export type { User };

// Optional UI helpers
export const firebaseGoogleSignIn = async () => {
  if (!auth || !googleProvider) {
    throw new Error("Firebase Auth not initialized.");
  }
  await signInWithPopup(auth, googleProvider);
};

export const firebaseSignOut = async () => {
  if (!auth) return;
  await signOut(auth);
};
