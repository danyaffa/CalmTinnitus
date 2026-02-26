// FILE: hooks/useAccess.ts
// Reusable hook to check if a user has active subscription or promo access

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!uid || !firebaseReady || !db) {
      setLoading(false);
      return;
    }

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
        if (!cancelled) setLoading(false);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { hasAccess, loading, accessType };
}
