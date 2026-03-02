"use client";

import { useState } from "react";

interface ImageQuestionProps {
  text: string;
  type: "photo_id" | "image_text";
  imagePath: string | null;
  imageAlt: string | null;
  options: { text: string }[] | null;
  onAnswer: (answer: string) => void;
  disabled: boolean;
  selectedAnswer: string | null;
  correctAnswer: string | null;
}

export default function ImageQuestion({
  text,
  type,
  imagePath,
  imageAlt,
  options,
  onAnswer,
  disabled,
  selectedAnswer,
  correctAnswer,
}: ImageQuestionProps) {
  const [textAnswer, setTextAnswer] = useState("");

  function handleTextSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (textAnswer.trim()) {
      onAnswer(textAnswer.trim());
    }
  }

  return (
    <div>
      <h3
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        {text}
      </h3>

      {imagePath && (
        <div
          className="mb-4 rounded-lg overflow-hidden border"
          style={{ borderColor: "var(--border-light)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePath}
            alt={imageAlt || "Question image"}
            className="w-full max-h-80 object-contain"
            style={{ backgroundColor: "var(--surface-muted)" }}
          />
        </div>
      )}

      {type === "photo_id" && options && options.length > 0 ? (
        <div className="space-y-3">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option.text;
            const isCorrect = correctAnswer === option.text;
            const showResult = selectedAnswer !== null;

            let bgColor = "var(--surface)";
            let borderColor = "var(--border-light)";
            let textColor = "var(--text-primary)";

            if (showResult && isCorrect) {
              bgColor = "var(--success-bg)";
              borderColor = "var(--success-border)";
              textColor = "var(--success-text)";
            } else if (showResult && isSelected && !isCorrect) {
              bgColor = "var(--error-bg)";
              borderColor = "var(--error-border)";
              textColor = "var(--error-text)";
            }

            return (
              <button
                key={index}
                onClick={() => onAnswer(option.text)}
                disabled={disabled}
                className="w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors"
                style={{
                  backgroundColor: bgColor,
                  borderColor: borderColor,
                  color: textColor,
                  opacity:
                    showResult && !isSelected && !isCorrect ? 0.6 : 1,
                }}
              >
                <span
                  className="mr-3 font-bold"
                  style={{ color: "var(--text-muted)" }}
                >
                  {String.fromCharCode(65 + index)}.
                </span>
                {option.text}
              </button>
            );
          })}
        </div>
      ) : (
        <form onSubmit={handleTextSubmit}>
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
