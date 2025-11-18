// /hooks/useMediaSession.ts
"use client";

import { useEffect, useCallback, useMemo } from "react";

// Define the shape of the metadata object
export type MediaMetadata = {
  title: string;
  artist: string;
  album: string;
};

// Define the shape of the handlers object
export type MediaHandlers = {
  play?: () => void;
  pause?: () => void;
  stop?: () => void; // Added 'stop' handler based on therapy/page.tsx usage
};

/**
 * Custom hook to manage the Media Session API for background media controls.
 */
export function useMediaSession() {
  const isMediaSessionSupported =
    typeof navigator !== "undefined" && "mediaSession" in navigator;

  // Function to set the metadata (title, artist, album)
  const setMediaSessionMetadata = useCallback(
    (metadata: MediaMetadata | null) => {
      if (!isMediaSessionSupported) return;

      if (metadata) {
        try {
          navigator.mediaSession.metadata = new (window as any).MediaMetadata({
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
          });
        } catch {
          // ignore if metadata fails
        }
      } else {
        // Reset metadata
        navigator.mediaSession.metadata = null;
      }
    },
    [isMediaSessionSupported]
  );

  // Function to set the action handlers (play, pause, stop)
  const setMediaSessionHandlers = useCallback(
    (handlers: MediaHandlers) => {
      if (!isMediaSessionSupported) return;

      try {
        navigator.mediaSession.setActionHandler("play", handlers.play || null);
        navigator.mediaSession.setActionHandler(
          "pause",
          handlers.pause || null
        );
        navigator.mediaSession.setActionHandler("stop", handlers.stop || null);
      } catch {
        // ignore if setting handler fails
      }
    },
    [isMediaSessionSupported]
  );

  // Clean up handlers when the component unmounts (or on full reset)
  useEffect(() => {
    return () => {
      if (isMediaSessionSupported) {
        setMediaSessionMetadata(null); // Reset metadata
        setMediaSessionHandlers({}); // Clear handlers
      }
    };
  }, [isMediaSessionSupported, setMediaSessionMetadata, setMediaSessionHandlers]);

  // Return the functions expected by TherapyPage
  return useMemo(
    () => ({
      setMediaSessionMetadata,
      setMediaSessionHandlers,
    }),
    [setMediaSessionMetadata, setMediaSessionHandlers]
  );
}
