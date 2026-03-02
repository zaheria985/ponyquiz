import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";
import pool from "@/lib/db";

const progressSchema = z.object({
  question_id: z.string().uuid(),
  status: z.enum(["got_it", "still_learning"]),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { question_id, status } = parsed.data;

  try {
    await pool.query(
      `INSERT INTO flashcard_progress (user_id, question_id, status, last_reviewed, review_count)
       VALUES ($1, $2, $3, NOW(), 1)
       ON CONFLICT (user_id, question_id)
       DO UPDATE SET
         status = $3,
         last_reviewed = NOW(),
         review_count = flashcard_progress.review_count + 1`,
      [user.id, question_id, status]
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
