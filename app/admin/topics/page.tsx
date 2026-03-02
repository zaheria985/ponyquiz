import { getTopics } from "@/lib/queries/topics";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import TopicManager from "@/components/admin/TopicManager";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const topics = await getTopics();

  return (
    <div>
      <PageHeader title="Topics" />
      <Card>
        <TopicManager initialTopics={topics} />
      </Card>
    </div>
  );
}
