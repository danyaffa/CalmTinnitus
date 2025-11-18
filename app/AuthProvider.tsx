// /app/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionHistory, setSessionHistory] = useState<SessionLog[]>([]);

  useEffect(() => {
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
    const q = query(
      collection(db, "sessions"),
      where("userId", "==", uid),
      orderBy("date", "desc")
    );
    const snap = await getDocs(q);
    const data: SessionLog[] = snap.docs.map((d) => {
      const v = d.data() as any;
      return {
        id: d.id,
        date: v.date?.toMillis ? v.date.toMillis() : v.date,
        therapyType: v.therapyType,
        mode: v.mode,
        duration: v.duration,
        tinnitusPitch: v.tinnitusPitch,
      };
    });
    setSessionHistory(data);
  };

  const saveSessionToCloud = async (log: Omit<SessionLog, "id">) => {
    if (!user) return;
    await addDoc(collection(db, "sessions"), {
      userId: user.uid,
      ...log,
      date: Timestamp.fromMillis(log.date),
    });
    await loadSessions(user.uid);
  };

  const refreshCloudSessions = async () => {
    if (user) await loadSessions(user.uid);
  };

  const value: AuthContextType = {
    user,
    loading,
    sessionHistory,
    setSessionHistory,
    saveSessionToCloud,
    refreshCloudSessions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthCtx = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthCtx must be used within AuthProvider");
  return ctx;
};
