import PageHeader from "@/components/ui/PageHeader";
import FlashcardViewer from "@/components/flashcards/FlashcardViewer";
import {
  getFlashcardTopicCounts,
  getTotalFlashcardCount,
} from "@/lib/queries/flashcards";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage() {
  const [topicCounts, totalCount] = await Promise.all([
    getFlashcardTopicCounts(),
    getTotalFlashcardCount(),
  ]);

  const topics = [
    { id: null, name: "All", count: totalCount },
    ...topicCounts.map((t) => ({
      id: t.topic_id,
      name: t.topic_name,
      count: t.count,
    })),
  ];

  return (
    <div>
      <PageHeader title="Flashcards" />
      <FlashcardViewer topics={topics} />
    </div>
  );
}
