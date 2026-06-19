// FILE: utils/firebaseAdmin.ts
import * as admin from "firebase-admin";

/**
 * Resolves Firebase Admin credentials from the environment. Supports two setups:
 *
 *   1. A full service-account JSON ({ ... }) pasted into one of:
 *      FIREBASE_SERVICE_ACCOUNT_KEY, FIREBASE_SERVICE_ACCOUNT, or
 *      FIREBASE_PRIVATE_KEY (auto-detected when the value looks like JSON).
 *   2. The three individual fields: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
 *      FIREBASE_PRIVATE_KEY.
 *
 * The private key is normalised for the common Vercel quirks (surrounding
 * quotes and "\n"-escaped newlines).
 */

type Creds = { projectId: string; clientEmail: string; privateKey: string };

function normalisePrivateKey(raw: string): string {
  let key = (raw || "").trim();
  // Vercel sometimes wraps the value in extra quotes
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  // Convert "\n" to real newlines
  return key.replace(/\\n/g, "\n");
}

function fromJson(raw: string): Creds | null {
  try {
    const obj = JSON.parse(raw);
    const projectId = obj.project_id || obj.projectId;
    const clientEmail = obj.client_email || obj.clientEmail;
    const privateKey = normalisePrivateKey(obj.private_key || obj.privateKey || "");
    if (projectId && clientEmail && privateKey) {
      return { projectId, clientEmail, privateKey };
    }
  } catch {
    // not valid JSON — fall through to individual-field handling
  }
  return null;
}

function resolveCreds(): Creds | null {
  // 1) Dedicated full-JSON env vars
  const jsonCandidate =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    "";
  if (jsonCandidate.trim().startsWith("{")) {
    const fromDedicated = fromJson(jsonCandidate);
    if (fromDedicated) return fromDedicated;
  }

  // 2) Someone pasted the whole JSON into FIREBASE_PRIVATE_KEY by mistake — handle it
  const rawPrivate = process.env.FIREBASE_PRIVATE_KEY || "";
  if (rawPrivate.trim().startsWith("{")) {
    const fromPrivate = fromJson(rawPrivate);
    if (fromPrivate) return fromPrivate;
  }

  // 3) Individual fields
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalisePrivateKey(rawPrivate);
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

if (!admin.apps.length) {
  const creds = resolveCreds();
  if (!creds) {
    console.warn(
      "⚠ Firebase Admin missing credentials. Provide FIREBASE_SERVICE_ACCOUNT_KEY " +
        "(full service-account JSON) or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + " +
        "FIREBASE_PRIVATE_KEY (private key only)."
    );
  } else {
    try {
      admin.initializeApp({ credential: admin.credential.cert(creds) });
      console.log("✅ Firebase Admin initialised (CalmTinnitus)");
    } catch (err) {
      console.error("🔥 Firebase Admin init error:", err);
    }
  }
}

export const adminApp = admin.apps.length ? admin.app() : null;
export const adminDb = adminApp ? admin.firestore() : null;
