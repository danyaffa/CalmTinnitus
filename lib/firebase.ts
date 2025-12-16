// FILE: /lib/firebase.ts
// 🔒 STABLE FIREBASE API – do NOT change pages anymore

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

/* ------------------------------------------------------------------ */
/*  SAFE INITIALISATION (NO BUILD / SSR CRASH)                          */
/* ------------------------------------------------------------------ */

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function ensureFirebase() {
  if (app && auth && db) return { app, auth, db };

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.projectId) {
    throw new Error("Firebase env vars missing");
  }

  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  return { app, auth, db };
}

/* ------------------------------------------------------------------ */
/*  AUTH (ANONYMOUS – SAFE)                                             */
/* ------------------------------------------------------------------ */

export async function getAnonymousUser(): Promise<User> {
  const { auth } = ensureFirebase();

  if (auth.currentUser) return auth.currentUser;

  const cred = await signInAnonymously(auth);
  return cred.user;
}

/* ------------------------------------------------------------------ */
/*  REVIEWS – BACKWARD + FORWARD COMPATIBLE                             */
/* ------------------------------------------------------------------ */

type ReviewPayload = {
  userId: string;
  rating: number;
  comment: string;
  appName: string;
};

/**
 * ✅ ACCEPTS BOTH:
 *  addReview({ userId, rating, comment, appName })
 *  addReview(userId, rating, comment, appName)
 */
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
  const { db } = ensureFirebase();

  const data: ReviewPayload =
    typeof a === "string"
      ? {
          userId: a,
          rating: b ?? 0,
          comment: c ?? "",
          appName: d ?? "unknown",
        }
      : a;

  await addDoc(collection(db, "reviews"), {
    userId: data.userId,
    rating: data.rating,
    comment: data.comment,
    appName: data.appName,
    createdAt: serverTimestamp(),
  });
}

/* ------------------------------------------------------------------ */
/*  EXPORTS (LOCKED)                                                    */
/* ------------------------------------------------------------------ */

export function getFirebase() {
  return ensureFirebase();
}
