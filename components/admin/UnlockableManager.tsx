"use client";

import { useState, useTransition } from "react";
import {
  createUnlockable,
  updateUnlockable,
  deleteUnlockable,
} from "@/lib/actions/badges";
import type { UnlockableRow } from "@/lib/queries/unlockables";
import Badge from "@/components/ui/Badge";

interface UnlockableManagerProps {
  initialUnlockables: UnlockableRow[];
}

const TYPES = ["avatar", "theme", "title"] as const;

export default function UnlockableManager({
  initialUnlockables,
}: UnlockableManagerProps) {
  const [unlockables] = useState(initialUnlockables);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("avatar");
  const [editCriteria, setEditCriteria] = useState("");
  const [editAssetPath, setEditAssetPath] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("avatar");
  const [newCriteria, setNewCriteria] = useState('{"type":"quiz_count","threshold":1}');
  const [newAssetPath, setNewAssetPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(item: UnlockableRow) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditType(item.type);
    setEditCriteria(JSON.stringify(item.criteria));
    setEditAssetPath(item.asset_path || "");
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
    formData.set("type", newType);
    formData.set("criteria", newCriteria.trim());
    formData.set("asset_path", newAssetPath.trim());

    startTransition(async () => {
      const result = await createUnlockable(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setNewName("");
        setNewType("avatar");
        setNewCriteria('{"type":"quiz_count","threshold":1}');
        setNewAssetPath("");
      }
    });
  }

  function handleUpdate(id: string) {
    if (!editName.trim()) return;
    setError(null);
    const formData = new FormData();
    formData.set("id", id);
    formData.set("name", editName.trim());
    formData.set("type", editType);
    formData.set("criteria", editCriteria.trim());
    formData.set("asset_path", editAssetPath.trim());

    startTransition(async () => {
      const result = await updateUnlockable(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete unlockable "${name}"? This cannot be undone.`)) return;
    setError(null);
    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      const result = await deleteUnlockable(formData);
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

      {/* Add new unlockable form */}
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
          Add New Unlockable
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            placeholder="Name"
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
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--input-text)",
            }}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Asset path (optional)"
            value={newAssetPath}
            onChange={(e) => setNewAssetPath(e.target.value)}
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
        <div className="flex gap-3">
          <input
            type="text"
            placeholder='Criteria JSON'
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
            {isPending ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      {/* Unlockables list */}
      {unlockables.length === 0 ? (
        <p
          className="text-sm text-center py-8"
          style={{ color: "var(--text-muted)" }}
        >
          No unlockables yet. Add one above to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {unlockables.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-light)",
              }}
            >
              {editingId === item.id ? (
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
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border text-sm outline-none"
                      style={{
                        backgroundColor: "var(--input-bg)",
                        borderColor: "var(--input-focus-ring)",
                        color: "var(--input-text)",
                      }}
                    >
                      {TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={editAssetPath}
                    onChange={(e) => setEditAssetPath(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border text-sm outline-none"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      borderColor: "var(--input-focus-ring)",
                      color: "var(--input-text)",
                    }}
                    placeholder="Asset path"
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
                      onClick={() => handleUpdate(item.id)}
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.name}
                      </span>
                      <Badge
                        variant={
                          item.type === "avatar"
                            ? "primary"
                            : item.type === "title"
                              ? "success"
                              : "warning"
                        }
                      >
                        {item.type}
                      </Badge>
                    </div>
                    <span
                      className="text-xs font-mono block"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {JSON.stringify(item.criteria)}
                    </span>
                    {item.asset_path && (
                      <span
                        className="text-xs block"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.asset_path}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => startEdit(item)}
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
                    onClick={() => handleDelete(item.id, item.name)}
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
