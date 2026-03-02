"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";

const questionTypes = [
  "multiple_choice",
  "true_false",
  "flashcard_qa",
  "flashcard_term",
  "flashcard_image",
  "labeled_diagram",
  "photo_id",
  "image_text",
] as const;

const difficulties = ["beginner", "intermediate", "advanced"] as const;

const baseQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: z.enum(questionTypes),
  topic_id: z.string().uuid().optional().or(z.literal("")),
  difficulty: z.enum(difficulties),
  explanation: z.string().optional().or(z.literal("")),
  image_id: z.string().uuid().optional().or(z.literal("")),
});

const questionIdSchema = z.object({
  id: z.string().uuid("Invalid question ID"),
});

function parseOptions(
  formData: FormData,
  type: string
): { error: string } | { options: string | null; answer: string | null } {
  if (type === "multiple_choice") {
    const options: { text: string; isCorrect: boolean }[] = [];
    for (let i = 0; i < 4; i++) {
      const text = formData.get(`option_${i}`) as string;
      if (text && text.trim()) {
        options.push({
          text: text.trim(),
          isCorrect: formData.get("correct_option") === String(i),
        });
      }
    }
    if (options.length < 2) {
      return { error: "Multiple choice questions require at least 2 options." };
    }
    if (!options.some((o) => o.isCorrect)) {
      return { error: "Please select a correct answer." };
    }
    return { options: JSON.stringify(options), answer: null };
  }

  if (type === "true_false") {
    const answer = formData.get("answer") as string;
    if (answer !== "true" && answer !== "false") {
      return { error: "True/false answer is required." };
    }
    return { options: null, answer };
  }

  // flashcard_qa, flashcard_term, flashcard_image, labeled_diagram, photo_id, image_text
  const answer = (formData.get("answer") as string) || "";
  return { options: null, answer: answer || null };
}

export async function createQuestion(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = baseQuestionSchema.safeParse({
    text: formData.get("text"),
    type: formData.get("type"),
    topic_id: formData.get("topic_id"),
    difficulty: formData.get("difficulty"),
    explanation: formData.get("explanation"),
    image_id: formData.get("image_id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { text, type, topic_id, difficulty, explanation, image_id } = parsed.data;

  const optionsResult = parseOptions(formData, type);
  if ("error" in optionsResult) {
    return { error: optionsResult.error };
  }

  const { options, answer } = optionsResult;

  try {
    await pool.query(
      `INSERT INTO questions (text, type, topic_id, difficulty, explanation, options, answer, image_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        text,
        type,
        topic_id || null,
        difficulty,
        explanation || null,
        options,
        answer,
        image_id || null,
      ]
    );
  } catch {
    return { error: "Failed to create question." };
  }

  revalidatePath("/admin/questions");
  return { success: true };
}

export async function updateQuestion(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const idParsed = questionIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) {
    return { error: "Invalid question ID." };
  }

  const parsed = baseQuestionSchema.safeParse({
    text: formData.get("text"),
    type: formData.get("type"),
    topic_id: formData.get("topic_id"),
    difficulty: formData.get("difficulty"),
    explanation: formData.get("explanation"),
    image_id: formData.get("image_id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { id } = idParsed.data;
  const { text, type, topic_id, difficulty, explanation, image_id } = parsed.data;

  const optionsResult = parseOptions(formData, type);
  if ("error" in optionsResult) {
    return { error: optionsResult.error };
  }

  const { options, answer } = optionsResult;

  try {
    const res = await pool.query(
      `UPDATE questions
       SET text = $1, type = $2, topic_id = $3, difficulty = $4,
           explanation = $5, options = $6, answer = $7, image_id = $8
       WHERE id = $9`,
      [
        text,
        type,
        topic_id || null,
        difficulty,
        explanation || null,
        options,
        answer,
        image_id || null,
        id,
      ]
    );
    if (res.rowCount === 0) {
      return { error: "Question not found." };
    }
  } catch {
    return { error: "Failed to update question." };
  }

  revalidatePath("/admin/questions");
  return { success: true };
}

export async function deleteQuestion(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = questionIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: "Invalid question ID." };
  }

  const { id } = parsed.data;

  try {
    const res = await pool.query("DELETE FROM questions WHERE id = $1", [id]);
    if (res.rowCount === 0) {
      return { error: "Question not found." };
    }
  } catch {
    return { error: "Failed to delete question. It may be referenced by quiz answers." };
  }

  revalidatePath("/admin/questions");
  return { success: true };
}

export async function toggleQuestionActive(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = questionIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: "Invalid question ID." };
  }

  const { id } = parsed.data;

  try {
    const res = await pool.query(
      "UPDATE questions SET active = NOT active WHERE id = $1",
      [id]
    );
    if (res.rowCount === 0) {
      return { error: "Question not found." };
    }
  } catch {
    return { error: "Failed to toggle question status." };
  }

  revalidatePath("/admin/questions");
  return { success: true };
}
