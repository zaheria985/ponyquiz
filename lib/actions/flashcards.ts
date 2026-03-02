"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";

const progressSchema = z.object({
  question_id: z.string().uuid("Invalid question ID"),
  user_id: z.string().uuid("Invalid user ID"),
  status: z.enum(["got_it", "still_learning"], "Status must be got_it or still_learning"),
});

export async function updateFlashcardProgress(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = progressSchema.safeParse({
    question_id: formData.get("question_id"),
    user_id: formData.get("user_id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { question_id, user_id, status } = parsed.data;

  try {
    await pool.query(
      `INSERT INTO flashcard_progress (user_id, question_id, status, last_reviewed, review_count)
       VALUES ($1, $2, $3, NOW(), 1)
       ON CONFLICT (user_id, question_id)
       DO UPDATE SET
         status = $3,
         last_reviewed = NOW(),
         review_count = flashcard_progress.review_count + 1`,
      [user_id, question_id, status]
    );
  } catch {
    return { error: "Failed to update flashcard progress." };
  }

  revalidatePath("/flashcards");
  return { success: true };
}
