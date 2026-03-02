"use client";

import { useState, useTransition } from "react";
import { equipUnlockable } from "@/lib/actions/badges";
import type { UserUnlockable } from "@/lib/queries/unlockables";

interface AvatarSelectorProps {
  avatars: UserUnlockable[];
  userId: string;
}

function getCriteriaLabel(criteria: { type: string; threshold: number }): string {
  if (!criteria.type || criteria.threshold === 0) return "Free";
  switch (criteria.type) {
    case "quiz_count":
      return `Complete ${criteria.threshold} quizzes`;
    case "streak":
      return `${criteria.threshold}-day streak`;
    default:
      return "Complete a challenge";
  }
}

export default function AvatarSelector({
  avatars,
  userId,
}: AvatarSelectorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  if (avatars.length === 0) {
    return (
      <p
        className="text-sm text-center py-4"
        style={{ color: "var(--text-muted)" }}
      >
        No avatars available.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <div
          className="mb-3 px-4 py-3 rounded-lg text-sm border"
          style={{
            backgroundColor: "var(--error-bg)",
            color: "var(--error-text)",
            borderColor: "var(--error-border)",
          }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {avatars.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => avatar.earned && handleEquip(avatar.id)}
            disabled={!avatar.earned || isPending}
            className="relative flex flex-col items-center p-3 rounded-lg border transition-colors disabled:cursor-default"
            style={{
              backgroundColor: avatar.equipped
                ? "var(--interactive-light)"
                : avatar.earned
                  ? "var(--surface)"
                  : "var(--surface-muted)",
              borderColor: avatar.equipped
                ? "var(--interactive)"
                : "var(--border-light)",
              opacity: avatar.earned ? 1 : 0.5,
            }}
            title={
              avatar.earned
                ? avatar.equipped
                  ? "Currently equipped"
                  : "Click to equip"
                : getCriteriaLabel(avatar.criteria)
            }
          >
            {avatar.equipped && (
              <div
                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: "var(--interactive)",
                  color: "var(--brand-contrast)",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
            {!avatar.earned && (
              <div
                className="absolute top-1 right-1 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {"\ud83d\udd12"}
              </div>
            )}
            <div className="text-3xl mb-1">
              {"\ud83e\udd20"}
            </div>
            <span
              className="text-xs font-medium truncate w-full"
              style={{
                color: avatar.earned
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
              }}
            >
              {avatar.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
