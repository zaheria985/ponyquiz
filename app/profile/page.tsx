import { requireAuth } from "@/lib/session";
import { getBadgesWithStatus } from "@/lib/queries/badges";
import { getUserUnlockables } from "@/lib/queries/unlockables";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import BadgeGrid from "@/components/profile/BadgeGrid";
import UnlockableGrid from "@/components/profile/UnlockableGrid";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const sessionUser = await requireAuth();
  const userId = sessionUser.id;

  const [badges, unlockables, userRes] = await Promise.all([
    getBadgesWithStatus(userId),
    getUserUnlockables(userId),
    pool.query(
      `SELECT name, avatar, title, streak_count FROM users WHERE id = $1`,
      [userId]
    ),
  ]);

  const user = userRes.rows[0];

  return (
    <div>
      <PageHeader title="My Profile" />

      <div className="space-y-6">
        {/* User Info */}
        <Card>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2"
              style={{
                backgroundColor: "var(--surface-muted)",
                borderColor: "var(--interactive-border)",
              }}
            >
              {user?.avatar ? user.avatar.slice(0, 2) : "\ud83e\udd20"}
            </div>
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.name || "Student"}
              </h2>
              {user?.title && (
                <p
                  className="text-sm"
                  style={{ color: "var(--interactive)" }}
                >
                  {user.title}
                </p>
              )}
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {user?.streak_count > 0
                  ? `${user.streak_count}-day streak`
                  : "No streak yet"}{" "}
                &middot;{" "}
                {badges.filter((b) => b.earned).length} badge
                {badges.filter((b) => b.earned).length !== 1 ? "s" : ""} earned
              </p>
            </div>
          </div>
        </Card>

        {/* Badges */}
        <Card title="Badges">
          <BadgeGrid badges={badges} />
        </Card>

        {/* Unlockables */}
        <Card title="Unlockables">
          <UnlockableGrid unlockables={unlockables} userId={userId} />
        </Card>
      </div>
    </div>
  );
}
