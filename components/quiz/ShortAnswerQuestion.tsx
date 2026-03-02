"use client";

import { useState } from "react";

interface ShortAnswerQuestionProps {
  text: string;
  type: "flashcard_qa" | "flashcard_term";
  onAnswer: (answer: string) => void;
  disabled: boolean;
  selectedAnswer: string | null;
  correctAnswer: string | null;
}

export default function ShortAnswerQuestion({
  text,
  type,
  onAnswer,
  disabled,
  selectedAnswer,
  correctAnswer,
}: ShortAnswerQuestionProps) {
  const [textAnswer, setTextAnswer] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (textAnswer.trim()) {
      onAnswer(textAnswer.trim());
    }
  }

  return (
    <div>
      <div
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        {type === "flashcard_term" ? "Define this term" : "Short Answer"}
      </div>
      <h3
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        {text}
      </h3>

      {selectedAnswer !== null && correctAnswer !== null ? (
        <div className="space-y-2">
          <div
            className="px-4 py-3 rounded-lg border text-sm"
            style={{
              backgroundColor:
                selectedAnswer.toLowerCase().trim() ===
                correctAnswer.toLowerCase().trim()
                  ? "var(--success-bg)"
                  : "var(--error-bg)",
              borderColor:
                selectedAnswer.toLowerCase().trim() ===
                correctAnswer.toLowerCase().trim()
                  ? "var(--success-border)"
                  : "var(--error-border)",
              color:
                selectedAnswer.toLowerCase().trim() ===
                correctAnswer.toLowerCase().trim()
                  ? "var(--success-text)"
                  : "var(--error-text)",
            }}
          >
            <span className="font-medium">Your answer:</span> {selectedAnswer}
          </div>
          {selectedAnswer.toLowerCase().trim() !==
            correctAnswer.toLowerCase().trim() && (
            <div
              className="px-4 py-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--success-bg)",
                borderColor: "var(--success-border)",
                color: "var(--success-text)",
              }}
            >
              <span className="font-medium">Correct answer:</span>{" "}
              {correctAnswer}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={disabled}
              placeholder="Type your answer..."
              className="flex-1 px-4 py-2.5 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
              }}
            />
            <button
              type="submit"
              disabled={disabled || !textAnswer.trim()}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{
                backgroundColor: "var(--interactive)",
                color: "var(--brand-contrast)",
                opacity: disabled || !textAnswer.trim() ? 0.5 : 1,
              }}
            >
              Submit
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
