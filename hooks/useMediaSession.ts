// /hooks/useMediaSession.ts
"use client";

import { useEffect } from "react";

// Add the 'stop' handler type, as it's used in the page
export type MediaSessionOptions = {
  title?: string;
  artist?: string;
  album?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
};

// The hook accepts MediaSessionOptions and returns void
export function useMediaSession({
  title = "NeuroQuiet – Tinnitus Session",
  artist = "NeuroQuiet",
  album = "Tinnitus Sound Training",
  onPlay,
  onPause,
  onStop, // Added onStop
}: MediaSessionOptions = {}) {
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.metadata = new (window as any).MediaMetadata({
        title,
        artist,
        album,
      });

      // Handlers
      navigator.mediaSession.setActionHandler("play", onPlay || null);
      navigator.mediaSession.setActionHandler("pause", onPause || null);
      navigator.mediaSession.setActionHandler("stop", onStop || null); // Set stop handler
      
    } catch {
      // ignore if browser doesn't fully support it
    }

    return () => {
      if (typeof navigator === "undefined") return;
      if (!("mediaSession" in navigator)) return;
      try {
        // Clear handlers on cleanup
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
      } catch {
        // ignore
      }
    };
  }, [title, artist, album, onPlay, onPause, onStop]);
}
