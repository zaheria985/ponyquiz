interface StreakTrackerProps {
  streakCount: number;
  lastActiveDate: string | null;
}

function getLastSevenDays(lastActiveDate: string | null): boolean[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: boolean[] = [];

  if (!lastActiveDate) {
    return Array(7).fill(false);
  }

  const lastActive = new Date(lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);

    const diffMs = lastActive.getTime() - day.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // Day is active if it's within the streak range ending at lastActiveDate
    days.push(diffDays >= 0 && diffDays < 7);
  }

  return days;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function getDayLabelsForWeek(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    labels.push(DAY_LABELS[dow === 0 ? 6 : dow - 1]);
  }
  return labels;
}

export default function StreakTracker({
  streakCount,
  lastActiveDate,
}: StreakTrackerProps) {
  const activeDays = getLastSevenDays(lastActiveDate);
  const dayLabels = getDayLabelsForWeek();

  return (
    <div
      className="rounded-card border shadow-card p-5"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-light)",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl" role="img" aria-label="fire">
          &#x1F525;
        </span>
        <div>
          <span
            className="text-3xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {streakCount}
          </span>
          <span
            className="text-sm ml-1"
            style={{ color: "var(--text-secondary)" }}
          >
            day streak
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        {activeDays.map((active, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
              style={{
                backgroundColor: active
                  ? "var(--interactive)"
                  : "var(--surface-muted)",
                color: active
                  ? "var(--brand-contrast)"
                  : "var(--text-muted)",
              }}
            >
              {dayLabels[i]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
