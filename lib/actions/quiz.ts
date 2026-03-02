"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";

const startQuizSchema = z.object({
  user_id: z.string().uuid(),
  mode: z.enum(["practice", "graded"]),
  total_questions: z.number().int().min(1).max(50),
  topic_filter: z.array(z.string().uuid()).optional(),
  difficulty: z.string().optional(),
});

export async function startQuizAttempt(
  data: z.infer<typeof startQuizSchema>
): Promise<{ success: true; data: { attemptId: string } } | { error: string }> {
  const parsed = startQuizSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { user_id, mode, total_questions, topic_filter, difficulty } = parsed.data;

  try {
    const res = await pool.query(
      `INSERT INTO quiz_attempts (user_id, mode, total_questions, topic_filter, difficulty)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        user_id,
        mode,
        total_questions,
        topic_filter ? JSON.stringify(topic_filter) : null,
        difficulty || null,
      ]
    );

    return { success: true, data: { attemptId: res.rows[0].id } };
  } catch {
    return { error: "Failed to start quiz attempt." };
  }
}

const submitAnswerSchema = z.object({
  quiz_attempt_id: z.string().uuid(),
  question_id: z.string().uuid(),
  selected_answer: z.string(),
});

export async function submitAnswer(
  data: z.infer<typeof submitAnswerSchema>
): Promise<
  | { success: true; data: { correct: boolean; explanation: string | null; correctAnswer: string } }
  | { error: string }
> {
  const parsed = submitAnswerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { quiz_attempt_id, question_id, selected_answer } = parsed.data;

  try {
    const questionRes = await pool.query(
      `SELECT type, options, answer, explanation FROM questions WHERE id = $1`,
      [question_id]
    );

    if (questionRes.rows.length === 0) {
      return { error: "Question not found." };
    }

    const question = questionRes.rows[0];
    let correct = false;
    let correctAnswer = "";

    if (question.options && Array.isArray(question.options)) {
      const correctOption = question.options.find(
        (opt: { text: string; isCorrect: boolean }) => opt.isCorrect
      );
      correctAnswer = correctOption?.text || "";
      correct = selected_answer === correctAnswer;
    } else if (question.answer) {
      correctAnswer = question.answer;
      correct =
        selected_answer.toLowerCase().trim() ===
        question.answer.toLowerCase().trim();
    }

    await pool.query(
      `INSERT INTO quiz_answers (quiz_attempt_id, question_id, selected_answer, correct)
       VALUES ($1, $2, $3, $4)`,
      [quiz_attempt_id, question_id, selected_answer, correct]
    );

    return {
      success: true,
      data: {
        correct,
        explanation: question.explanation,
        correctAnswer,
      },
    };
  } catch {
    return { error: "Failed to submit answer." };
  }
}

const completeQuizSchema = z.object({
  quiz_attempt_id: z.string().uuid(),
});

export async function completeQuizAttempt(
  data: z.infer<typeof completeQuizSchema>
): Promise<{ success: true; data: { score: number; total: number } } | { error: string }> {
  const parsed = completeQuizSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { quiz_attempt_id } = parsed.data;

  try {
    const answersRes = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COALESCE(SUM(CASE WHEN correct THEN 1 ELSE 0 END), 0)::int AS score
       FROM quiz_answers
       WHERE quiz_attempt_id = $1`,
      [quiz_attempt_id]
    );

    const { score, total } = answersRes.rows[0];

    await pool.query(
      `UPDATE quiz_attempts
       SET score = $1, completed_at = NOW()
       WHERE id = $2`,
      [score, quiz_attempt_id]
    );

    revalidatePath("/practice");
    return { success: true, data: { score, total } };
  } catch {
    return { error: "Failed to complete quiz." };
  }
}
