// FILE: /lib/firestore.ts

import { collection, addDoc, Timestamp } from "firebase/firestore";
import { firebaseReady, db } from "./firebase";

export type ReviewDoc = {
  id?: string;
  userId?: string;
  appName?: string;
  rating: number;
  comment?: string;
  createdAt: Timestamp;
};

export async function addReview(payload: Omit<ReviewDoc, "createdAt" | "id">) {
  if (!firebaseReady || !db) return;

  const reviewsRef = collection(db, "reviews");
  return await addDoc(reviewsRef, {
    ...payload,
    createdAt: Timestamp.now(),
  });
}
