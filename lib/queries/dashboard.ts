import pool from "@/lib/db";

export interface DashboardData {
  streakCount: number;
  lastActiveDate: string | null;
  badgeCount: number;
  overallMastery: number;
  topicProgress: TopicProgress[];
  recentQuizzes: RecentQuiz[];
}

export interface TopicProgress {
  topic_id: string;
  topic_name: string;
  total_questions: number;
  flashcards_studied: number;
  quiz_correct: number;
  quiz_total: number;
  mastery_percent: number;
}

export interface RecentQuiz {
  id: string;
  mode: string;
  score: number | null;
  total_questions: number;
  completed_at: string;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [userRes, badgeRes, topicRes, quizRes, masteryRes] = await Promise.all([
    // Streak and last active date
    pool.query(
      `SELECT streak_count, last_active_date
       FROM users
       WHERE id = $1`,
      [userId]
    ),

    // Badge count
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM student_badges
       WHERE user_id = $1`,
      [userId]
    ),

    // Per-topic progress
    pool.query(
      `SELECT
         t.id AS topic_id,
         t.name AS topic_name,
         COUNT(DISTINCT q.id)::int AS total_questions,
         COUNT(DISTINCT fp.question_id)::int AS flashcards_studied,
         COALESCE(SUM(CASE WHEN qa.correct THEN 1 ELSE 0 END), 0)::int AS quiz_correct,
         COUNT(qa.id)::int AS quiz_total
       FROM topics t
       INNER JOIN questions q ON q.topic_id = t.id AND q.active = true
       LEFT JOIN flashcard_progress fp
         ON fp.question_id = q.id AND fp.user_id = $1
       LEFT JOIN quiz_answers qa
         ON qa.question_id = q.id
         AND qa.quiz_attempt_id IN (
           SELECT id FROM quiz_attempts WHERE user_id = $1
         )
       GROUP BY t.id, t.name, t.sort_order
       ORDER BY t.sort_order, t.name`,
      [userId]
    ),

    // Recent quizzes (last 5 completed)
    pool.query(
      `SELECT id, mode, score, total_questions, completed_at
       FROM quiz_attempts
       WHERE user_id = $1 AND completed_at IS NOT NULL
       ORDER BY completed_at DESC
       LIMIT 5`,
      [userId]
    ),

    // Overall mastery
    pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN qa.correct THEN 1 ELSE 0 END), 0)::int AS correct,
         COUNT(qa.id)::int AS total
       FROM quiz_answers qa
       INNER JOIN quiz_attempts att ON att.id = qa.quiz_attempt_id
       WHERE att.user_id = $1`,
      [userId]
    ),
  ]);

  const user = userRes.rows[0];
  const badgeCount = badgeRes.rows[0]?.count ?? 0;
  const mastery = masteryRes.rows[0];
  const overallMastery =
    mastery.total > 0
      ? Math.round((mastery.correct / mastery.total) * 100)
      : 0;

  const topicProgress: TopicProgress[] = topicRes.rows.map((row) => ({
    topic_id: row.topic_id,
    topic_name: row.topic_name,
    total_questions: row.total_questions,
    flashcards_studied: row.flashcards_studied,
    quiz_correct: row.quiz_correct,
    quiz_total: row.quiz_total,
    mastery_percent:
      row.quiz_total > 0
        ? Math.round((row.quiz_correct / row.quiz_total) * 100)
        : 0,
  }));

  return {
    streakCount: user?.streak_count ?? 0,
    lastActiveDate: user?.last_active_date ?? null,
    badgeCount,
    overallMastery,
    topicProgress,
    recentQuizzes: quizRes.rows.map((row) => ({
      id: row.id,
      mode: row.mode,
      score: row.score,
      total_questions: row.total_questions,
      completed_at: row.completed_at,
    })),
  };
}
