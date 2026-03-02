import PageHeader from "@/components/ui/PageHeader";
import QuizSetup from "@/components/quiz/QuizSetup";
import {
  getQuizTopicCounts,
  getTotalQuizQuestionCount,
} from "@/lib/queries/quiz";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const [topicCounts, totalCount] = await Promise.all([
    getQuizTopicCounts(),
    getTotalQuizQuestionCount(),
  ]);

  const topics = topicCounts.map((t) => ({
    id: t.topic_id,
    name: t.topic_name,
    count: t.count,
  }));

  return (
    <div>
      <PageHeader title="Practice Quiz" />
      <QuizSetup topics={topics} totalCount={totalCount} />
    </div>
  );
}
