"use client";

import type { BadgeWithStatus } from "@/lib/queries/badges";

interface BadgeGridProps {
  badges: BadgeWithStatus[];
}

function getCriteriaLabel(criteria: { type: string; threshold: number }): string {
  switch (criteria.type) {
    case "quiz_count":
      return `Complete ${criteria.threshold} quiz${criteria.threshold !== 1 ? "zes" : ""}`;
    case "quiz_score":
      return "Get a perfect score on a graded quiz";
    case "streak":
      return `Reach a ${criteria.threshold}-day streak`;
    case "flashcard_count":
      return `Review ${criteria.threshold} flashcards`;
    default:
      return "Complete a challenge";
  }
}

export default function BadgeGrid({ badges }: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <p
        className="text-sm text-center py-8"
        style={{ color: "var(--text-muted)" }}
      >
        No badges available yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex flex-col items-center p-4 rounded-lg border text-center transition-colors"
          style={{
            backgroundColor: badge.earned
              ? "var(--surface)"
              : "var(--surface-muted)",
            borderColor: badge.earned
              ? "var(--interactive-border)"
              : "var(--border-light)",
            opacity: badge.earned ? 1 : 0.6,
          }}
        >
          <div
            className="text-3xl mb-2"
            style={{
              filter: badge.earned ? "none" : "grayscale(1)",
            }}
          >
            {badge.icon || (badge.earned ? "\u2b50" : "\ud83d\udd12")}
          </div>
          <h4
            className="text-sm font-semibold mb-1"
            style={{
              color: badge.earned
                ? "var(--text-primary)"
                : "var(--text-muted)",
            }}
          >
            {badge.name}
          </h4>
          {badge.earned ? (
            <p
              className="text-xs"
              style={{ color: "var(--success-text)" }}
            >
              Earned {new Date(badge.earned_at!).toLocaleDateString()}
            </p>
          ) : (
            <p
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {getCriteriaLabel(badge.criteria)}
            </p>
          )}
          {badge.description && badge.earned && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {badge.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
