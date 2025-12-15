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
  date: number;
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
        await loadSessions(u.uid);
      } else {
        setSessionHistory([]);
      }
    });

    return () => unsub();
  }, []);

  const loadSessions = async (uid: string) => {
    if (!db) return;

    try {
      // IMPORTANT:
      // We intentionally do NOT use orderBy("date") here.
      // where(userId==uid) + orderBy(date) requires a composite Firestore index.
      // On Android WebView this was throwing an unhandled rejection and crashing the app.
      const q = query(collection(db, "sessions"), where("userId", "==", uid));

      const snap = await getDocs(q);

      const data: SessionLog[] = snap.docs.map((d) => {
        const v = d.data() as any;
        const dateMs =
          v.date?.toMillis ? v.date.toMillis() : typeof v.date === "number" ? v.date : 0;

        return {
          id: d.id,
          date: dateMs,
          therapyType: v.therapyType,
          mode: v.mode,
          duration: v.duration,
          tinnitusPitch: v.tinnitusPitch,
        };
      });

      // Sort locally (newest first) — no Firestore composite index required
      data.sort((a, b) => (b.date || 0) - (a.date || 0));

      setSessionHistory(data);
    } catch (err) {
      // Never let this crash the app
      console.error("loadSessions failed:", err);
      setSessionHistory([]);
    }
  };

  const refreshCloudSessions = async () => {
    if (!user) return;
    await loadSessions(user.uid);
  };

  const saveSessionToCloud = async (log: Omit<SessionLog, "id">) => {
    if (!user || !db) return;

    try {
      await addDoc(collection(db, "sessions"), {
        ...log,
        userId: user.uid,
        date: Timestamp.fromMillis(log.date),
      });

      await loadSessions(user.uid);
    } catch (err) {
      console.error("saveSessionToCloud failed:", err);
      // keep app alive even if write fails
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
