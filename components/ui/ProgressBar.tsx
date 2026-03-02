interface ProgressBarProps {
  value: number;
  color?: string;
  className?: string;
}

export default function ProgressBar({
  value,
  color,
  className = "",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const barColor = color ?? "var(--interactive)";

  return (
    <div
      className={`w-full h-2.5 rounded-full overflow-hidden ${className}`}
      style={{ backgroundColor: "var(--surface-muted)" }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${clamped}%`,
          backgroundColor: barColor,
        }}
      />
    </div>
  );
}
