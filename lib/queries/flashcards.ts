import pool from "@/lib/db";

export interface FlashcardWithProgress {
  id: string;
  text: string;
  type: "flashcard_qa" | "flashcard_term" | "flashcard_image" | "labeled_diagram";
  topic_id: string | null;
  topic_name: string | null;
  difficulty: string;
  explanation: string | null;
  answer: string | null;
  image_id: string | null;
  image_path: string | null;
  image_alt: string | null;
  hotspots: { x: number; y: number; label: string }[] | null;
  options: { text: string; isCorrect: boolean }[] | null;
  status: "got_it" | "still_learning" | null;
  last_reviewed: string | null;
  review_count: number;
}

export async function getFlashcards(
  userId: string,
  topicId?: string
): Promise<FlashcardWithProgress[]> {
  const conditions = [
    "q.type IN ('flashcard_qa', 'flashcard_term', 'flashcard_image', 'labeled_diagram')",
    "q.active = true",
  ];
  const params: string[] = [userId];
  let paramIndex = 2;

  if (topicId) {
    conditions.push(`q.topic_id = $${paramIndex++}`);
    params.push(topicId);
  }

  const where = conditions.join(" AND ");

  const res = await pool.query(
    `SELECT
       q.id,
       q.text,
       q.type,
       q.topic_id,
       t.name AS topic_name,
       q.difficulty,
       q.explanation,
       q.answer,
       q.image_id,
       i.file_path AS image_path,
       i.alt_text AS image_alt,
       i.hotspots,
       q.options,
       fp.status,
       fp.last_reviewed,
       COALESCE(fp.review_count, 0) AS review_count
     FROM questions q
     LEFT JOIN topics t ON q.topic_id = t.id
     LEFT JOIN images i ON q.image_id = i.id
     LEFT JOIN flashcard_progress fp ON fp.question_id = q.id AND fp.user_id = $1
     WHERE ${where}
     ORDER BY
       CASE
         WHEN fp.status IS NULL THEN 1
         WHEN fp.status = 'still_learning' THEN 0
         ELSE 2
       END,
       RANDOM()`,
    params
  );

  return res.rows;
}

export interface FlashcardTopicCount {
  topic_id: string;
  topic_name: string;
  count: number;
}

export async function getFlashcardTopicCounts(): Promise<FlashcardTopicCount[]> {
  const res = await pool.query(
    `SELECT
       t.id AS topic_id,
       t.name AS topic_name,
       COUNT(q.id)::int AS count
     FROM topics t
     INNER JOIN questions q ON q.topic_id = t.id
     WHERE q.type IN ('flashcard_qa', 'flashcard_term', 'flashcard_image', 'labeled_diagram')
       AND q.active = true
     GROUP BY t.id, t.name
     ORDER BY t.sort_order, t.name`
  );
  return res.rows;
}

export async function getTotalFlashcardCount(): Promise<number> {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM questions
     WHERE type IN ('flashcard_qa', 'flashcard_term', 'flashcard_image', 'labeled_diagram')
       AND active = true`
  );
  return res.rows[0].count;
}
