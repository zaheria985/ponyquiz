"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  resetStudentPassword,
  deleteStudentAccount,
} from "@/lib/actions/admin";
import type { StudentDetail as StudentDetailType } from "@/lib/queries/admin";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ProgressBar from "@/components/ui/ProgressBar";

interface StudentDetailProps {
  student: StudentDetailType;
}

export default function StudentDetail({ student }: StudentDetailProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset password modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPwd, setResetPwd] = useState("");

  function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.set("id", student.id);
    formData.set("password", resetPwd);

    startTransition(async () => {
      const result = await resetStudentPassword(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess("Password has been reset.");
        setShowResetModal(false);
        setResetPwd("");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete student "${student.name}"? This will permanently remove all their data.`)) {
      return;
    }
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.set("id", student.id);

    startTransition(async () => {
      const result = await deleteStudentAccount(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push("/admin/students");
      }
    });
  }

  const flashTotal = student.flashcardSummary.total_cards;
  const flashMasteredPct = flashTotal > 0
    ? Math.round((student.flashcardSummary.mastered / flashTotal) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Messages */}
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
      {success && (
        <div
          className="px-4 py-3 rounded-lg text-sm border"
          style={{
            backgroundColor: "var(--success-bg)",
            color: "var(--success-text)",
            borderColor: "var(--success-border)",
          }}
        >
          {success}
        </div>
      )}

      {/* Back link and actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/students"
          className="text-sm font-medium transition-colors"
          style={{ color: "var(--interactive)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--interactive-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--interactive)";
          }}
        >
          &larr; Back to Students
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
            Reset Password
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
            Delete Account
          </button>
        </div>
      </div>

      {/* Profile info */}
      <Card title="Profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Email" value={student.email} />
          <InfoRow label="Title" value={student.title || "None"} />
          <InfoRow label="Streak" value={`${student.streak_count} day${student.streak_count !== 1 ? "s" : ""}`} />
          <InfoRow
            label="Last Active"
            value={student.last_active_date ? formatDate(student.last_active_date) : "Never"}
          />
          <InfoRow label="Joined" value={formatDate(student.created_at)} />
        </div>
      </Card>

      {/* Flashcard progress */}
      <Card title="Flashcard Progress">
        {flashTotal === 0 ? (
          <p
            className="text-sm text-center py-4"
            style={{ color: "var(--text-muted)" }}
          >
            No flashcard progress yet.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>
                {student.flashcardSummary.mastered} mastered of {flashTotal} total
              </span>
              <span
                className="font-medium tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {flashMasteredPct}%
              </span>
            </div>
            <ProgressBar value={flashMasteredPct} />
            <div className="flex gap-4 text-xs mt-2">
              <span style={{ color: "var(--success-text)" }}>
                Mastered: {student.flashcardSummary.mastered}
              </span>
              <span style={{ color: "var(--warning-text)" }}>
                Learning: {student.flashcardSummary.learning}
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                Not Started: {student.flashcardSummary.not_started}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Badges */}
      <Card title="Badges">
        {student.badges.length === 0 ? (
          <p
            className="text-sm text-center py-4"
            style={{ color: "var(--text-muted)" }}
          >
            No badges earned yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {student.badges.map((badge) => (
              <Badge key={badge.badge_id} variant="success">
                {badge.icon ? `${badge.icon} ` : ""}{badge.name}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Quiz history */}
      <Card title="Quiz History">
        {student.quizHistory.length === 0 ? (
          <p
            className="text-sm text-center py-4"
            style={{ color: "var(--text-muted)" }}
          >
            No quiz attempts yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: "var(--border-light)" }}
                >
                  <th
                    className="text-left py-2 pr-4 font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Mode
                  </th>
                  <th
                    className="text-left py-2 pr-4 font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Score
                  </th>
                  <th
                    className="text-left py-2 pr-4 font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Questions
                  </th>
                  <th
                    className="text-left py-2 font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {student.quizHistory.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="border-b last:border-b-0"
                    style={{ borderColor: "var(--border-light)" }}
                  >
                    <td className="py-3 pr-4">
                      <Badge variant={attempt.mode === "graded" ? "primary" : "default"}>
                        {attempt.mode}
                      </Badge>
                    </td>
                    <td
                      className="py-3 pr-4 tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {attempt.score != null
                        ? `${attempt.score}/${attempt.total_questions}`
                        : "In progress"}
                    </td>
                    <td
                      className="py-3 pr-4 tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {attempt.total_questions}
                    </td>
                    <td
                      className="py-3"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatDateTime(attempt.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reset Password Modal */}
      <Modal
        open={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setResetPwd("");
        }}
        title={`Reset Password: ${student.name}`}
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
              value={resetPwd}
              onChange={(e) => setResetPwd(e.target.value)}
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
                setShowResetModal(false);
                setResetPwd("");
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-xs font-medium mb-0.5"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p
        className="text-sm"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
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

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
