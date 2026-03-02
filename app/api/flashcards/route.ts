import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getFlashcards } from "@/lib/queries/flashcards";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topic") || undefined;

  try {
    const flashcards = await getFlashcards(user.id, topicId);
    return NextResponse.json({ flashcards });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}
