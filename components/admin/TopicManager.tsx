"use client";

import { useState, useTransition } from "react";
import { createTopic, updateTopic, deleteTopic } from "@/lib/actions/topics";
import type { Topic } from "@/lib/queries/topics";

interface TopicManagerProps {
  initialTopics: Topic[];
}

export default function TopicManager({ initialTopics }: TopicManagerProps) {
  const [topics] = useState(initialTopics);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [newName, setNewName] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(topic: Topic) {
    setEditingId(topic.id);
    setEditName(topic.name);
    setEditSortOrder(topic.sort_order);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditSortOrder(0);
    setError(null);
  }

  function handleCreate() {
    if (!newName.trim()) return;
    setError(null);
    const formData = new FormData();
    formData.set("name", newName.trim());
    formData.set("sort_order", String(newSortOrder));

    startTransition(async () => {
      const result = await createTopic(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setNewName("");
        setNewSortOrder(0);
      }
    });
  }

  function handleUpdate(id: string) {
    if (!editName.trim()) return;
    setError(null);
    const formData = new FormData();
    formData.set("id", id);
    formData.set("name", editName.trim());
    formData.set("sort_order", String(editSortOrder));

    startTransition(async () => {
      const result = await updateTopic(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete topic "${name}"? This cannot be undone.`)) return;
    setError(null);
    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      const result = await deleteTopic(formData);
      if ("error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      {/* Error message */}
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm border"
          style={{
            backgroundColor: "var(--error-bg)",
            color: "var(--error-text)",
            borderColor: "var(--error-border)",
          }}
        >
          {error}
        </div>
      )}

      {/* Add new topic form */}
      <div
        className="mb-6 p-4 rounded-lg border"
        style={{
          backgroundColor: "var(--surface-subtle)",
          borderColor: "var(--border-light)",
        }}
      >
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          Add New Topic
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Topic name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--input-text)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--input-focus-ring)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--input-border)";
            }}
          />
          <input
            type="number"
            placeholder="Sort order"
            value={newSortOrder}
            onChange={(e) => setNewSortOrder(parseInt(e.target.value) || 0)}
            className="w-24 px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--input-text)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--input-focus-ring)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--input-border)";
            }}
          />
          <button
            onClick={handleCreate}
            disabled={isPending || !newName.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "var(--interactive)",
              color: "var(--brand-contrast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--interactive-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--interactive)";
            }}
          >
            {isPending ? "Adding..." : "Add Topic"}
          </button>
        </div>
      </div>

      {/* Topics list */}
      {topics.length === 0 ? (
        <p
          className="text-sm text-center py-8"
          style={{ color: "var(--text-muted)" }}
        >
          No topics yet. Add one above to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-light)",
              }}
            >
              {editingId === topic.id ? (
                /* Edit mode */
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(topic.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      borderColor: "var(--input-focus-ring)",
                      color: "var(--input-text)",
                    }}
                    autoFocus
                  />
                  <input
                    type="number"
                    value={editSortOrder}
                    onChange={(e) =>
                      setEditSortOrder(parseInt(e.target.value) || 0)
                    }
                    className="w-20 px-3 py-1.5 rounded-lg border text-sm outline-none"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      borderColor: "var(--input-focus-ring)",
                      color: "var(--input-text)",
                    }}
                  />
                  <button
                    onClick={() => handleUpdate(topic.id)}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--success-bg)",
                      color: "var(--success-text)",
                      borderColor: "var(--success-border)",
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--surface-muted)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                /* Display mode */
                <>
                  <span
                    className="flex-1 text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {topic.name}
                  </span>
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: "var(--text-muted)" }}
                  >
                    #{topic.sort_order}
                  </span>
                  <button
                    onClick={() => startEdit(topic)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--surface-muted)",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--interactive-light)";
                      e.currentTarget.style.color = "var(--interactive)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--surface-muted)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(topic.id, topic.name)}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--surface-muted)",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--error-bg)";
                      e.currentTarget.style.color = "var(--error-text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--surface-muted)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
