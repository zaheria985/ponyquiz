import pool from "@/lib/db";

export interface DashboardStats {
  total_students: number;
  total_quizzes: number;
  quizzes_today: number;
  total_questions: number;
  average_score: number | null;
}

export interface RecentAttempt {
  id: string;
  user_name: string;
  mode: string;
  score: number | null;
  total_questions: number;
  completed_at: string | null;
  created_at: string;
}

export interface AdminDashboard {
  stats: DashboardStats;
  recentAttempts: RecentAttempt[];
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const statsRes = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS total_students,
      (SELECT COUNT(*)::int FROM quiz_attempts) AS total_quizzes,
      (SELECT COUNT(*)::int FROM quiz_attempts WHERE created_at >= CURRENT_DATE) AS quizzes_today,
      (SELECT COUNT(*)::int FROM questions) AS total_questions,
      (SELECT ROUND(AVG(score)::numeric, 1)::float FROM quiz_attempts WHERE mode = 'graded' AND score IS NOT NULL) AS average_score
  `);

  const recentRes = await pool.query(`
    SELECT
      qa.id,
      u.name AS user_name,
      qa.mode,
      qa.score,
      qa.total_questions,
      qa.completed_at,
      qa.created_at
    FROM quiz_attempts qa
    JOIN users u ON qa.user_id = u.id
    ORDER BY qa.created_at DESC
    LIMIT 10
  `);

  return {
    stats: statsRes.rows[0],
    recentAttempts: recentRes.rows,
  };
}

export interface StudentSummary {
  id: string;
  name: string;
  email: string;
  created_at: string;
  streak_count: number;
  last_active_date: string | null;
  total_quizzes: number;
  average_score: number | null;
  badge_count: number;
}

export async function getStudents(): Promise<StudentSummary[]> {
  const res = await pool.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.created_at,
      u.streak_count,
      u.last_active_date,
      COALESCE(qa.total_quizzes, 0)::int AS total_quizzes,
      qa.average_score,
      COALESCE(sb.badge_count, 0)::int AS badge_count
    FROM users u
    LEFT JOIN (
      SELECT
        user_id,
        COUNT(*)::int AS total_quizzes,
        ROUND(AVG(score)::numeric, 1)::float AS average_score
      FROM quiz_attempts
      WHERE score IS NOT NULL
      GROUP BY user_id
    ) qa ON u.id = qa.user_id
    LEFT JOIN (
      SELECT user_id, COUNT(*)::int AS badge_count
      FROM student_badges
      GROUP BY user_id
    ) sb ON u.id = sb.user_id
    WHERE u.role = 'student'
    ORDER BY u.name
  `);

  return res.rows;
}

export interface StudentQuizAttempt {
  id: string;
  mode: string;
  score: number | null;
  total_questions: number;
  completed_at: string | null;
  created_at: string;
}

export interface StudentBadge {
  badge_id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface FlashcardSummary {
  total_cards: number;
  mastered: number;
  learning: number;
  not_started: number;
}

export interface StudentDetail {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  title: string | null;
  streak_count: number;
  last_active_date: string | null;
  created_at: string;
  quizHistory: StudentQuizAttempt[];
  flashcardSummary: FlashcardSummary;
  badges: StudentBadge[];
}

export async function getStudentDetail(id: string): Promise<StudentDetail | null> {
  const userRes = await pool.query(
    `SELECT id, name, email, avatar, title, streak_count, last_active_date, created_at
     FROM users
     WHERE id = $1 AND role = 'student'`,
    [id]
  );

  if (userRes.rows.length === 0) {
    return null;
  }

  const user = userRes.rows[0];

  const [quizRes, flashcardRes, badgeRes] = await Promise.all([
    pool.query(
      `SELECT id, mode, score, total_questions, completed_at, created_at
       FROM quiz_attempts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [id]
    ),
    pool.query(
      `SELECT
         COUNT(*)::int AS total_cards,
         COUNT(*) FILTER (WHERE status = 'mastered')::int AS mastered,
         COUNT(*) FILTER (WHERE status = 'learning')::int AS learning,
         COUNT(*) FILTER (WHERE status IS NULL OR status NOT IN ('mastered', 'learning'))::int AS not_started
       FROM flashcard_progress
       WHERE user_id = $1`,
      [id]
    ),
    pool.query(
      `SELECT b.id AS badge_id, b.name, b.description, b.icon
       FROM student_badges sb
       JOIN badges b ON sb.badge_id = b.id
       WHERE sb.user_id = $1
       ORDER BY b.name`,
      [id]
    ),
  ]);

  const flashcard = flashcardRes.rows[0] || {
    total_cards: 0,
    mastered: 0,
    learning: 0,
    not_started: 0,
  };

  return {
    ...user,
    quizHistory: quizRes.rows,
    flashcardSummary: flashcard,
    badges: badgeRes.rows,
  };
}
