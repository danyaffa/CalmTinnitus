// /hooks/useMediaSession.ts
"use client";

import { useEffect } from "react";

type MediaSessionOptions = {
  title?: string;
  artist?: string;
  album?: string;
  onPlay?: () => void;
  onPause?: () => void;
};

export function useMediaSession({
  title = "NeuroQuiet Session",
  artist = "NeuroQuiet",
  album = "Tinnitus Sound Training",
  onPlay,
  onPause,
}: MediaSessionOptions) {
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!("mediaSession" in navigator)) return;

    try {
      // Set metadata
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
      });

      // Set handlers
      if (onPlay) {
        navigator.mediaSession.setActionHandler("play", () => {
          onPlay();
        });
      } else {
        navigator.mediaSession.setActionHandler("play", null);
      }

      if (onPause) {
        navigator.mediaSession.setActionHandler("pause", () => {
          onPause();
        });
      } else {
        navigator.mediaSession.setActionHandler("pause", null);
      }
    } catch (err) {
      // Fail silently – some browsers may not fully support this
      console.warn("MediaSession not available:", err);
    }

    // Cleanup when component unmounts or callbacks change
    return () => {
      if (typeof navigator === "undefined") return;
      if (!("mediaSession" in navigator)) return;
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
      } catch {
        // ignore
      }
    };
  }, [title, artist, album, onPlay, onPause]);
}
