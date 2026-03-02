import pool from "@/lib/db";

interface BadgeCriteria {
  type: "quiz_count" | "quiz_score" | "streak" | "flashcard_count";
  threshold: number;
}

interface UnearnedBadge {
  id: string;
  name: string;
  criteria: BadgeCriteria;
}

interface UserStats {
  quiz_count: number;
  has_perfect_score: boolean;
  streak_count: number;
  flashcard_count: number;
}

async function getUserStats(userId: string): Promise<UserStats> {
  const [quizCountRes, perfectScoreRes, streakRes, flashcardRes] =
    await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count
       FROM quiz_attempts
       WHERE user_id = $1 AND completed_at IS NOT NULL`,
        [userId]
      ),
      pool.query(
        `SELECT EXISTS (
         SELECT 1 FROM quiz_attempts
         WHERE user_id = $1
           AND mode = 'graded'
           AND completed_at IS NOT NULL
           AND score = total_questions
           AND total_questions > 0
       ) AS has_perfect`,
        [userId]
      ),
      pool.query(
        `SELECT streak_count FROM users WHERE id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(review_count), 0)::int AS count
       FROM flashcard_progress
       WHERE user_id = $1`,
        [userId]
      ),
    ]);

  return {
    quiz_count: quizCountRes.rows[0]?.count ?? 0,
    has_perfect_score: perfectScoreRes.rows[0]?.has_perfect ?? false,
    streak_count: streakRes.rows[0]?.streak_count ?? 0,
    flashcard_count: flashcardRes.rows[0]?.count ?? 0,
  };
}

function evaluateCriteria(
  criteria: BadgeCriteria,
  stats: UserStats
): boolean {
  switch (criteria.type) {
    case "quiz_count":
      return stats.quiz_count >= criteria.threshold;
    case "quiz_score":
      return criteria.threshold === 100 && stats.has_perfect_score;
    case "streak":
      return stats.streak_count >= criteria.threshold;
    case "flashcard_count":
      return stats.flashcard_count >= criteria.threshold;
    default:
      return false;
  }
}

export async function checkAndAwardBadges(
  userId: string
): Promise<string[]> {
  // 1. Get all badges the user does NOT already have
  const unearnedRes = await pool.query(
    `SELECT b.id, b.name, b.criteria
     FROM badges b
     WHERE NOT EXISTS (
       SELECT 1 FROM student_badges sb
       WHERE sb.badge_id = b.id AND sb.user_id = $1
     )`,
    [userId]
  );

  const unearnedBadges: UnearnedBadge[] = unearnedRes.rows;

  if (unearnedBadges.length === 0) return [];

  // 2. Get user stats
  const stats = await getUserStats(userId);

  // 3. Evaluate each badge and collect newly earned ones
  const newlyEarned: string[] = [];

  for (const badge of unearnedBadges) {
    const criteria =
      typeof badge.criteria === "string"
        ? JSON.parse(badge.criteria)
        : badge.criteria;

    if (evaluateCriteria(criteria, stats)) {
      await pool.query(
        `INSERT INTO student_badges (user_id, badge_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, badge_id) DO NOTHING`,
        [userId, badge.id]
      );
      newlyEarned.push(badge.name);
    }
  }

  // Also check unlockables
  const unearnedUnlockablesRes = await pool.query(
    `SELECT u.id, u.name, u.criteria
     FROM unlockables u
     WHERE NOT EXISTS (
       SELECT 1 FROM student_unlockables su
       WHERE su.unlockable_id = u.id AND su.user_id = $1
     )`,
    [userId]
  );

  for (const unlockable of unearnedUnlockablesRes.rows) {
    const criteria =
      typeof unlockable.criteria === "string"
        ? JSON.parse(unlockable.criteria)
        : unlockable.criteria;

    // Unlockables with empty criteria or threshold 0 are free
    if (!criteria.type || criteria.threshold === 0) {
      await pool.query(
        `INSERT INTO student_unlockables (user_id, unlockable_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, unlockable_id) DO NOTHING`,
        [userId, unlockable.id]
      );
      continue;
    }

    if (evaluateCriteria(criteria, stats)) {
      await pool.query(
        `INSERT INTO student_unlockables (user_id, unlockable_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, unlockable_id) DO NOTHING`,
        [userId, unlockable.id]
      );
    }
  }

  return newlyEarned;
}
