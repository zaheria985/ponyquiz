"use client";

interface ScoreSummaryProps {
  score: number;
  total: number;
}

function getMessage(percent: number): string {
  if (percent >= 90) return "Amazing!";
  if (percent >= 70) return "Great job!";
  if (percent >= 50) return "Good effort!";
  return "Keep practicing!";
}

function getRingColor(percent: number): string {
  if (percent >= 70) return "var(--success-solid)";
  if (percent >= 50) return "var(--warning-text)";
  return "var(--error-text)";
}

export default function ScoreSummary({ score, total }: ScoreSummaryProps) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const message = getMessage(percent);
  const ringColor = getRingColor(percent);

  // SVG circle math
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* Circular progress ring */}
      <div className="relative mb-4">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--surface-muted)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {percent}%
          </span>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            {score}/{total}
          </span>
        </div>
      </div>

      {/* Encouraging message */}
      <p
        className="text-xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        {message}
      </p>
    </div>
  );
}
