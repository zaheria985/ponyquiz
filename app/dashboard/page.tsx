import PageHeader from "@/components/ui/PageHeader";
import StreakTracker from "@/components/dashboard/StreakTracker";
import TopicProgress from "@/components/dashboard/TopicProgress";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import { requireAuth } from "@/lib/session";
import { getDashboardData } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const data = await getDashboardData(user.id);

  return (
    <div>
      <PageHeader title={`Welcome back${user.name ? `, ${user.name}` : ""}!`} />

      <div className="space-y-6">
        <QuickActions />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StreakTracker
            streakCount={data.streakCount}
            lastActiveDate={data.lastActiveDate}
          />
          <div
            className="rounded-card border shadow-card p-5 flex flex-col items-center justify-center"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border-light)",
            }}
          >
            <span
              className="text-4xl font-bold"
              style={{ color: "var(--interactive)" }}
            >
              {data.overallMastery}%
            </span>
            <span
              className="text-sm mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Overall Mastery
            </span>
            <div
              className="flex gap-4 mt-3 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <span>
                {data.badgeCount} badge{data.badgeCount !== 1 ? "s" : ""} earned
              </span>
            </div>
          </div>
        </div>

        <TopicProgress topics={data.topicProgress} />

        <RecentActivity quizzes={data.recentQuizzes} />
      </div>
    </div>
  );
}
