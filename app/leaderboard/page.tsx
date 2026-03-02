import { getCurrentUser } from "@/lib/session";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();

  const res = await pool.query(
    `SELECT
       u.id,
       u.name,
       u.title,
       COALESCE(SUM(qa.score), 0)::int AS total_score,
       (SELECT COUNT(*)::int FROM student_badges sb WHERE sb.user_id = u.id) AS badge_count,
       u.streak_count
     FROM users u
     LEFT JOIN quiz_attempts qa
       ON qa.user_id = u.id
       AND qa.completed_at IS NOT NULL
       AND qa.mode = 'graded'
     WHERE u.role = 'student'
     GROUP BY u.id, u.name, u.title, u.streak_count
     ORDER BY total_score DESC, u.name ASC
     LIMIT 50`
  );

  return (
    <div>
      <PageHeader title="Leaderboard" />
      <Card>
        <LeaderboardTable
          entries={res.rows}
          currentUserId={user?.id ?? null}
        />
      </Card>
    </div>
  );
}
