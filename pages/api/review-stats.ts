// FILE: pages/api/review-stats.ts
// Returns aggregate review stats (count + average rating) for CalmTinnitus.
// Lives in pages/api so it is excluded from the Capacitor static export build
// (output: "export") while still working on the Vercel server build.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../utils/firebaseAdmin";
import { APP_NAME } from "../../lib/appConfig";

type Data = {
  success: boolean;
  count?: number;
  average?: number | null;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Admin SDK not configured — return safe, empty stats so the UI can fall back.
  if (!adminDb) {
    console.warn("[review-stats] adminDb not initialised — returning zero stats.");
    return res.status(200).json({ success: true, count: 0, average: null });
  }

  try {
    const snap = await adminDb
      .collection("reviews")
      .where("appName", "==", APP_NAME)
      .get();

    const count = snap.size;
    if (count === 0) {
      return res.status(200).json({ success: true, count: 0, average: null });
    }

    let sum = 0;
    let ratedCount = 0;
    snap.forEach((doc) => {
      const data = doc.data() as { rating?: unknown };
      const rating =
        typeof data.rating === "number" ? data.rating : Number(data.rating);
      if (Number.isFinite(rating) && rating >= 1 && rating <= 5) {
        sum += rating;
        ratedCount++;
      }
    });

    const average =
      ratedCount === 0 ? null : Math.round((sum / ratedCount) * 10) / 10;

    return res.status(200).json({ success: true, count, average });
  } catch (err) {
    console.error("[review-stats] Firestore query failed:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to load review stats" });
  }
}
