"use server";

import pool from "@/lib/db";

export async function updateStreak(userId: string): Promise<void> {
  const res = await pool.query(
    `SELECT last_active_date FROM users WHERE id = $1`,
    [userId]
  );

  if (res.rows.length === 0) return;

  const lastActive = res.rows[0].last_active_date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lastActive) {
    const lastDate = new Date(lastActive);
    lastDate.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already active today, nothing to do
      return;
    } else if (diffDays === 1) {
      // Yesterday — increment streak
      await pool.query(
        `UPDATE users
         SET streak_count = streak_count + 1, last_active_date = CURRENT_DATE
         WHERE id = $1`,
        [userId]
      );
    } else {
      // Older than yesterday — reset streak to 1
      await pool.query(
        `UPDATE users
         SET streak_count = 1, last_active_date = CURRENT_DATE
         WHERE id = $1`,
        [userId]
      );
    }
  } else {
    // No previous activity — start streak at 1
    await pool.query(
      `UPDATE users
       SET streak_count = 1, last_active_date = CURRENT_DATE
       WHERE id = $1`,
      [userId]
    );
  }
}
