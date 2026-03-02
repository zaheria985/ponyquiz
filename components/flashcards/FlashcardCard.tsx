"use client";

interface FlashcardCardProps {
  type: "flashcard_qa" | "flashcard_term" | "flashcard_image" | "labeled_diagram";
  question: string;
  answer: string;
  imagePath?: string | null;
  imageAlt?: string | null;
  hotspots?: { x: number; y: number; label: string }[] | null;
  flipped: boolean;
  animate: boolean;
  onFlip: () => void;
}

export default function FlashcardCard({
  type,
  question,
  answer,
  imagePath,
  imageAlt,
  hotspots,
  flipped,
  animate,
  onFlip,
}: FlashcardCardProps) {
  // For labeled_diagram: find the hotspot that matches this question's answer
  const activeHotspot = type === "labeled_diagram" && hotspots
    ? hotspots.find((h) => h.label === answer)
    : null;
  return (
    <div
      className="w-full max-w-lg mx-auto cursor-pointer select-none"
      style={{ perspective: "1000px" }}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-label={flipped ? "Showing answer. Click to show question." : "Showing question. Click to show answer."}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <div
        className={`relative w-full ${animate ? "transition-transform duration-[600ms]" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "280px",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 p-8"
          style={{
            backfaceVisibility: "hidden",
            backgroundColor: "var(--surface)",
            borderColor: "var(--interactive-border)",
          }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            {type === "flashcard_qa"
              ? "Question"
              : type === "flashcard_term"
              ? "Term"
              : "Identify"}
          </div>

          {type === "labeled_diagram" && imagePath && activeHotspot ? (
            <div className="w-full mb-3">
              <div className="relative w-full rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePath}
                  alt={imageAlt || "Diagram"}
                  className="w-full block"
                />
                {/* Highlight the active hotspot with an arrow marker */}
                <div
                  className="absolute w-7 h-7 rounded-full border-3 flex items-center justify-center text-sm font-bold -translate-x-1/2 -translate-y-1/2 animate-pulse"
                  style={{
                    left: `${activeHotspot.x}%`,
                    top: `${activeHotspot.y}%`,
                    backgroundColor: "var(--error-text)",
                    borderColor: "#fff",
                    color: "#fff",
                    boxShadow: "0 0 0 3px var(--error-text), 0 2px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  ?
                </div>
              </div>
              <p
                className="text-sm font-medium text-center mt-2"
                style={{ color: "var(--text-primary)" }}
              >
                What is this part?
              </p>
            </div>
          ) : type === "flashcard_image" && imagePath ? (
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePath}
                alt={imageAlt || "Flashcard image"}
                className="max-h-36 rounded-lg object-contain"
              />
            </div>
          ) : null}

          {type !== "labeled_diagram" && (
            <p
              className="text-lg font-medium text-center leading-relaxed"
              style={{ color: "var(--text-primary)" }}
            >
              {question}
            </p>
          )}

          <div
            className="mt-6 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            Tap to flip
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 p-8"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            backgroundColor: "var(--interactive-light)",
            borderColor: "var(--interactive-border)",
          }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            {type === "flashcard_qa"
              ? "Answer"
              : type === "flashcard_term"
              ? "Definition"
              : "Answer"}
          </div>

          {type === "labeled_diagram" && imagePath && activeHotspot ? (
            <div className="w-full mb-3">
              <div className="relative w-full rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePath}
                  alt={imageAlt || "Diagram"}
                  className="w-full block"
                />
                <div
                  className="absolute px-2 py-1 rounded-md text-xs font-bold -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                  style={{
                    left: `${activeHotspot.x}%`,
                    top: `${activeHotspot.y}%`,
                    backgroundColor: "var(--success-bg)",
                    color: "var(--success-text)",
                    border: "2px solid var(--success-border)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  {answer}
                </div>
              </div>
            </div>
          ) : type === "flashcard_term" && imagePath ? (
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePath}
                alt={imageAlt || "Flashcard image"}
                className="max-h-36 rounded-lg object-contain"
              />
            </div>
          ) : null}

          {type !== "labeled_diagram" && (
            <p
              className="text-lg font-medium text-center leading-relaxed"
              style={{ color: "var(--text-primary)" }}
            >
              {answer}
            </p>
          )}

          {type === "labeled_diagram" && (
            <p
              className="text-xl font-bold text-center"
              style={{ color: "var(--success-text)" }}
            >
              {answer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
