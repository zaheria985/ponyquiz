"use client";

interface FlashcardCardProps {
  type: "flashcard_qa" | "flashcard_term" | "flashcard_image";
  question: string;
  answer: string;
  imagePath?: string | null;
  imageAlt?: string | null;
  flipped: boolean;
  onFlip: () => void;
}

export default function FlashcardCard({
  type,
  question,
  answer,
  imagePath,
  imageAlt,
  flipped,
  onFlip,
}: FlashcardCardProps) {
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
        className="relative w-full transition-transform duration-[600ms]"
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

          {type === "flashcard_image" && imagePath ? (
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePath}
                alt={imageAlt || "Flashcard image"}
                className="max-h-36 rounded-lg object-contain"
              />
            </div>
          ) : null}

          <p
            className="text-lg font-medium text-center leading-relaxed"
            style={{ color: "var(--text-primary)" }}
          >
            {question}
          </p>

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

          {type === "flashcard_term" && imagePath ? (
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePath}
                alt={imageAlt || "Flashcard image"}
                className="max-h-36 rounded-lg object-contain"
              />
            </div>
          ) : null}

          <p
            className="text-lg font-medium text-center leading-relaxed"
            style={{ color: "var(--text-primary)" }}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
