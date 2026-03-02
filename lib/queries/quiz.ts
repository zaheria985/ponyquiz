import pool from "@/lib/db";

const QUIZ_TYPES = [
  "multiple_choice",
  "true_false",
  "labeled_diagram",
  "photo_id",
  "image_text",
];

export interface QuizQuestion {
  id: string;
  text: string;
  type: string;
  topic_id: string | null;
  topic_name: string | null;
  difficulty: string;
  explanation: string | null;
  options: { text: string; isCorrect: boolean }[] | null;
  answer: string | null;
  image_id: string | null;
  image_path: string | null;
  image_alt: string | null;
  hotspots: unknown[] | null;
}

export async function getRandomQuestions(
  topicIds?: string[],
  difficulty?: string,
  count: number = 10
): Promise<QuizQuestion[]> {
  const conditions: string[] = [
    "q.type = ANY($1)",
    "q.active = true",
  ];
  const params: (string | string[] | number)[] = [QUIZ_TYPES];
  let paramIndex = 2;

  if (topicIds && topicIds.length > 0) {
    conditions.push(`q.topic_id = ANY($${paramIndex})`);
    params.push(topicIds);
    paramIndex++;
  }

  if (difficulty && difficulty !== "all") {
    conditions.push(`q.difficulty = $${paramIndex}`);
    params.push(difficulty);
    paramIndex++;
  }

  const limitParamNum = paramIndex;
  params.push(count);

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
       q.options,
       q.answer,
       q.image_id,
       i.file_path AS image_path,
       i.alt_text AS image_alt,
       i.hotspots
     FROM questions q
     LEFT JOIN topics t ON q.topic_id = t.id
     LEFT JOIN images i ON q.image_id = i.id
     WHERE ${where}
     ORDER BY RANDOM()
     LIMIT $${limitParamNum}`,
    params
  );

  return res.rows;
}

export interface QuizTopicCount {
  topic_id: string;
  topic_name: string;
  count: number;
}

export async function getQuizTopicCounts(): Promise<QuizTopicCount[]> {
  const res = await pool.query(
    `SELECT
       t.id AS topic_id,
       t.name AS topic_name,
       COUNT(q.id)::int AS count
     FROM topics t
     INNER JOIN questions q ON q.topic_id = t.id
     WHERE q.type = ANY($1)
       AND q.active = true
     GROUP BY t.id, t.name
     ORDER BY t.sort_order, t.name`,
    [QUIZ_TYPES]
  );
  return res.rows;
}

export async function getTotalQuizQuestionCount(): Promise<number> {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM questions
     WHERE type = ANY($1)
       AND active = true`,
    [QUIZ_TYPES]
  );
  return res.rows[0].count;
}
