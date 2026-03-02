"use client";

interface MultipleChoiceQuestionProps {
  text: string;
  options: { text: string }[];
  onAnswer: (answer: string) => void;
  disabled: boolean;
  selectedAnswer: string | null;
  correctAnswer: string | null;
}

export default function MultipleChoiceQuestion({
  text,
  options,
  onAnswer,
  disabled,
  selectedAnswer,
  correctAnswer,
}: MultipleChoiceQuestionProps) {
  return (
    <div>
      <h3
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        {text}
      </h3>
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
                opacity: disabled && !isSelected && !isCorrect ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor =
                    "var(--interactive-light)";
                  e.currentTarget.style.borderColor =
                    "var(--interactive-border)";
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = bgColor;
                  e.currentTarget.style.borderColor = borderColor;
                }
              }}
            >
              <span className="mr-3 font-bold" style={{ color: "var(--text-muted)" }}>
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
