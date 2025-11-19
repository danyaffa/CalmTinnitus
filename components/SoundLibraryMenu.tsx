// /components/SoundLibraryMenu.tsx
"use client";

import React, { Dispatch, SetStateAction } from "react";

export type SoundProfileId =
  | "pink-noise"
  | "white-noise"
  | "ocean"
  | "rain"
  | "wind"
  | "soft-music";

export type SoundProfile = {
  id: SoundProfileId;
  label: string;
  description: string;
  baseNoise: string; // The URL/path to the white noise audio file
};

const SOUND_LIBRARY: SoundProfile[] = [
  {
    id: "pink-noise",
    label: "Pink Noise (gentle)",
    description:
      "Soft broadband noise with more energy in the lower frequencies. Often used for tinnitus sound therapy.",
    baseNoise: "/audio/pink-noise.mp3", // Placeholder path
  },
  {
    id: "white-noise",
    label: "White Noise",
    description:
      "Flat noise across all frequencies. Simple, neutral sound that many people already know from masking devices.",
    baseNoise: "/audio/white-noise.mp3", // Placeholder path
  },
  {
    id: "ocean",
    label: "Ocean Waves",
    description:
      "Slow, rolling surf sounds for people who prefer a more natural, relaxing background.",
    baseNoise: "/audio/ocean-waves.mp3", // Placeholder path
  },
  {
    id: "rain",
    label: "Rain",
    description:
      "Gentle rain sound — steady and calming, good for evening or sleep sessions.",
    baseNoise: "/audio/rain.mp3", // Placeholder path
  },
  {
    id: "wind",
    label: "Wind",
    description:
      "Soft wind / air movement texture. Similar to noise, but with a more natural feel.",
    baseNoise: "/audio/wind.mp3", // Placeholder path
  },
  {
    id: "soft-music",
    label: "Soft Music Bed",
    description:
      "Very light musical background. Keep volume low so the tinnitus training remains comfortable.",
    baseNoise: "/audio/soft-music.mp3", // Placeholder path
  },
];

export type SoundLibraryMenuProps = {
  onSelectProfile: (profile: SoundProfile) => void;
};

export const SoundLibraryMenu: React.FC<SoundLibraryMenuProps> = ({
  onSelectProfile,
}) => {
  const [selectedSound, setSelectedSound] = React.useState<SoundProfile | null>(
    SOUND_LIBRARY[0] // Default to first sound
  );

  const handleSelect = (profile: SoundProfile) => {
    setSelectedSound(profile);
    onSelectProfile(profile);
  };

  // Immediate selection of the default profile on mount
  React.useEffect(() => {
    if (selectedSound) {
      onSelectProfile(selectedSound);
    }
  }, []);

  return (
    <div className="sound-library-grid">
      <ul className="sound-list">
        {SOUND_LIBRARY.map((sound) => (
          <li
            key={sound.id}
            className={`sound-item ${
              selectedSound?.id === sound.id ? "selected" : ""
            }`}
          >
            <button
              className="sound-item-button"
              onClick={() => handleSelect(sound)}
            >
              <div className="sound-item-main">
                <div className="sound-item-label">{sound.label}</div>
                <div className="sound-item-desc">{sound.description}</div>
              </div>
              {selectedSound?.id === sound.id && (
                <span className="sound-item-tag">Selected</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <style jsx>{`
        .sound-library-grid {
          padding: 0.5rem 0;
        }
        .sound-list {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 260px;
          overflow-y: auto;
        }
        .sound-item + .sound-item {
          margin-top: 0.35rem;
        }
        .sound-item-button {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          padding: 0.65rem 0.75rem;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }
        .sound-item-button:hover:not(:disabled) {
          background: #f0f4f7;
          border-color: #d1d5db;
        }
        .sound-item.selected .sound-item-button {
          border-color: #0ea5e9;
          background: #e0f2fe;
        }
        .sound-item-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #111827;
        }
        .sound-item-desc {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.15rem;
        }
        .sound-item-tag {
          font-size: 0.75rem;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          background: #0ea5e9;
          color: white;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};
