"use client";

interface TrueFalseQuestionProps {
  text: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
  selectedAnswer: string | null;
  correctAnswer: string | null;
}

export default function TrueFalseQuestion({
  text,
  onAnswer,
  disabled,
  selectedAnswer,
  correctAnswer,
}: TrueFalseQuestionProps) {
  const choices = ["True", "False"];

  return (
    <div>
      <h3
        className="text-lg font-semibold mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        {text}
      </h3>
      <div className="flex gap-4">
        {choices.map((choice) => {
          const isSelected = selectedAnswer === choice;
          const isCorrect = correctAnswer === choice;
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
              key={choice}
              onClick={() => onAnswer(choice)}
              disabled={disabled}
              className="flex-1 py-4 rounded-lg border text-base font-semibold transition-colors"
              style={{
                backgroundColor: bgColor,
                borderColor: borderColor,
                color: textColor,
                opacity: showResult && !isSelected && !isCorrect ? 0.6 : 1,
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
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
