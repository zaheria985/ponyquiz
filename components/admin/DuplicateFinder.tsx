"use client";

import { useState, useTransition } from "react";
import { deleteDuplicateQuestions } from "@/lib/actions/questions";
import type { DuplicateGroup } from "@/lib/queries/questions";

interface DuplicateFinderProps {
  groups: DuplicateGroup[];
}

export default function DuplicateFinder({ groups }: DuplicateFinderProps) {
  // For each group, the oldest (first) question is kept by default; rest are selected for deletion
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    for (const group of groups) {
      // Skip the first (oldest) question, select the rest
      for (let i = 1; i < group.questions.length; i++) {
        ids.add(group.questions[i].id);
      }
    }
    return ids;
  });
  const [isDeleting, startTransition] = useTransition();
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || groups.length === 0) return null;

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const totalDuplicates = groups.reduce((sum, g) => sum + g.questions.length - 1, 0);

  function handleDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} duplicate question${selectedIds.size !== 1 ? "s" : ""}? This cannot be undone.`)) {
      return;
    }

    setResult(null);
    const formData = new FormData();
    formData.set("ids", JSON.stringify(Array.from(selectedIds)));

    startTransition(async () => {
      const res = await deleteDuplicateQuestions(formData);
      if ("error" in res) {
        setResult({ type: "error", message: res.error });
      } else {
        setResult({ type: "success", message: `Deleted ${res.data.count} duplicate question${res.data.count !== 1 ? "s" : ""}.` });
        setSelectedIds(new Set());
      }
    });
  }

  return (
    <div
      className="mb-6 rounded-lg border p-4"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--warning-border, var(--border-light))",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3
            className="text-sm font-semibold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Duplicate Questions Found
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {groups.length} group{groups.length !== 1 ? "s" : ""}, {totalDuplicates} duplicate{totalDuplicates !== 1 ? "s" : ""} to remove
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs px-2 py-1 rounded"
          style={{ color: "var(--text-muted)" }}
        >
          Dismiss
        </button>
      </div>

      {/* Result message */}
      {result && (
        <div
          className="mb-3 px-3 py-2 rounded text-sm border"
          style={{
            backgroundColor: result.type === "success" ? "var(--success-bg)" : "var(--error-bg)",
            color: result.type === "success" ? "var(--success-text)" : "var(--error-text)",
            borderColor: result.type === "success" ? "var(--success-border)" : "var(--error-border)",
          }}
        >
          {result.message}
        </div>
      )}

      {/* Duplicate groups */}
      {!result?.type && (
        <>
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {groups.map((group) => (
              <div
                key={group.normalizedText}
                className="rounded border p-3"
                style={{
                  backgroundColor: "var(--surface-muted)",
                  borderColor: "var(--border-light)",
                }}
              >
                <p
                  className="text-sm font-medium mb-2 line-clamp-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {group.questions[0].text}
                </p>
                <div className="space-y-1">
                  {group.questions.map((q, i) => (
                    <label
                      key={q.id}
                      className="flex items-center gap-2 text-xs cursor-pointer"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(q.id)}
                        onChange={() => toggleId(q.id)}
                        disabled={isDeleting}
                      />
                      <span>
                        {new Date(q.created_at).toLocaleDateString()}
                        {q.topic_name && ` \u00B7 ${q.topic_name}`}
                        {i === 0 && (
                          <span
                            className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              backgroundColor: "var(--success-bg)",
                              color: "var(--success-text)",
                            }}
                          >
                            Keep
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <button
            onClick={handleDelete}
            disabled={isDeleting || selectedIds.size === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "var(--error-text, #dc2626)",
              color: "#fff",
            }}
          >
            {isDeleting
              ? "Deleting..."
              : `Delete Selected (${selectedIds.size})`}
          </button>
        </>
      )}
    </div>
  );
}
