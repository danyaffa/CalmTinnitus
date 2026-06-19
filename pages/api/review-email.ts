// FILE: pages/api/review-email.ts
// Persists a review to Firestore (Admin SDK) and notifies the team via Resend.
// Returns success even if email delivery fails so the user still sees a
// "thank you" — the saved review is what matters. Hardened with input
// validation, a lightweight rate limit, env-var checks, and safe errors.
// Lives in pages/api so it is excluded from the Capacitor static export build.

import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { adminDb } from "../../utils/firebaseAdmin";
import { APP_NAME } from "../../lib/appConfig";

type Data = {
  success: boolean;
  saved?: boolean;
  error?: string;
};

// --- Lightweight in-memory rate limit (best-effort per warm instance) -------
const RATE_LIMIT_MAX = 5; // requests
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes per IP
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const fwd = req.headers["x-forwarded-for"];
    const ip =
      (Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0])?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    if (rateLimited(ip)) {
      return res
        .status(429)
        .json({ success: false, error: "Too many requests. Please try again later." });
    }

    const { rating, text, comment, email, appName } = req.body ?? {};

    // Validate rating (optional, but must be 1–5 when present).
    const numRating = typeof rating === "number" ? rating : Number(rating);
    if (rating != null && (!Number.isFinite(numRating) || numRating < 1 || numRating > 5)) {
      return res
        .status(400)
        .json({ success: false, error: "Rating must be between 1 and 5." });
    }
    const safeRating = rating != null ? Math.round(numRating) : null;

    // Accept both "text" and "comment"; cap length to avoid abuse.
    const bodyText: string = (text ?? comment ?? "").toString().slice(0, 5000);
    if (!bodyText.trim()) {
      return res.status(400).json({ success: false, error: "Missing review text." });
    }

    const rawEmail = typeof email === "string" ? email.trim().slice(0, 254) : "";
    const safeEmail = EMAIL_RE.test(rawEmail) ? rawEmail : "";

    const appLabel =
      typeof appName === "string" && appName.trim() ? appName.trim() : APP_NAME;
    const createdAt = new Date().toISOString();
    let docId: string | null = null;

    // 1) Persist to Firestore (skip silently if Admin SDK isn't configured).
    if (!adminDb) {
      console.warn("[review-email] adminDb not initialised — skipping Firestore write.");
    } else {
      try {
        const ref = await adminDb.collection("reviews").add({
          rating: safeRating,
          text: bodyText,
          email: safeEmail,
          appName: appLabel,
          createdAt,
        });
        docId = ref.id;
      } catch (err) {
        console.error("[review-email] Firestore write failed:", err);
      }
    }

    // 2) Notify the team via Resend (best-effort; never fails the request).
    const resendKey = process.env.RESEND_API_KEY;
    const receiver = process.env.REVIEW_RECEIVER_EMAIL;
    if (resendKey && receiver) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: "Reviews <onboarding@resend.dev>",
          to: receiver,
          subject: `New ${appLabel} review – ${safeRating ?? "no"}★`,
          text: [
            `App: ${appLabel}`,
            `Rating: ${safeRating ?? "n/a"} stars`,
            `From: ${safeEmail || "anonymous"}`,
            `Created at: ${createdAt}`,
            docId ? `Firestore ID: ${docId}` : "",
            "",
            "Review:",
            bodyText,
          ]
            .filter(Boolean)
            .join("\n"),
        });
      } catch (err) {
        console.error("[review-email] Resend send failed:", err);
      }
    } else {
      console.warn(
        "[review-email] RESEND_API_KEY or REVIEW_RECEIVER_EMAIL not set — skipping email."
      );
    }

    return res.status(200).json({ success: true, saved: docId != null });
  } catch (err) {
    console.error("[review-email] Unexpected error:", err);
    return res.status(500).json({ success: false, error: "Failed to submit review." });
  }
}
