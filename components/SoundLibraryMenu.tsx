"use client";

import React from "react";

export type SoundProfile =
  | "pink-noise"
  | "white-noise"
  | "brown-noise"
  | "ocean"
  | "rain"
  | "wind"
  | "soft-music";

type SoundLibraryMenuProps = {
  value: SoundProfile;
  onChange: (value: SoundProfile) => void;
  disabled?: boolean;
};

const OPTIONS: { id: SoundProfile; label: string; description: string }[] = [
  {
    id: "pink-noise",
    label: "Pink noise",
    description: "Balanced noise, good for most users (default).",
  },
  {
    id: "white-noise",
    label: "White noise",
    description: "Brighter noise with more high frequencies.",
  },
  {
    id: "brown-noise",
    label: "Brown noise",
    description: "Deeper noise with more low frequencies.",
  },
  {
    id: "ocean",
    label: "Ocean waves",
    description: "Gentle rolling surf, slow and calming.",
  },
  {
    id: "rain",
    label: "Rain",
    description: "Soft rainfall style background.",
  },
  {
    id: "wind",
    label: "Wind",
    description: "Soft wind / air sound.",
  },
  {
    id: "soft-music",
    label: "Soft music",
    description: "Very gentle musical background.",
  },
];

export const SoundLibraryMenu: React.FC<SoundLibraryMenuProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="sound-library">
      <h3 className="section-subtitle">4. Choose Sound From Library</h3>
      <p className="section-helper">
        You can run Notch or CR therapy on top of different backgrounds. Choose
        the one that feels most comfortable for you.
      </p>

      <div className="sound-library-grid">
        {OPTIONS.map((opt) => {
          const isActive = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={
                "sound-option" +
                (isActive ? " sound-option--active" : "") +
                (disabled ? " sound-option--disabled" : "")
              }
            >
              <div className="sound-option-label">{opt.label}</div>
              <div className="sound-option-description">
                {opt.description}
              </div>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .sound-library {
          margin-top: 1.75rem;
        }

        .section-subtitle {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.35rem;
        }

        .section-helper {
          font-size: 0.875rem;
          color: #4b5563;
          margin-bottom: 0.75rem;
        }

        .sound-library-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem;
        }

        .sound-option {
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          padding: 0.6rem 0.9rem;
          background: #f9fafb;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 0.85rem;
        }

        .sound-option-label {
          font-weight: 600;
          margin-bottom: 0.15rem;
        }

        .sound-option-description {
          font-size: 0.78rem;
          color: #6b7280;
        }

        .sound-option--active {
          background: #0ea5e9;
          border-color: #0ea5e9;
          color: #ffffff;
        }

        .sound-option--active .sound-option-description {
          color: #e0f2fe;
        }

        .sound-option--disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .sound-option:hover:not(.sound-option--disabled) {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.2);
        }
      `}</style>
    </div>
  );
};

export default SoundLibraryMenu;
