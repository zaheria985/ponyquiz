import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import type { RecentQuiz } from "@/lib/queries/dashboard";

interface RecentActivityProps {
  quizzes: RecentQuiz[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function RecentActivity({ quizzes }: RecentActivityProps) {
  return (
    <div
      className="rounded-card border shadow-card p-5"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-light)",
      }}
    >
      <h3
        className="text-base font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Recent Quizzes
      </h3>
      {quizzes.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">&#x1F4DD;</span>}
          title="No quizzes yet"
          description="Take a practice quiz or test to see your results here."
        />
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex items-center justify-between py-2 border-b last:border-b-0"
              style={{ borderColor: "var(--border-light)" }}
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={quiz.mode === "graded" ? "primary" : "default"}
                >
                  {quiz.mode === "graded" ? "Graded" : "Practice"}
                </Badge>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {quiz.score !== null
                    ? `${quiz.score}/${quiz.total_questions}`
                    : `${quiz.total_questions} questions`}
                </span>
              </div>
              <span
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {formatDate(quiz.completed_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
