import PageHeader from "@/components/ui/PageHeader";
import GradedQuiz from "@/components/quiz/GradedQuiz";
import {
  getQuizTopicCounts,
  getTotalQuizQuestionCount,
} from "@/lib/queries/quiz";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
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
      <PageHeader title="Graded Quiz" />
      <GradedQuiz topics={topics} totalCount={totalCount} />
    </div>
  );
}
