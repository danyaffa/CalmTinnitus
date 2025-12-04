// FILE: app/api/review-stats/route.ts

import { NextResponse } from "next/server";
import { adminDb } from "../../../utils/firebaseAdmin";
import { APP_NAME } from "../../../lib/appConfig";

type Data = {
  success: boolean;
  count?: number;
  average?: number | null;
  error?: string;
};

export async function GET() {
  if (!adminDb) {
    console.warn("adminDb not initialised – returning zero stats.");
    const body: Data = {
      success: true,
      count: 0,
      average: null,
    };
    return NextResponse.json(body);
  }

  try {
    // Only count good reviews (4★ and 5★)
    const snap = await adminDb
      .collection("reviews")
      .where("appName", "==", APP_NAME)
      .where("rating", ">=", 4)
      .get();

    const count = snap.size;

    if (count === 0) {
      const body: Data = {
        success: true,
        count: 0,
        average: null,
      };
      return NextResponse.json(body);
    }

    let sum = 0;
    snap.forEach((doc) => {
      const data = doc.data() as any;
      const r = typeof data.rating === "number" ? data.rating : 0;
      sum += r;
    });

    const average = sum / count;

    const body: Data = {
      success: true,
      count,
      average,
    };
    return NextResponse.json(body);
  } catch (err) {
    console.error("review-stats error:", err);
    const body: Data = {
      success: false,
      error: "Failed to load review stats",
    };
    return NextResponse.json(body, { status: 500 });
  }
}
