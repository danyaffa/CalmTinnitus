// FILE: /lib/program.ts (FINAL FIX)
import {
  db,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc, // <- NEW: Used for direct read
  doc,
  setDoc,
  serverTimestamp,
  limit,
} from "./firebase";

export type ProgramLengthDays = 7 | 14 | 30;

export type ProgramEnrollment = {
  userId: string;
  lengthDays: ProgramLengthDays;
  startDate: number; // ms (start of day)
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
};

export type DailyCheckIn = {
  userId: string;
  dayNumber: number; // 1..lengthDays
  date: number; // ms (start of day)
  loudness: number; // 0..10
  stress: number; // 0..10
  sleepQuality: number; // 0..10
  minutesUsed: number; // 0..180
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
};

const ENROLLMENTS = "program_enrollments";
const CHECKINS = "program_checkins";

const startOfLocalDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

/**
 * ✅ FINAL FIX: Reads the known doc ID (active_UID) directly, eliminating the need for Complex Index A.
 */
export async function getActiveEnrollment(userId: string) {
  const id = `active_${userId}`;
  const ref = doc(db, ENROLLMENTS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return { id: snap.id, ...(snap.data() as any) } as { id: string } & ProgramEnrollment;
}

export async function createOrReplaceEnrollment(
  userId: string,
  lengthDays: ProgramLengthDays
) {
  // Document ID is active_UID
  const id = `active_${userId}`;
  const startDate = startOfLocalDay(new Date());
  const ref = doc(db, ENROLLMENTS, id);

  await setDoc(
    ref,
    {
      userId,
      lengthDays,
      startDate,
      active: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { id, userId, lengthDays, startDate, active: true } as { id: string } & ProgramEnrollment;
}

export function getDayNumber(enrollmentStartDateMs: number) {
  const today = startOfLocalDay(new Date());
  const diffDays = Math.floor(
    (today - enrollmentStartDateMs) / (1000 * 60 * 60 * 24)
  );
  return diffDays + 1;
}

export async function getCheckInForDay(userId: string, dayStartMs: number) {
  // Simple query, should be fast.
  const q = query(
    collection(db, CHECKINS),
    where("userId", "==", userId),
    where("date", "==", dayStartMs),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const d0 = snap.docs[0];
  return { id: d0.id, ...(d0.data() as any) } as { id: string } & DailyCheckIn;
}

export async function saveDailyCheckIn(
  input: Omit<DailyCheckIn, "createdAt" | "updatedAt">
) {
  // Document ID is UID_DateMs
  const id = `${input.userId}_${input.date}`;
  const ref = doc(db, CHECKINS, id);

  await setDoc(
    ref,
    {
      ...input,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return id;
}

/**
 * History for Chart + Download
 * NOTE: Requires Composite Index 2
 */
export async function getCheckInHistory(userId: string, programStartDateMs: number) {
  const q = query(
    collection(db, CHECKINS),
    where("userId", "==", userId),
    where("date", ">=", programStartDateMs),
    orderBy("date", "asc")
  );

  const snap = await getDocs(q);
  const currentDay = getDayNumber(programStartDateMs);

  const items = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as DailyCheckIn),
  })) as Array<{ id: string } & DailyCheckIn>;

  return items.filter((x) => x.dayNumber <= currentDay);
}
