// FILE: /app/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  firebaseReady,
  auth,
  db,
  onAuthStateChanged,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "../lib/firebase";
import type { User } from "../lib/firebase";

export type TherapyMode = "standard" | "sleep" | "relief";
export type TherapyType = "notch" | "cr";

export type SessionLog = {
  id: string;
  date: number; // millis
  therapyType: TherapyType;
  mode: TherapyMode;
  duration: number;
  tinnitusPitch: number;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  sessionHistory: SessionLog[];
  setSessionHistory: React.Dispatch<React.SetStateAction<SessionLog[]>>;
  saveSessionToCloud: (log: Omit<SessionLog, "id">) => Promise<void>;
  refreshCloudSessions: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionHistory, setSessionHistory] = useState<SessionLog[]>([]);

  useEffect(() => {
    if (!firebaseReady || !auth || !db) {
      setUser(null);
      setSessionHistory([]);
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      if (u) {
        // Never allow an unhandled rejection to crash Android WebView
        try {
          await loadSessions(u.uid);
        } catch (e) {
          console.error("loadSessions failed:", e);
          setSessionHistory([]);
        }
      } else {
        setSessionHistory([]);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSessions = async (uid: string) => {
    if (!db) return;

    // ✅ IMPORTANT:
    // Avoid composite index requirement by NOT using orderBy("date").
    // We'll sort client-side instead.
    const q = query(collection(db, "sessions"), where("userId", "==", uid));

    const snap = await getDocs(q);

    const data: SessionLog[] = snap.docs.map((d) => {
      const v = d.data() as any;

      const dateMillis =
        typeof v.date === "number"
          ? v.date
          : v.date?.toMillis
          ? v.date.toMillis()
          : Date.now();

      return {
        id: d.id,
        date: dateMillis,
        therapyType: v.therapyType,
        mode: v.mode,
        duration: v.duration,
        tinnitusPitch: v.tinnitusPitch,
      };
    });

    // Sort newest first (no Firestore index needed)
    data.sort((a, b) => b.date - a.date);

    setSessionHistory(data);
  };

  const refreshCloudSessions = async () => {
    if (!user) return;
    try {
      await loadSessions(user.uid);
    } catch (e) {
      console.error("refreshCloudSessions failed:", e);
    }
  };

  const saveSessionToCloud = async (log: Omit<SessionLog, "id">) => {
    if (!user || !db) return;

    try {
      await addDoc(collection(db, "sessions"), {
        ...log,
        userId: user.uid,
        date: Timestamp.fromMillis(log.date),
      });

      // Refresh after saving (also protected)
      await loadSessions(user.uid);
    } catch (e) {
      console.error("saveSessionToCloud failed:", e);
      // Do not throw — avoid crashing Android WebView
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionHistory,
        setSessionHistory,
        saveSessionToCloud,
        refreshCloudSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
