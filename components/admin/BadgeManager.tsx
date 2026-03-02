"use client";

import { useState, useTransition } from "react";
import { createBadge, updateBadge, deleteBadge } from "@/lib/actions/badges";
import type { BadgeRow } from "@/lib/queries/badges";

interface BadgeManagerProps {
  initialBadges: BadgeRow[];
}

export default function BadgeManager({ initialBadges }: BadgeManagerProps) {
  const [badges] = useState(initialBadges);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editCriteria, setEditCriteria] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newCriteria, setNewCriteria] = useState('{"type":"quiz_count","threshold":1}');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(badge: BadgeRow) {
    setEditingId(badge.id);
    setEditName(badge.name);
    setEditDescription(badge.description || "");
    setEditIcon(badge.icon || "");
    setEditCriteria(JSON.stringify(badge.criteria));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  function handleCreate() {
    if (!newName.trim()) return;
    setError(null);
    const formData = new FormData();
    formData.set("name", newName.trim());
    formData.set("description", newDescription.trim());
    formData.set("icon", newIcon.trim());
    formData.set("criteria", newCriteria.trim());

    startTransition(async () => {
      const result = await createBadge(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setNewName("");
        setNewDescription("");
        setNewIcon("");
        setNewCriteria('{"type":"quiz_count","threshold":1}');
      }
    });
  }

  function handleUpdate(id: string) {
    if (!editName.trim()) return;
    setError(null);
    const formData = new FormData();
    formData.set("id", id);
    formData.set("name", editName.trim());
    formData.set("description", editDescription.trim());
    formData.set("icon", editIcon.trim());
    formData.set("criteria", editCriteria.trim());

    startTransition(async () => {
      const result = await updateBadge(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete badge "${name}"? This cannot be undone.`)) return;
    setError(null);
    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      const result = await deleteBadge(formData);
      if ("error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div>
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

      {/* Add new badge form */}
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
          Add New Badge
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            placeholder="Badge name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
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
            type="text"
            placeholder="Icon (emoji or path)"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
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
        </div>
        <input
          type="text"
          placeholder="Description"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors mb-3"
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
        <div className="flex gap-3">
          <input
            type="text"
            placeholder='Criteria JSON, e.g. {"type":"quiz_count","threshold":1}'
            value={newCriteria}
            onChange={(e) => setNewCriteria(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors font-mono"
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
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
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
            {isPending ? "Adding..." : "Add Badge"}
          </button>
        </div>
      </div>

      {/* Badges list */}
      {badges.length === 0 ? (
        <p
          className="text-sm text-center py-8"
          style={{ color: "var(--text-muted)" }}
        >
          No badges yet. Add one above to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-light)",
              }}
            >
              {editingId === badge.id ? (
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                      style={{
                        backgroundColor: "var(--input-bg)",
                        borderColor: "var(--input-focus-ring)",
                        color: "var(--input-text)",
                      }}
                      placeholder="Name"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="w-24 px-3 py-1.5 rounded-lg border text-sm outline-none"
                      style={{
                        backgroundColor: "var(--input-bg)",
                        borderColor: "var(--input-focus-ring)",
                        color: "var(--input-text)",
                      }}
                      placeholder="Icon"
                    />
                  </div>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border text-sm outline-none"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      borderColor: "var(--input-focus-ring)",
                      color: "var(--input-text)",
                    }}
                    placeholder="Description"
                  />
                  <input
                    type="text"
                    value={editCriteria}
                    onChange={(e) => setEditCriteria(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border text-sm outline-none font-mono"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      borderColor: "var(--input-focus-ring)",
                      color: "var(--input-text)",
                    }}
                    placeholder="Criteria JSON"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(badge.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: "var(--success-bg)",
                        color: "var(--success-text)",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: "var(--surface-muted)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-xl shrink-0">
                    {badge.icon || "\u2b50"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-sm font-medium block"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {badge.name}
                    </span>
                    {badge.description && (
                      <span
                        className="text-xs block"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {badge.description}
                      </span>
                    )}
                    <span
                      className="text-xs font-mono block"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {JSON.stringify(badge.criteria)}
                    </span>
                  </div>
                  <button
                    onClick={() => startEdit(badge)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0"
                    style={{
                      backgroundColor: "var(--surface-muted)",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--interactive-light)";
                      e.currentTarget.style.color = "var(--interactive)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--surface-muted)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(badge.id, badge.name)}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0"
                    style={{
                      backgroundColor: "var(--surface-muted)",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--error-bg)";
                      e.currentTarget.style.color = "var(--error-text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--surface-muted)";
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
