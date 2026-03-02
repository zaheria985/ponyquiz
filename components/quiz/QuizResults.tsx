"use client";

import Link from "next/link";
import ScoreSummary from "@/components/quiz/ScoreSummary";

interface AnswerResult {
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  explanation: string | null;
}

interface QuizResultsProps {
  score: number;
  total: number;
  answers: AnswerResult[];
  onTryAgain: () => void;
}

export default function QuizResults({
  score,
  total,
  answers,
  onTryAgain,
}: QuizResultsProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Score summary */}
      <div
        className="rounded-xl border p-8"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border-light)",
        }}
      >
        <ScoreSummary score={score} total={total} />
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-4">
        <h3
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Question Breakdown
        </h3>

        {answers.map((answer, index) => (
          <div
            key={index}
            className="rounded-xl border p-5"
            style={{
              backgroundColor: answer.correct
                ? "var(--success-bg)"
                : "var(--error-bg)",
              borderColor: answer.correct
                ? "var(--success-border)"
                : "var(--error-border)",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: answer.correct
                    ? "var(--success-solid)"
                    : "var(--error-text)",
                  color: "var(--brand-contrast)",
                }}
              >
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {answer.questionText}
                </p>

                <div className="space-y-1">
                  <p className="text-sm">
                    <span style={{ color: "var(--text-muted)" }}>
                      Your answer:{" "}
                    </span>
                    <span
                      className="font-medium"
                      style={{
                        color: answer.correct
                          ? "var(--success-text)"
                          : "var(--error-text)",
                      }}
                    >
                      {answer.userAnswer}
                    </span>
                  </p>

                  {!answer.correct && (
                    <p className="text-sm">
                      <span style={{ color: "var(--text-muted)" }}>
                        Correct answer:{" "}
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "var(--success-text)" }}
                      >
                        {answer.correctAnswer}
                      </span>
                    </p>
                  )}

                  {answer.explanation && (
                    <p
                      className="text-sm mt-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {answer.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={onTryAgain}
          className="flex-1 py-3 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: "var(--interactive)",
            color: "var(--brand-contrast)",
          }}
        >
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="flex-1 py-3 rounded-lg text-sm font-semibold text-center transition-colors border"
          style={{
            backgroundColor: "var(--surface)",
            color: "var(--text-primary)",
            borderColor: "var(--border-light)",
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
