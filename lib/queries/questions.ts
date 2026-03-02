import pool from "@/lib/db";

export interface Question {
  id: string;
  text: string;
  type: string;
  topic_id: string | null;
  topic_name?: string;
  difficulty: string;
  explanation: string | null;
  options: any;
  answer: string | null;
  image_id: string | null;
  image_path?: string;
  active: boolean;
  created_at: string;
}

export async function getQuestions(filters?: {
  topicId?: string;
  type?: string;
  difficulty?: string;
  active?: boolean;
}): Promise<Question[]> {
  const conditions: string[] = [];
  const params: (string | boolean)[] = [];
  let paramIndex = 1;

  if (filters?.topicId) {
    conditions.push(`q.topic_id = $${paramIndex++}`);
    params.push(filters.topicId);
  }
  if (filters?.type) {
    conditions.push(`q.type = $${paramIndex++}`);
    params.push(filters.type);
  }
  if (filters?.difficulty) {
    conditions.push(`q.difficulty = $${paramIndex++}`);
    params.push(filters.difficulty);
  }
  if (filters?.active !== undefined) {
    conditions.push(`q.active = $${paramIndex++}`);
    params.push(filters.active);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const res = await pool.query(
    `SELECT q.id, q.text, q.type, q.topic_id, t.name as topic_name,
            q.difficulty, q.explanation, q.options, q.answer,
            q.image_id, i.file_path as image_path, q.active, q.created_at
     FROM questions q
     LEFT JOIN topics t ON q.topic_id = t.id
     LEFT JOIN images i ON q.image_id = i.id
     ${where}
     ORDER BY q.created_at DESC`,
    params
  );
  return res.rows;
}

export async function getQuestion(id: string): Promise<Question | null> {
  const res = await pool.query(
    `SELECT q.id, q.text, q.type, q.topic_id, t.name as topic_name,
            q.difficulty, q.explanation, q.options, q.answer,
            q.image_id, i.file_path as image_path, q.active, q.created_at
     FROM questions q
     LEFT JOIN topics t ON q.topic_id = t.id
     LEFT JOIN images i ON q.image_id = i.id
     WHERE q.id = $1`,
    [id]
  );
  return res.rows[0] || null;
}

export async function getQuestionCount(): Promise<number> {
  const res = await pool.query("SELECT COUNT(*) FROM questions");
  return parseInt(res.rows[0].count, 10);
}

export interface DuplicateGroup {
  normalizedText: string;
  questions: { id: string; text: string; created_at: string; topic_name: string | null }[];
}

export async function getDuplicateQuestions(): Promise<DuplicateGroup[]> {
  const res = await pool.query(
    `SELECT q.id, q.text, q.created_at, t.name as topic_name,
            LOWER(TRIM(q.text)) as normalized
     FROM questions q
     LEFT JOIN topics t ON q.topic_id = t.id
     WHERE LOWER(TRIM(q.text)) IN (
       SELECT LOWER(TRIM(text)) FROM questions GROUP BY LOWER(TRIM(text)) HAVING COUNT(*) > 1
     )
     ORDER BY LOWER(TRIM(q.text)), q.created_at ASC`
  );

  const groups = new Map<string, DuplicateGroup>();
  for (const row of res.rows) {
    const key = row.normalized as string;
    if (!groups.has(key)) {
      groups.set(key, { normalizedText: key, questions: [] });
    }
    groups.get(key)!.questions.push({
      id: row.id,
      text: row.text,
      created_at: row.created_at,
      topic_name: row.topic_name,
    });
  }

  return Array.from(groups.values());
}
