"use client";

interface FeedbackCardProps {
  correct: boolean;
  correctAnswer: string;
  explanation: string | null;
  onNext: () => void;
  isLast: boolean;
}

export default function FeedbackCard({
  correct,
  correctAnswer,
  explanation,
  onNext,
  isLast,
}: FeedbackCardProps) {
  return (
    <div
      className="rounded-xl border p-5 mt-4"
      style={{
        backgroundColor: correct ? "var(--success-bg)" : "var(--error-bg)",
        borderColor: correct ? "var(--success-border)" : "var(--error-border)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {correct ? (
          <CheckCircleIcon />
        ) : (
          <XCircleIcon />
        )}
        <span
          className="text-base font-semibold"
          style={{
            color: correct ? "var(--success-text)" : "var(--error-text)",
          }}
        >
          {correct ? "Correct!" : "Incorrect"}
        </span>
      </div>

      {!correct && (
        <p
          className="text-sm mb-2"
          style={{ color: correct ? "var(--success-text)" : "var(--error-text)" }}
        >
          The correct answer is: <strong>{correctAnswer}</strong>
        </p>
      )}

      {explanation && (
        <p
          className="text-sm mt-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {explanation}
        </p>
      )}

      <button
        onClick={onNext}
        className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
        style={{
          backgroundColor: "var(--interactive)",
          color: "var(--brand-contrast)",
        }}
      >
        {isLast ? "See Results" : "Next Question"}
      </button>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--success-text)" }}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--error-text)" }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
