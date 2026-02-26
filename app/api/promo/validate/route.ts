// FILE: app/api/promo/validate/route.ts
// Server-side promo code validation — prevents client tampering

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { code, uid } = body as { code?: string; uid?: string };

    if (!code || !uid) {
      return NextResponse.json(
        { error: "Missing code or user ID." },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // Find the promo code doc by code field
    const promoSnap = await adminDb
      .collection("promoCodes")
      .where("code", "==", normalizedCode)
      .limit(1)
      .get();

    if (promoSnap.empty) {
      return NextResponse.json(
        { error: "Invalid promo code." },
        { status: 404 }
      );
    }

    const promoDoc = promoSnap.docs[0];
    const promo = promoDoc.data();

    // Check if active
    if (!promo.active) {
      return NextResponse.json(
        { error: "This promo code is no longer active." },
        { status: 400 }
      );
    }

    // Check expiration
    if (promo.expiresAt) {
      const expiresAt =
        typeof promo.expiresAt.toDate === "function"
          ? promo.expiresAt.toDate()
          : new Date(promo.expiresAt);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: "This promo code has expired." },
          { status: 400 }
        );
      }
    }

    // Check max redemptions
    if (
      promo.maxRedemptions != null &&
      (promo.redemptions ?? 0) >= promo.maxRedemptions
    ) {
      return NextResponse.json(
        { error: "This promo code has reached its redemption limit." },
        { status: 400 }
      );
    }

    // Atomically increment redemptions and activate user access
    const batch = adminDb.batch();

    // Increment promo redemptions
    batch.update(promoDoc.ref, {
      redemptions: FieldValue.increment(1),
    });

    // Set user document to active with promo access
    const userRef = adminDb.collection("users").doc(uid);
    batch.set(
      userRef,
      {
        subscriptionStatus: "active",
        accessType: "promo",
        promoCodeUsed: normalizedCode,
        promoActivatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();

    return NextResponse.json({ success: true, type: promo.type || "free" });
  } catch (err: any) {
    console.error("Promo validation error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
