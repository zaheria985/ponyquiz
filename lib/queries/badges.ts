import pool from "@/lib/db";

export interface BadgeRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  criteria: { type: string; threshold: number };
  created_at: string;
}

export interface UserBadge extends BadgeRow {
  earned_at: string;
}

export interface BadgeWithStatus extends BadgeRow {
  earned: boolean;
  earned_at: string | null;
}

export async function getBadges(): Promise<BadgeRow[]> {
  const res = await pool.query(
    `SELECT id, name, description, icon, criteria, created_at
     FROM badges
     ORDER BY created_at ASC`
  );
  return res.rows;
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const res = await pool.query(
    `SELECT b.id, b.name, b.description, b.icon, b.criteria, b.created_at, sb.earned_at
     FROM badges b
     INNER JOIN student_badges sb ON sb.badge_id = b.id
     WHERE sb.user_id = $1
     ORDER BY sb.earned_at DESC`,
    [userId]
  );
  return res.rows;
}

export async function getBadgesWithStatus(
  userId: string
): Promise<BadgeWithStatus[]> {
  const res = await pool.query(
    `SELECT
       b.id,
       b.name,
       b.description,
       b.icon,
       b.criteria,
       b.created_at,
       CASE WHEN sb.id IS NOT NULL THEN true ELSE false END AS earned,
       sb.earned_at
     FROM badges b
     LEFT JOIN student_badges sb ON sb.badge_id = b.id AND sb.user_id = $1
     ORDER BY
       CASE WHEN sb.id IS NOT NULL THEN 0 ELSE 1 END,
       b.created_at ASC`,
    [userId]
  );
  return res.rows;
}
