// FILE: /lib/firestore.ts
// 🔒 STABLE FACADE — keeps all callers working

import {
  db,
  collection,
  addDoc,
  serverTimestamp,
} from "./firebase";

/* ------------------------------------------------------------------ */
/* REVIEWS — ACCEPT ALL CALL SHAPES                                    */
/* ------------------------------------------------------------------ */

type ReviewPayload = {
  userId: string;
  rating: number;
  comment: string;
  appName: string;
};

// legacy + new overloads
export async function addReview(payload: ReviewPayload): Promise<void>;
export async function addReview(
  userId: string,
  rating: number,
  comment: string,
  appName: string
): Promise<void>;

// single implementation
export async function addReview(
  a: ReviewPayload | string,
  b?: number,
  c?: string,
  d?: string
): Promise<void> {
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
    ...data,
    createdAt: serverTimestamp(),
  });
}
