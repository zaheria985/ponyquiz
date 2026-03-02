"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createStudentAccount,
  resetStudentPassword,
  deleteStudentAccount,
} from "@/lib/actions/admin";
import type { StudentSummary } from "@/lib/queries/admin";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

interface StudentListProps {
  initialStudents: StudentSummary[];
}

export default function StudentList({ initialStudents }: StudentListProps) {
  const [students] = useState(initialStudents);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Add student modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.set("name", newName.trim());
    formData.set("email", newEmail.trim());
    formData.set("password", newPassword);

    startTransition(async () => {
      const result = await createStudentAccount(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess("Student account created successfully.");
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setShowAddModal(false);
      }
    });
  }

  function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resetTarget) return;
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.set("id", resetTarget.id);
    formData.set("password", resetPassword);

    startTransition(async () => {
      const result = await resetStudentPassword(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(`Password reset for ${resetTarget.name}.`);
        setResetTarget(null);
        setResetPassword("");
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete student "${name}"? This will permanently remove all their data.`)) {
      return;
    }
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      const result = await deleteStudentAccount(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(`Student "${name}" has been deleted.`);
      }
    });
  }

  return (
    <div>
      {/* Messages */}
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
      {success && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm border"
          style={{
            backgroundColor: "var(--success-bg)",
            color: "var(--success-text)",
            borderColor: "var(--success-border)",
          }}
        >
          {success}
        </div>
      )}

      {/* Add Student button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
          Add Student
        </button>
      </div>

      {/* Student table */}
      {students.length === 0 ? (
        <Card>
          <EmptyState
            title="No students yet"
            description="Add a student to get started."
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: "var(--border-light)" }}
                >
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Quizzes</Th>
                  <Th>Avg Score</Th>
                  <Th>Streak</Th>
                  <Th>Badges</Th>
                  <Th>Joined</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b last:border-b-0"
                    style={{ borderColor: "var(--border-light)" }}
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="font-medium transition-colors"
                        style={{ color: "var(--interactive)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--interactive-hover)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--interactive)";
                        }}
                      >
                        {student.name}
                      </Link>
                    </td>
                    <td
                      className="py-3 pr-4"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {student.email}
                    </td>
                    <td
                      className="py-3 pr-4 tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {student.total_quizzes}
                    </td>
                    <td
                      className="py-3 pr-4 tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {student.average_score != null
                        ? `${student.average_score}%`
                        : "N/A"}
                    </td>
                    <td className="py-3 pr-4">
                      {student.streak_count > 0 ? (
                        <Badge variant="warning">
                          {student.streak_count} day{student.streak_count !== 1 ? "s" : ""}
                        </Badge>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>0</span>
                      )}
                    </td>
                    <td
                      className="py-3 pr-4 tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {student.badge_count}
                    </td>
                    <td
                      className="py-3 pr-4"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatDate(student.created_at)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
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
                          View
                        </Link>
                        <button
                          onClick={() => setResetTarget({ id: student.id, name: student.name })}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: "var(--surface-muted)",
                            color: "var(--text-secondary)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--warning-bg)";
                            e.currentTarget.style.color = "var(--warning-text)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--surface-muted)";
                            e.currentTarget.style.color = "var(--text-secondary)";
                          }}
                        >
                          Reset Pwd
                        </button>
                        <button
                          onClick={() => handleDelete(student.id, student.name)}
                          disabled={isPending}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Student Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Student"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
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
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
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
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
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
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--surface-muted)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
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
              {isPending ? "Creating..." : "Create Student"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={resetTarget !== null}
        onClose={() => {
          setResetTarget(null);
          setResetPassword("");
        }}
        title={resetTarget ? `Reset Password: ${resetTarget.name}` : "Reset Password"}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              New Password
            </label>
            <input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
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
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setResetTarget(null);
                setResetPassword("");
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--surface-muted)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
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
              {isPending ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="text-left py-2 pr-4 font-medium"
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </th>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
