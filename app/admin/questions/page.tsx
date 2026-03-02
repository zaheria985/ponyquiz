import { getQuestions, getDuplicateQuestions } from "@/lib/queries/questions";
import { getTopics } from "@/lib/queries/topics";
import PageHeader from "@/components/ui/PageHeader";
import QuestionList from "@/components/admin/QuestionList";
import DuplicateFinder from "@/components/admin/DuplicateFinder";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const [questions, topics, duplicateGroups] = await Promise.all([
    getQuestions(),
    getTopics(),
    getDuplicateQuestions(),
  ]);

  return (
    <div>
      <PageHeader title="Questions" />
      {duplicateGroups.length > 0 && (
        <DuplicateFinder groups={duplicateGroups} />
      )}
      <QuestionList initialQuestions={questions} topics={topics} />
    </div>
  );
}
