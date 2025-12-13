// FILE: /lib/firebase.ts

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
  doc, // Added
  setDoc, // Added
  updateDoc, // Added
  getDoc, // Added
  deleteDoc, // Added
  limit, // Added
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

// Initialize app safely (simplified)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export usable Firebase services
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider(); // Renamed from googleProvider
export const db = getFirestore(app);

// Re-export helpers
export {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
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
