import { getQuestions } from "@/lib/queries/questions";
import { getTopics } from "@/lib/queries/topics";
import PageHeader from "@/components/ui/PageHeader";
import QuestionList from "@/components/admin/QuestionList";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const [questions, topics] = await Promise.all([getQuestions(), getTopics()]);

  return (
    <div>
      <PageHeader title="Questions" />
      <QuestionList initialQuestions={questions} topics={topics} />
    </div>
  );
}
