"use client";

import { useState, useTransition } from "react";
import { equipUnlockable } from "@/lib/actions/badges";
import type { UserUnlockable } from "@/lib/queries/unlockables";

interface UnlockableGridProps {
  unlockables: UserUnlockable[];
  userId: string;
}

function getCriteriaLabel(criteria: { type: string; threshold: number }): string {
  if (!criteria.type || criteria.threshold === 0) return "Free";
  switch (criteria.type) {
    case "quiz_count":
      return `Complete ${criteria.threshold} quiz${criteria.threshold !== 1 ? "zes" : ""}`;
    case "quiz_score":
      return "Get a perfect score";
    case "streak":
      return `Reach a ${criteria.threshold}-day streak`;
    case "flashcard_count":
      return `Review ${criteria.threshold} flashcards`;
    default:
      return "Complete a challenge";
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "avatar":
      return "Avatars";
    case "theme":
      return "Themes";
    case "title":
      return "Titles";
    default:
      return type;
  }
}

export default function UnlockableGrid({
  unlockables,
  userId,
}: UnlockableGridProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const groupedByType = unlockables.reduce<Record<string, UserUnlockable[]>>(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    },
    {}
  );

  function handleEquip(unlockableId: string) {
    setError(null);
    const formData = new FormData();
    formData.set("unlockable_id", unlockableId);
    formData.set("user_id", userId);

    startTransition(async () => {
      const result = await equipUnlockable(formData);
      if ("error" in result) {
        setError(result.error);
      }
    });
  }

  if (unlockables.length === 0) {
    return (
      <p
        className="text-sm text-center py-8"
        style={{ color: "var(--text-muted)" }}
      >
        No unlockables available yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="px-4 py-3 rounded-lg text-sm border"
          style={{
            backgroundColor: "var(--error-bg)",
            color: "var(--error-text)",
            borderColor: "var(--error-border)",
          }}
        >
          {error}
        </div>
      )}

      {Object.entries(groupedByType).map(([type, items]) => (
        <div key={type}>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            {getTypeLabel(type)}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => item.earned && handleEquip(item.id)}
                disabled={!item.earned || isPending}
                className="flex flex-col items-center p-4 rounded-lg border text-center transition-colors disabled:cursor-default"
                style={{
                  backgroundColor: item.equipped
                    ? "var(--interactive-light)"
                    : item.earned
                      ? "var(--surface)"
                      : "var(--surface-muted)",
                  borderColor: item.equipped
                    ? "var(--interactive-border)"
                    : item.earned
                      ? "var(--border-light)"
                      : "var(--border-light)",
                  opacity: item.earned ? 1 : 0.5,
                }}
              >
                <div className="text-2xl mb-2">
                  {type === "avatar"
                    ? "\ud83e\udd20"
                    : type === "theme"
                      ? "\ud83c\udfa8"
                      : "\ud83c\udfc6"}
                </div>
                <span
                  className="text-sm font-medium mb-1"
                  style={{
                    color: item.earned
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  }}
                >
                  {item.name}
                </span>
                {item.equipped && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--interactive)" }}
                  >
                    Equipped
                  </span>
                )}
                {!item.earned && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {getCriteriaLabel(item.criteria)}
                  </span>
                )}
                {item.earned && !item.equipped && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Tap to equip
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
