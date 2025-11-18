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
};

const SOUND_LIBRARY: SoundProfile[] = [
  {
    id: "pink-noise",
    label: "Pink Noise (gentle)",
    description:
      "Soft broadband noise with more energy in the lower frequencies. Often used for tinnitus sound therapy.",
  },
  {
    id: "white-noise",
    label: "White Noise",
    description:
      "Flat noise across all frequencies. Simple, neutral sound that many people already know from masking devices.",
  },
  {
    id: "ocean",
    label: "Ocean Waves",
    description:
      "Slow, rolling surf sounds for people who prefer a more natural, relaxing background.",
  },
  {
    id: "rain",
    label: "Rain",
    description:
      "Gentle rain sound — steady and calming, good for evening or sleep sessions.",
  },
  {
    id: "wind",
    label: "Wind",
    description:
      "Soft wind / air movement texture. Similar to noise, but with a more natural feel.",
  },
  {
    id: "soft-music",
    label: "Soft Music Bed",
    description:
      "Very light musical background. Keep volume low so the tinnitus training remains comfortable.",
  },
];

export type SoundLibraryMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedSound: SoundProfile | null;
  onSelectSound: Dispatch<SetStateAction<SoundProfile | null>>;
};

export const SoundLibraryMenu: React.FC<SoundLibraryMenuProps> = ({
  isOpen,
  onClose,
  selectedSound,
  onSelectSound,
}) => {
  if (!isOpen) return null;

  const handleSelect = (profile: SoundProfile) => {
    onSelectSound(profile);
    onClose();
  };

  return (
    <div className="sound-modal-backdrop" onClick={onClose}>
      <div
        className="sound-modal"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="sound-modal-header">
          <h2>Sound Library</h2>
          <button className="sound-close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="sound-modal-intro">
          Choose the background sound you feel most relaxed with. All sounds
          will be shaped by your tinnitus settings (Notch or CR) inside the
          engine.
        </p>

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

        <p className="sound-modal-footnote">
          You can change sounds anytime. If a sound makes your tinnitus feel
          worse, stop the session and try a different one on another day.
        </p>
      </div>

      <style jsx>{`
        .sound-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 40;
        }
        .sound-modal {
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          border-radius: 1rem;
          padding: 1.4rem 1.5rem 1.3rem;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
        }
        .sound-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .sound-close-button {
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 1.1rem;
          color: #6b7280;
        }
        .sound-modal-intro {
          font-size: 0.9rem;
          color: #4b5563;
          margin-bottom: 0.9rem;
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
        .sound-modal-footnote {
          font-size: 0.78rem;
          color: #6b7280;
          margin-top: 0.7rem;
        }
      `}</style>
    </div>
  );
};
