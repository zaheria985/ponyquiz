import { getBadges } from "@/lib/queries/badges";
import { getUnlockables } from "@/lib/queries/unlockables";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import BadgeManager from "@/components/admin/BadgeManager";
import UnlockableManager from "@/components/admin/UnlockableManager";

export const dynamic = "force-dynamic";

export default async function AdminBadgesPage() {
  const [badges, unlockables] = await Promise.all([
    getBadges(),
    getUnlockables(),
  ]);

  return (
    <div>
      <PageHeader title="Badges & Unlockables" />

      <div className="space-y-6">
        <Card title="Badges">
          <BadgeManager initialBadges={badges} />
        </Card>

        <Card title="Unlockables">
          <UnlockableManager initialUnlockables={unlockables} />
        </Card>
      </div>
    </div>
  );
}
