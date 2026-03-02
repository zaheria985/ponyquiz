"use client";

interface LeaderboardEntry {
  id: string;
  name: string;
  title: string | null;
  total_score: number;
  badge_count: number;
  streak_count: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
}

export default function LeaderboardTable({
  entries,
  currentUserId,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <p
        className="text-sm text-center py-8"
        style={{ color: "var(--text-muted)" }}
      >
        No students have completed quizzes yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b"
            style={{ borderColor: "var(--border-light)" }}
          >
            <th
              className="text-left py-3 pr-4 font-medium w-12"
              style={{ color: "var(--text-secondary)" }}
            >
              #
            </th>
            <th
              className="text-left py-3 pr-4 font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Student
            </th>
            <th
              className="text-right py-3 pr-4 font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Score
            </th>
            <th
              className="text-right py-3 pr-4 font-medium hidden sm:table-cell"
              style={{ color: "var(--text-secondary)" }}
            >
              Badges
            </th>
            <th
              className="text-right py-3 font-medium hidden sm:table-cell"
              style={{ color: "var(--text-secondary)" }}
            >
              Streak
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const isCurrentUser = entry.id === currentUserId;
            const rank = index + 1;

            return (
              <tr
                key={entry.id}
                className="border-b last:border-b-0 transition-colors"
                style={{
                  borderColor: "var(--border-light)",
                  backgroundColor: isCurrentUser
                    ? "var(--interactive-light)"
                    : "transparent",
                }}
              >
                <td
                  className="py-3 pr-4 tabular-nums font-semibold"
                  style={{
                    color:
                      rank <= 3
                        ? "var(--interactive)"
                        : "var(--text-muted)",
                  }}
                >
                  {rank === 1 && "\ud83e\udd47"}
                  {rank === 2 && "\ud83e\udd48"}
                  {rank === 3 && "\ud83e\udd49"}
                  {rank > 3 && rank}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-col">
                    <span
                      className="font-medium"
                      style={{
                        color: isCurrentUser
                          ? "var(--interactive)"
                          : "var(--text-primary)",
                      }}
                    >
                      {entry.name}
                      {isCurrentUser && (
                        <span className="text-xs ml-1">(you)</span>
                      )}
                    </span>
                    {entry.title && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {entry.title}
                      </span>
                    )}
                  </div>
                </td>
                <td
                  className="py-3 pr-4 text-right tabular-nums font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {entry.total_score}
                </td>
                <td
                  className="py-3 pr-4 text-right tabular-nums hidden sm:table-cell"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {entry.badge_count}
                </td>
                <td
                  className="py-3 text-right tabular-nums hidden sm:table-cell"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {entry.streak_count > 0
                    ? `${entry.streak_count}d`
                    : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
