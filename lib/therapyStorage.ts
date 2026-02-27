// FILE: lib/therapyStorage.ts
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // ⚠️ ADJUST THIS PATH TO YOUR EXISTING FIREBASE CLIENT

// TYPES
export type SavedProfile = {
  id?: string;
  userId: string;
  label: string;             // e.g. "Left ear high pitch"
  earSide: "left" | "right" | "both";
  frequencyHz: number;       // matched tinnitus pitch
  baseVolume: number;        // 0–1 gain you use
  createdAt: Timestamp;
};

export type TherapySession = {
  id?: string;
  userId: string;
  profileId?: string | null; // optional – may run without profile
  mode: "standard" | "relief" | "sleep" | "sr";
  backgroundSound: "white" | "rain" | "ocean" | "none";
  durationMinutes: number;
  perceivedLoudnessBefore?: number; // 0–10 self-rating
  perceivedLoudnessAfter?: number;  // 0–10 self-rating
  reliefScore?: number;             // 0–10 "how much relief now?"
  notes?: string;                   // user free text
  createdAt: Timestamp;
};

// --------- SAVED PROFILES ----------

export async function createSavedProfile(
  profile: Omit<SavedProfile, "id" | "createdAt">
) {
  const ref = await addDoc(collection(db, "tinnitusProfiles"), {
    ...profile,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getSavedProfiles(userId: string): Promise<SavedProfile[]> {
  const q = query(
    collection(db, "tinnitusProfiles"),
    where("userId", "==", userId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<SavedProfile, "id">),
  }));
}

// --------- SESSIONS HISTORY ----------

export async function logTherapySession(
  session: Omit<TherapySession, "id" | "createdAt">
) {
  const ref = await addDoc(collection(db, "therapySessions"), {
    ...session,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getTherapySessions(
  userId: string
): Promise<TherapySession[]> {
  const q = query(
    collection(db, "therapySessions"),
    where("userId", "==", userId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<TherapySession, "id">),
  }));
}
