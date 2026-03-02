"use client";

import { useState } from "react";

interface DiagramQuestionProps {
  text: string;
  imagePath: string | null;
  imageAlt: string | null;
  activeHotspot: { x: number; y: number } | null;
  options: { text: string }[] | null;
  onAnswer: (answer: string) => void;
  disabled: boolean;
  selectedAnswer: string | null;
  correctAnswer: string | null;
}

export default function DiagramQuestion({
  text,
  imagePath,
  imageAlt,
  activeHotspot,
  options,
  onAnswer,
  disabled,
  selectedAnswer,
  correctAnswer,
}: DiagramQuestionProps) {
  const [textAnswer, setTextAnswer] = useState("");

  function handleTextSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (textAnswer.trim()) {
      onAnswer(textAnswer.trim());
    }
  }

  // If options are provided, render as multiple choice
  if (options && options.length > 0) {
    return (
      <div>
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          {text}
        </h3>

        {imagePath && (
          <div className="mb-4 flex justify-center">
            <div
              className="relative rounded-lg overflow-hidden border"
              style={{ borderColor: "var(--border-light)", maxWidth: "100%" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePath}
                alt={imageAlt || "Diagram"}
                className="block max-h-80"
                style={{ maxWidth: "100%", height: "auto" }}
              />
              {activeHotspot && (
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
              )}
            </div>
          </div>
        )}

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
                  opacity: showResult && !isSelected && !isCorrect ? 0.6 : 1,
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
      </div>
    );
  }

  // Fallback: text input for labeling
  return (
    <div>
      <h3
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        {text}
      </h3>

      {imagePath && (
        <div className="mb-4 flex justify-center">
          <div
            className="relative rounded-lg overflow-hidden border"
            style={{ borderColor: "var(--border-light)", maxWidth: "100%" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePath}
              alt={imageAlt || "Diagram"}
              className="block max-h-80"
              style={{ maxWidth: "100%", height: "auto" }}
            />
            {activeHotspot && (
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
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleTextSubmit}>
        <div className="flex gap-3">
          <input
            type="text"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={disabled}
            placeholder="Type the label..."
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
    </div>
  );
}
