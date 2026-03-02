import { getTopics } from "@/lib/queries/topics";
import PageHeader from "@/components/ui/PageHeader";
import ImportWizard from "@/components/admin/ImportWizard";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const topics = await getTopics();

  return (
    <div>
      <PageHeader title="Import Questions" />
      <ImportWizard topics={topics} />
    </div>
  );
}
