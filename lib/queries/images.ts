import pool from "@/lib/db";

export interface Image {
  id: string;
  file_path: string;
  alt_text: string | null;
  type: string;
  hotspots: { x: number; y: number; label: string }[];
  created_at: string;
  question_count?: number;
}

export async function getImages(type?: string): Promise<Image[]> {
  const conditions: string[] = [];
  const params: string[] = [];
  let paramIndex = 1;

  if (type) {
    conditions.push(`i.type = $${paramIndex++}`);
    params.push(type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const res = await pool.query(
    `SELECT i.id, i.file_path, i.alt_text, i.type, i.hotspots, i.created_at,
            COUNT(q.id)::int AS question_count
     FROM images i
     LEFT JOIN questions q ON q.image_id = i.id
     ${where}
     GROUP BY i.id
     ORDER BY i.created_at DESC`,
    params
  );
  return res.rows;
}

export async function getImage(id: string): Promise<Image | null> {
  const res = await pool.query(
    `SELECT i.id, i.file_path, i.alt_text, i.type, i.hotspots, i.created_at,
            COUNT(q.id)::int AS question_count
     FROM images i
     LEFT JOIN questions q ON q.image_id = i.id
     WHERE i.id = $1
     GROUP BY i.id`,
    [id]
  );
  return res.rows[0] || null;
}
