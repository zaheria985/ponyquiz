import { getAdminDashboard } from "@/lib/queries/admin";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { stats, recentAttempts } = await getAdminDashboard();

  return (
    <div>
      <PageHeader title="Admin Dashboard" />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={stats.total_students} />
        <StatCard label="Total Quizzes" value={stats.total_quizzes} />
        <StatCard label="Quizzes Today" value={stats.quizzes_today} />
        <StatCard label="Total Questions" value={stats.total_questions} />
      </div>

      {/* Average score */}
      <div className="mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Average Graded Score
              </p>
              <p
                className="text-3xl font-bold mt-1"
                style={{ color: "var(--text-primary)" }}
              >
                {stats.average_score != null
                  ? `${stats.average_score}%`
                  : "N/A"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card title="Recent Activity">
        {recentAttempts.length === 0 ? (
          <p
            className="text-sm text-center py-8"
            style={{ color: "var(--text-muted)" }}
          >
            No quiz attempts yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: "var(--border-light)" }}
                >
                  <th
                    className="text-left py-2 pr-4 font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Student
                  </th>
                  <th
                    className="text-left py-2 pr-4 font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Mode
                  </th>
                  <th
                    className="text-left py-2 pr-4 font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Score
                  </th>
                  <th
                    className="text-left py-2 font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="border-b last:border-b-0"
                    style={{ borderColor: "var(--border-light)" }}
                  >
                    <td
                      className="py-3 pr-4"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {attempt.user_name}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={attempt.mode === "graded" ? "primary" : "default"}>
                        {attempt.mode}
                      </Badge>
                    </td>
                    <td
                      className="py-3 pr-4 tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {attempt.score != null
                        ? `${attempt.score}/${attempt.total_questions}`
                        : "In progress"}
                    </td>
                    <td
                      className="py-3"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatDate(attempt.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-card border shadow-card px-5 py-4"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-light)",
      }}
    >
      <p
        className="text-sm font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-bold mt-1 tabular-nums"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
