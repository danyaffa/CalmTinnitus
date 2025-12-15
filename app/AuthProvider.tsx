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
  orderBy,
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
  /** If Firestore is missing a required composite index, we store the error text here instead of crashing. */
  sessionsIndexError: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionHistory, setSessionHistory] = useState<SessionLog[]>([]);
  const [sessionsIndexError, setSessionsIndexError] = useState<string | null>(
    null
  );

  const loadSessions = async (uid: string) => {
    if (!db) return;

    const q = query(
      collection(db, "sessions"),
      where("userId", "==", uid),
      orderBy("date", "desc")
    );

    try {
      const snap = await getDocs(q);

      const data: SessionLog[] = snap.docs.map((d) => {
        const v = d.data() as any;
        return {
          id: d.id,
          date: v.date?.toMillis ? v.date.toMillis() : Number(v.date || 0),
          therapyType: (v.therapyType || "notch") as TherapyType,
          mode: (v.mode || "standard") as TherapyMode,
          duration: Number(v.duration || 0),
          tinnitusPitch: Number(v.tinnitusPitch || 0),
        };
      });

      setSessionsIndexError(null);
      setSessionHistory(data);
    } catch (err: any) {
      const msg = String(err?.message || err);

      // Firestore throws this when a composite index is missing.
      // Do NOT crash the app — keep it alive and show empty history.
      if (msg.includes("The query requires an index")) {
        setSessionsIndexError(msg);
        setSessionHistory([]);
        return;
      }

      // Any other error: keep app alive, but log it.
      console.error("loadSessions failed:", err);
      setSessionsIndexError(msg);
      setSessionHistory([]);
    }
  };

  useEffect(() => {
    if (!firebaseReady || !auth || !db) {
      setUser(null);
      setSessionHistory([]);
      setSessionsIndexError(null);
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
        setSessionsIndexError(null);
      }
    });

    return () => unsub();
  }, []);

  const saveSessionToCloud = async (log: Omit<SessionLog, "id">) => {
    if (!db || !user) return;

    try {
      await addDoc(collection(db, "sessions"), {
        userId: user.uid,
        date: Timestamp.fromMillis(log.date),
        therapyType: log.therapyType,
        mode: log.mode,
        duration: log.duration,
        tinnitusPitch: log.tinnitusPitch,
      });

      // Refresh after save (safe)
      await loadSessions(user.uid);
    } catch (err) {
      console.error("saveSessionToCloud failed:", err);
    }
  };

  const refreshCloudSessions = async () => {
    if (!user) return;
    await loadSessions(user.uid);
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
        sessionsIndexError,
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
