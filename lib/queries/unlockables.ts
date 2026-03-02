import pool from "@/lib/db";

export interface UnlockableRow {
  id: string;
  name: string;
  type: "avatar" | "theme" | "title";
  criteria: { type: string; threshold: number };
  asset_path: string | null;
  created_at: string;
}

export interface UserUnlockable extends UnlockableRow {
  earned: boolean;
  earned_at: string | null;
  equipped: boolean;
}

export interface EquippedItems {
  avatar: string | null;
  theme: string | null;
  title: string | null;
}

export async function getUnlockables(): Promise<UnlockableRow[]> {
  const res = await pool.query(
    `SELECT id, name, type, criteria, asset_path, created_at
     FROM unlockables
     ORDER BY type, created_at ASC`
  );
  return res.rows;
}

export async function getUserUnlockables(
  userId: string
): Promise<UserUnlockable[]> {
  const res = await pool.query(
    `SELECT
       u.id,
       u.name,
       u.type,
       u.criteria,
       u.asset_path,
       u.created_at,
       CASE WHEN su.id IS NOT NULL THEN true ELSE false END AS earned,
       su.earned_at,
       COALESCE(su.equipped, false) AS equipped
     FROM unlockables u
     LEFT JOIN student_unlockables su ON su.unlockable_id = u.id AND su.user_id = $1
     ORDER BY u.type, u.created_at ASC`,
    [userId]
  );
  return res.rows;
}

export async function getEquippedItems(
  userId: string
): Promise<EquippedItems> {
  const res = await pool.query(
    `SELECT
       u.type,
       u.name,
       u.asset_path
     FROM student_unlockables su
     INNER JOIN unlockables u ON u.id = su.unlockable_id
     WHERE su.user_id = $1 AND su.equipped = true`,
    [userId]
  );

  const items: EquippedItems = {
    avatar: null,
    theme: null,
    title: null,
  };

  for (const row of res.rows) {
    if (row.type === "avatar") items.avatar = row.asset_path || row.name;
    if (row.type === "theme") items.theme = row.asset_path || row.name;
    if (row.type === "title") items.title = row.name;
  }

  return items;
}
