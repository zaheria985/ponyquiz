import ProgressBar from "@/components/ui/ProgressBar";
import type { TopicProgress as TopicProgressData } from "@/lib/queries/dashboard";

interface TopicProgressProps {
  topics: TopicProgressData[];
}

function getMasteryColor(percent: number): string {
  if (percent >= 80) return "var(--success-solid)";
  if (percent >= 50) return "var(--warning-solid)";
  return "var(--interactive)";
}

export default function TopicProgress({ topics }: TopicProgressProps) {
  if (topics.length === 0) {
    return (
      <div
        className="rounded-card border shadow-card p-5"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border-light)",
        }}
      >
        <h3
          className="text-base font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Topic Progress
        </h3>
        <p
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          No topics available yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-card border shadow-card p-5"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-light)",
      }}
    >
      <h3
        className="text-base font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Topic Progress
      </h3>
      <div className="space-y-4">
        {topics.map((topic) => (
          <div key={topic.topic_id}>
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {topic.topic_name}
              </span>
              <span
                className="text-xs font-medium"
                style={{
                  color: getMasteryColor(topic.mastery_percent),
                }}
              >
                {topic.mastery_percent}%
              </span>
            </div>
            <ProgressBar
              value={topic.mastery_percent}
              color={getMasteryColor(topic.mastery_percent)}
            />
            <div
              className="flex gap-3 mt-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <span>
                {topic.flashcards_studied}/{topic.total_questions} cards studied
              </span>
              <span>
                {topic.quiz_correct}/{topic.quiz_total} quiz answers correct
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
