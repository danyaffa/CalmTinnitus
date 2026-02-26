// FILE: lib/firebaseAdmin.ts
// Firebase Admin SDK singleton for server-side operations (API routes)

import * as admin from "firebase-admin";

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const clientEmail =
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
let privateKey =
  process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
  process.env.FIREBASE_PRIVATE_KEY ||
  "";

// Vercel sometimes wraps the key in extra quotes
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
// Convert escaped newlines to real newlines
privateKey = privateKey.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    } catch (err) {
      console.error("Firebase Admin init error:", err);
    }
  } else {
    console.warn(
      "Firebase Admin: missing credentials (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY)"
    );
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
