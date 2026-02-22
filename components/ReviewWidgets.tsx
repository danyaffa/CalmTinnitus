// FILE: components/ReviewWidgets.tsx

"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";
import { addReview } from "../lib/firestore";
import { APP_NAME } from "../lib/appConfig";

export type ReviewWidgetProps = {
  appName?: string;
  appStoreUrl?: string;
  feedbackEndpoint?: string;
};

const DEFAULT_APP_STORE_URL =
  "https://example.com/your-app-store-review-page";

const starButton: CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
  minHeight: 44,
};

const inputBase: CSSProperties = {
  width: "100%",
  borderRadius: 8,
  padding: 8,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "white",
  fontSize: 16,
};

const buttonBase: CSSProperties = {
  width: "100%",
  padding: "10px",
  borderRadius: 8,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14,
  minHeight: 44,
};

type ReviewStats = {
  count: number;
  average: number | null;
};

const ReviewWidgets: React.FC<ReviewWidgetProps> = ({ appStoreUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const storeUrl = appStoreUrl || DEFAULT_APP_STORE_URL;

  // --- Draggable state ---
  const pillRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [positioned, setPositioned] = useState(false);
  const dragState = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    hasMoved: false,
  });

  // Set initial position (bottom-right)
  useEffect(() => {
    if (typeof window === "undefined") return;
    setPos({
      x: window.innerWidth - 220,
      y: window.innerHeight - 80,
    });
    setPositioned(true);
  }, []);

  // Clamp position within viewport
  const clamp = useCallback(
    (x: number, y: number) => {
      if (typeof window === "undefined") return { x, y };
      const el = pillRef.current;
      const w = el?.offsetWidth ?? 180;
      const h = el?.offsetHeight ?? 44;
      return {
        x: Math.max(0, Math.min(x, window.innerWidth - w)),
        y: Math.max(0, Math.min(y, window.innerHeight - h)),
      };
    },
    []
  );

  // --- Mouse drag handlers ---
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragState.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startPosX: pos.x,
        startPosY: pos.y,
        hasMoved: false,
      };
    },
    [pos]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const d = dragState.current;
      if (!d.dragging) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        d.hasMoved = true;
      }
      const clamped = clamp(d.startPosX + dx, d.startPosY + dy);
      setPos(clamped);
    };

    const onMouseUp = () => {
      dragState.current.dragging = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [clamp]);

  // --- Touch drag handlers ---
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      dragState.current = {
        dragging: true,
        startX: touch.clientX,
        startY: touch.clientY,
        startPosX: pos.x,
        startPosY: pos.y,
        hasMoved: false,
      };
    },
    [pos]
  );

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      const d = dragState.current;
      if (!d.dragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - d.startX;
      const dy = touch.clientY - d.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        d.hasMoved = true;
      }
      const clamped = clamp(d.startPosX + dx, d.startPosY + dy);
      setPos(clamped);
    };

    const onTouchEnd = () => {
      dragState.current.dragging = false;
    };

    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [clamp]);

  const handlePillClick = useCallback(() => {
    // Only open if we didn't drag
    if (!dragState.current.hasMoved) {
      setIsOpen(true);
    }
  }, []);

  // Load review stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const res = await fetch("/api/review-stats");
        if (!res.ok) throw new Error("Failed to load review stats");
        const data = (await res.json()) as {
          success: boolean;
          count?: number;
          average?: number | null;
        };
        if (data.success && typeof data.count === "number") {
          setStats({
            count: data.count,
            average: typeof data.average === "number" ? data.average : null,
          });
        }
      } catch (err) {
        console.error("Review stats error:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    setLoading(true);
    try {
      const isPositive = rating >= 4;

      if (isPositive) {
        try {
          await addReview("guest", rating, comment, APP_NAME);
        } catch (err) {
          console.error("addReview failed:", err);
        }

        try {
          await fetch("/api/review-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rating,
              comment,
              text: comment,
              appName: APP_NAME,
            }),
          });
        } catch (err) {
          console.error("Review email send failed:", err);
        }

        setStats((prev) => {
          if (!prev) return { count: 1, average: rating };
          const newCount = prev.count + 1;
          const oldAvg = prev.average ?? rating;
          const newAvg = (oldAvg * prev.count + rating) / newCount;
          return { count: newCount, average: newAvg };
        });
      }

      setSubmitted(true);

      if (isPositive && storeUrl) {
        try {
          setTimeout(() => {
            try {
              window.open(storeUrl, "_blank", "noopener,noreferrer");
            } catch (err) {
              console.error("Failed to open store URL:", err);
            }
          }, 2500);
        } catch (err) {
          console.error("setTimeout for store URL failed:", err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStore = () => {
    if (!storeUrl) return;
    try {
      window.open(storeUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open store URL:", err);
    }
  };

  const renderPillText = () => {
    if (statsLoading) {
      return (
        <>
          <span style={{ color: "#eab308" }}>&#9733;&#9733;&#9733;&#9733;&#9733;</span>
          <span>Loading...</span>
        </>
      );
    }

    if (stats && stats.count > 0) {
      const avg = stats.average ?? 4.9;
      return (
        <>
          <span style={{ color: "#eab308" }}>&#9733;&#9733;&#9733;&#9733;&#9733;</span>
          <span>
            {avg.toFixed(1)}/5 &bull; {stats.count} review
            {stats.count === 1 ? "" : "s"}
          </span>
        </>
      );
    }

    return (
      <>
        <span style={{ color: "#eab308" }}>&#9733;&#9733;&#9733;&#9733;&#9733;</span>
        <span>4.9/5 Reviews</span>
      </>
    );
  };

  if (!positioned) return null;

  // Floating draggable pill (closed state)
  if (!isOpen) {
    return (
      <div
        ref={pillRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={handlePillClick}
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          zIndex: 9998,
          background: "#ffffff",
          color: "#0f172a",
          padding: "8px 16px",
          borderRadius: 999,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
          fontWeight: 600,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "grab",
          border: "1px solid #e2e8f0",
          userSelect: "none",
          touchAction: "none",
          whiteSpace: "nowrap",
        }}
      >
        {renderPillText()}
      </div>
    );
  }

  // Open modal — positioned near where the pill was
  const modalX = Math.min(pos.x, (typeof window !== "undefined" ? window.innerWidth : 400) - 320);
  const modalY = Math.max(0, pos.y - 350);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => {
          setIsOpen(false);
          setSubmitted(false);
          setComment("");
        }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.4)",
          backdropFilter: "blur(2px)",
          zIndex: 9998,
        }}
      />

      <div
        style={{
          position: "fixed",
          left: Math.max(10, modalX),
          top: Math.max(10, modalY),
          zIndex: 9999,
          background: "#1e293b",
          color: "white",
          padding: 20,
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          width: 300,
          maxWidth: "calc(100vw - 20px)",
          border: "1px solid #334155",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>Rate {APP_NAME}</h3>
          <button
            onClick={() => {
              setIsOpen(false);
              setSubmitted(false);
              setComment("");
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 16,
              minHeight: 44,
              padding: "0 8px",
            }}
          >
            &#10005;
          </button>
        </div>

        {submitted ? (
          rating >= 4 ? (
            <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
              <p
                style={{
                  margin: 0,
                  marginBottom: 10,
                  color: "#4ade80",
                  fontWeight: 600,
                }}
              >
                Thank you for your feedback!
              </p>
              <p
                style={{
                  margin: 0,
                  marginBottom: 12,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                If the store page didn&apos;t open, tap below to leave a quick
                review in the app store. It helps more people discover{" "}
                {APP_NAME}.
              </p>
              <button
                onClick={handleOpenStore}
                style={{
                  ...buttonBase,
                  background: "#facc15",
                  color: "#0f172a",
                  marginBottom: 8,
                }}
              >
                Leave a review in the app store
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSubmitted(false);
                  setComment("");
                }}
                style={{
                  ...buttonBase,
                  background: "#0f172a",
                  color: "#e5e7eb",
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
              <p
                style={{
                  margin: 0,
                  marginBottom: 10,
                  color: "#f97316",
                  fontWeight: 600,
                }}
              >
                Thank you for your honest feedback.
              </p>
              <p
                style={{
                  margin: 0,
                  marginBottom: 12,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                We&apos;ll review your comments carefully to keep improving{" "}
                {APP_NAME}.
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSubmitted(false);
                  setComment("");
                }}
                style={{
                  ...buttonBase,
                  background: "#0f172a",
                  color: "#e5e7eb",
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                Close
              </button>
            </div>
          )
        ) : (
          <>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
                justifyContent: "center",
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    ...starButton,
                    color: star <= rating ? "#eab308" : "#475569",
                  }}
                >
                  &#9733;
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Tell us what you think about ${APP_NAME}...`}
              style={{
                ...inputBase,
                height: 80,
                marginBottom: 12,
                resize: "none",
              }}
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...buttonBase,
                background: "#38bdf8",
                color: "#0f172a",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "default" : "pointer",
              }}
            >
              {loading ? "Sending..." : "Submit Review"}
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default ReviewWidgets;

export const ReviewWidget = ReviewWidgets;
