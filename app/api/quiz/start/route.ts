import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { startQuizAttempt } from "@/lib/actions/quiz";
import { getRandomQuestions } from "@/lib/queries/quiz";

const startSchema = z.object({
  topicIds: z.array(z.string().uuid()).optional(),
  difficulty: z.string().optional(),
  count: z.number().int().min(5).max(20).default(10),
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

  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { topicIds, difficulty, count } = parsed.data;

  try {
    const questions = await getRandomQuestions(topicIds, difficulty, count);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions found matching your criteria" },
        { status: 404 }
      );
    }

    const attemptResult = await startQuizAttempt({
      user_id: user.id,
      mode: "practice",
      total_questions: questions.length,
      topic_filter: topicIds,
      difficulty,
    });

    if ("error" in attemptResult) {
      return NextResponse.json(
        { error: attemptResult.error },
        { status: 500 }
      );
    }

    // Strip correct answers from questions sent to client
    const clientQuestions = questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      topic_id: q.topic_id,
      topic_name: q.topic_name,
      difficulty: q.difficulty,
      options: q.options
        ? q.options.map((opt: { text: string }) => ({ text: opt.text }))
        : null,
      image_id: q.image_id,
      image_path: q.image_path,
      image_alt: q.image_alt,
      hotspots: q.hotspots,
    }));

    return NextResponse.json({
      attemptId: attemptResult.data.attemptId,
      questions: clientQuestions,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to start quiz" },
      { status: 500 }
    );
  }
}
