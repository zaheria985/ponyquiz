import pool from "@/lib/db";

export interface Topic {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export async function getTopics(): Promise<Topic[]> {
  const res = await pool.query(
    "SELECT id, name, sort_order, created_at FROM topics ORDER BY sort_order, name"
  );
  return res.rows;
}

export async function getTopic(id: string): Promise<Topic | null> {
  const res = await pool.query(
    "SELECT id, name, sort_order, created_at FROM topics WHERE id = $1",
    [id]
  );
  return res.rows[0] || null;
}
