"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";

const topicSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  sort_order: z.coerce.number().int().min(0).default(0),
});

const topicIdSchema = z.object({
  id: z.string().uuid("Invalid topic ID"),
});

export async function createTopic(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = topicSchema.safeParse({
    name: formData.get("name"),
    sort_order: formData.get("sort_order") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { name, sort_order } = parsed.data;

  try {
    await pool.query(
      "INSERT INTO topics (name, sort_order) VALUES ($1, $2)",
      [name, sort_order]
    );
  } catch (err: any) {
    if (err?.code === "23505") {
      return { error: "A topic with this name already exists." };
    }
    return { error: "Failed to create topic." };
  }

  revalidatePath("/admin/topics");
  return { success: true };
}

export async function updateTopic(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const idParsed = topicIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) {
    return { error: "Invalid topic ID." };
  }

  const parsed = topicSchema.safeParse({
    name: formData.get("name"),
    sort_order: formData.get("sort_order") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { id } = idParsed.data;
  const { name, sort_order } = parsed.data;

  try {
    const res = await pool.query(
      "UPDATE topics SET name = $1, sort_order = $2 WHERE id = $3",
      [name, sort_order, id]
    );
    if (res.rowCount === 0) {
      return { error: "Topic not found." };
    }
  } catch (err: any) {
    if (err?.code === "23505") {
      return { error: "A topic with this name already exists." };
    }
    return { error: "Failed to update topic." };
  }

  revalidatePath("/admin/topics");
  return { success: true };
}

export async function deleteTopic(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = topicIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: "Invalid topic ID." };
  }

  const { id } = parsed.data;

  // Check if any questions reference this topic
  const questionCheck = await pool.query(
    "SELECT COUNT(*) FROM questions WHERE topic_id = $1",
    [id]
  );

  if (parseInt(questionCheck.rows[0].count, 10) > 0) {
    return {
      error: "Cannot delete topic: it is referenced by existing questions.",
    };
  }

  const res = await pool.query("DELETE FROM topics WHERE id = $1", [id]);
  if (res.rowCount === 0) {
    return { error: "Topic not found." };
  }

  revalidatePath("/admin/topics");
  return { success: true };
}
