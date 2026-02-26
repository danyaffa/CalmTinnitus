// FILE: hooks/useAccess.ts
// Reusable hook to check if a user has active subscription or promo access

import { useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase";

type AccessResult = {
  hasAccess: boolean;
  loading: boolean;
  accessType: "paypal" | "promo" | null;
};

export function useAccess(uid: string | null): AccessResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessType, setAccessType] = useState<"paypal" | "promo" | null>(null);

  // Track which uid was last resolved so we can detect when uid changes
  // before the useEffect has run. This prevents a race condition where
  // the therapy page gate sees stale loading=false between uid changing
  // and the new Firestore fetch starting.
  const resolvedUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!uid || !firebaseReady || !db) {
      setHasAccess(false);
      setAccessType(null);
      setLoading(false);
      resolvedUidRef.current = uid;
      return;
    }

    // Reset state when checking a new uid
    setLoading(true);
    setHasAccess(false);
    setAccessType(null);

    let cancelled = false;

    const check = async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (cancelled) return;

        if (snap.exists()) {
          const data = snap.data();
          if (data.subscriptionStatus === "active") {
            setHasAccess(true);
            setAccessType((data.accessType as "paypal" | "promo") || "paypal");
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

  // If uid changed but the effect hasn't resolved yet, report as loading
  // to prevent premature redirect decisions.
  const isLoading = loading || (uid !== null && uid !== resolvedUidRef.current);

  return { hasAccess, loading: isLoading, accessType };
}
