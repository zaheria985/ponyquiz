import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { startQuizAttempt } from "@/lib/actions/quiz";
import { getRandomQuestions } from "@/lib/queries/quiz";

const startSchema = z.object({
  topicIds: z.array(z.string().uuid()).optional(),
  difficulty: z.string().optional(),
  count: z.number().int().min(5).max(20).default(10),
  mode: z.enum(["practice", "graded"]).default("practice"),
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

  const { topicIds, difficulty, count, mode } = parsed.data;

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
      mode,
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

    // Collect all answers from flashcard-type questions to use as distractors
    const allFlashcardAnswers = questions
      .filter((q) => (q.type === "flashcard_qa" || q.type === "flashcard_term") && q.answer)
      .map((q) => q.answer as string);

    // Strip correct answers from questions sent to client
    const clientQuestions = questions.map((q) => {
      // For labeled_diagram: only send the active hotspot coordinates (no label),
      // and use a generic question text so the answer isn't revealed.
      let activeHotspot: { x: number; y: number } | null = null;
      let text = q.text;
      let options = q.options
        ? q.options.map((opt: { text: string }) => ({ text: opt.text }))
        : null;

      if (q.type === "labeled_diagram" && q.answer && Array.isArray(q.hotspots)) {
        const match = (q.hotspots as { x: number; y: number; label: string }[])
          .find((h) => h.label === q.answer);
        if (match) {
          activeHotspot = { x: match.x, y: match.y };
        }
        text = "What is this part?";
      }

      // Auto-generate multiple choice for flashcard Q/A and term questions
      if ((q.type === "flashcard_qa" || q.type === "flashcard_term") && q.answer && !options) {
        const correctAnswer = q.answer;
        // Pick up to 3 random wrong answers from other questions
        const distractors = allFlashcardAnswers
          .filter((a) => a.toLowerCase().trim() !== correctAnswer.toLowerCase().trim())
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        if (distractors.length >= 2) {
          // Enough distractors — present as multiple choice
          const allOptions = [
            { text: correctAnswer },
            ...distractors.map((d) => ({ text: d })),
          ].sort(() => Math.random() - 0.5);
          options = allOptions;
        }
        // If not enough distractors, falls through to short-answer
      }

      return {
        id: q.id,
        text,
        type: q.type,
        topic_id: q.topic_id,
        topic_name: q.topic_name,
        difficulty: q.difficulty,
        options,
        image_id: q.image_id,
        image_path: q.image_path,
        image_alt: q.image_alt,
        activeHotspot,
      };
    });

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
