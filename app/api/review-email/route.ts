// FILE: app/api/review-email/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { adminDb } from "@/utils/firebaseAdmin";

const APP_NAME = "CalmTinnitus";

const resendApiKey = process.env.RESEND_API_KEY;
const reviewReceiver = process.env.REVIEW_RECEIVER_EMAIL || "leffleryd@gmail.com";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rating = body?.rating ?? null;
    const text: string = (body?.text ?? body?.comment ?? "").toString();
    const email: string = (body?.email ?? "").toString();
    const appName: string = (body?.appName ?? APP_NAME).toString();

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing review text" }, { status: 400 });
    }

    const createdAt = new Date().toISOString();
    let docId: string | null = null;

    // Store in Firestore (if available)
    if (!adminDb) {
      console.warn("⚠ adminDb not ready – skipping Firestore write.");
    } else {
      const docRef = await adminDb.collection("reviews").add({
        appName,
        rating,
        text,
        email,
        createdAt,
      });
      docId = docRef.id;
    }

    // Email via Resend (if configured)
    if (!resend || !reviewReceiver) {
      console.warn("⚠ Resend not configured – skipping email send.");
    } else {
      const subject = `New ${appName} review – ${rating ?? "no"}★`;
      const lines = [
        `App: ${appName}`,
        `Rating: ${rating ?? "n/a"} stars`,
        `Email: ${email || "anonymous"}`,
        `Created at: ${createdAt}`,
        docId ? `Firestore ID: ${docId}` : "",
        "",
        "Review text:",
        text,
      ].filter(Boolean);

      try {
        await resend.emails.send({
          from: "Reviews <onboarding@resend.dev>",
          to: reviewReceiver,
          subject,
          text: lines.join("\n"),
        });
      } catch (err) {
        console.error("Resend send error:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Review route error:", err);
    return NextResponse.json(
      { error: "Failed to submit review", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
