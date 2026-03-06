// FILE: hooks/useAccess.ts
// Reusable hook to check if a user has active subscription, promo, or free trial access

import { useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase";

const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

type AccessResult = {
  hasAccess: boolean;
  loading: boolean;
  accessType: "paypal" | "promo" | "trial" | null;
  trialDaysLeft: number | null;
};

export function useAccess(uid: string | null): AccessResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessType, setAccessType] = useState<"paypal" | "promo" | "trial" | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  const resolvedUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!uid || !firebaseReady || !db) {
      setHasAccess(false);
      setAccessType(null);
      setTrialDaysLeft(null);
      setLoading(false);
      resolvedUidRef.current = uid;
      return;
    }

    setLoading(true);
    setHasAccess(false);
    setAccessType(null);
    setTrialDaysLeft(null);

    let cancelled = false;

    const check = async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (cancelled) return;

        if (snap.exists()) {
          const data = snap.data();

          // Active paid or promo subscription
          if (data.subscriptionStatus === "active") {
            setHasAccess(true);
            setAccessType((data.accessType as "paypal" | "promo") || "paypal");
            return;
          }

          // Check free trial: 14 days from account creation
          const createdAt = data.createdAt;
          if (createdAt) {
            const createdMs = createdAt.toDate ? createdAt.toDate().getTime() : new Date(createdAt).getTime();
            const now = Date.now();
            const elapsed = now - createdMs;

            if (elapsed < TRIAL_DURATION_MS) {
              const daysLeft = Math.ceil((TRIAL_DURATION_MS - elapsed) / (24 * 60 * 60 * 1000));
              setHasAccess(true);
              setAccessType("trial");
              setTrialDaysLeft(daysLeft);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Access check failed:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          resolvedUidRef.current = uid;
        }
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const isLoading = loading || (uid !== null && uid !== resolvedUidRef.current);

  return { hasAccess, loading: isLoading, accessType, trialDaysLeft };
}
