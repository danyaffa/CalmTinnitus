// FILE: app/AuthProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export type SessionLog = {
  id?: string;
  userId: string;
  date: any;
  loudness?: number;
  stress?: number;
  sleep?: number;
  note?: string;
};

type AuthContextType = {
  user: User | null;
  userId: string | null;
  authReady: boolean;
  cloudSessions: SessionLog[];
  refreshSessions: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudSessions, setCloudSessions] = useState<SessionLog[]>([]);

  // 🔥 CRITICAL: Catch Android WebView crashes BEFORE React dies
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      alert(
        "ANDROID CRASH (Promise Rejection):\n\n" +
          (event.reason?.message || JSON.stringify(event.reason))
      );
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  const loadSessions = async (uid: string) => {
    try {
      const q = query(
        collection(db, "sessions"),
        where("userId", "==", uid)
      );

      const snap = await getDocs(q);

      const data: SessionLog[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      const toMillis = (v: any) => {
        if (!v) return 0;
        if (typeof v === "number") return v;
        if (typeof v === "string") return Date.parse(v) || 0;
        if (typeof v?.toMillis === "function") return v.toMillis();
        if (typeof v?.seconds === "number") return v.seconds * 1000;
        return 0;
      };

      data.sort((a, b) => toMillis(b.date) - toMillis(a.date));
      setCloudSessions(data);
    } catch (err: any) {
      alert(
        "ANDROID FIRESTORE ERROR:\n\n" +
          (err?.message || JSON.stringify(err))
      );
      setCloudSessions([]);
    }
  };

  const refreshSessions = async () => {
    if (!userId) return;
    await loadSessions(userId);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          const res = await signInAnonymously(auth);
          setUser(res.user);
          setUserId(res.user.uid);
          await loadSessions(res.user.uid);
        } else {
          setUser(u);
          setUserId(u.uid);
          await loadSessions(u.uid);
        }
      } catch (err: any) {
        alert(
          "ANDROID AUTH ERROR:\n\n" +
            (err?.message || JSON.stringify(err))
        );
        setUser(null);
        setUserId(null);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      user,
      userId,
      authReady,
      cloudSessions,
      refreshSessions,
    }),
    [user, userId, authReady, cloudSessions]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
