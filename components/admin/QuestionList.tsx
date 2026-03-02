"use client";

import { useState, useTransition } from "react";
import { deleteQuestion, toggleQuestionActive } from "@/lib/actions/questions";
import type { Question } from "@/lib/queries/questions";
import type { Topic } from "@/lib/queries/topics";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import QuestionForm from "@/components/admin/QuestionForm";

const typeLabels: Record<string, string> = {
  multiple_choice: "MC",
  true_false: "T/F",
  flashcard_qa: "FC Q&A",
  flashcard_term: "FC Term",
  flashcard_image: "FC Image",
  labeled_diagram: "Diagram",
  photo_id: "Photo ID",
  image_text: "Img Text",
};

const difficultyVariant: Record<string, "success" | "warning" | "danger"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "danger",
};

interface QuestionListProps {
  initialQuestions: Question[];
  topics: Topic[];
}

export default function QuestionList({
  initialQuestions,
  topics,
}: QuestionListProps) {
  const [filterTopic, setFilterTopic] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = initialQuestions.filter((q) => {
    if (filterTopic && q.topic_id !== filterTopic) return false;
    if (filterType && q.type !== filterType) return false;
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
    return true;
  });

  function openCreate() {
    setEditingQuestion(null);
    setModalOpen(true);
  }

  function openEdit(question: Question) {
    setEditingQuestion(question);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingQuestion(null);
  }

  function handleToggleActive(id: string) {
    setError(null);
    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      const result = await toggleQuestionActive(formData);
      if ("error" in result) {
        setError(result.error);
      }
    });
  }

  function handleDelete(id: string, text: string) {
    const preview = text.length > 50 ? text.slice(0, 50) + "..." : text;
    if (!confirm(`Delete question "${preview}"? This cannot be undone.`)) return;
    setError(null);
    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      const result = await deleteQuestion(formData);
      if ("error" in result) {
        setError(result.error);
      }
    });
  }

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--input-text)",
  };

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

      {/* Filters + Add button */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm outline-none"
          style={inputStyle}
        >
          <option value="">All Topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm outline-none"
          style={inputStyle}
        >
          <option value="">All Types</option>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True/False</option>
          <option value="flashcard_qa">Flashcard Q&A</option>
          <option value="flashcard_term">Flashcard Term</option>
          <option value="flashcard_image">Flashcard Image</option>
          <option value="labeled_diagram">Labeled Diagram</option>
          <option value="photo_id">Photo ID</option>
          <option value="image_text">Image Text</option>
        </select>

        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm outline-none"
          style={inputStyle}
        >
          <option value="">All Difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <div className="sm:ml-auto">
          <button
            onClick={openCreate}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--interactive)",
              color: "var(--brand-contrast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--interactive-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--interactive)";
            }}
          >
            + New Question
          </button>
        </div>
      </div>

      {/* Question count */}
      <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
        {filtered.length} question{filtered.length !== 1 ? "s" : ""}
        {filterTopic || filterType || filterDifficulty ? " (filtered)" : ""}
      </p>

      {/* Questions */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No questions found"
          description={
            filterTopic || filterType || filterDifficulty
              ? "Try adjusting your filters."
              : "Create your first question to get started."
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3 rounded-lg border transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-light)",
                opacity: q.active ? 1 : 0.6,
              }}
            >
              {/* Question text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm truncate"
                  style={{ color: "var(--text-primary)" }}
                  title={q.text}
                >
                  {q.text}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="primary">
                  {typeLabels[q.type] || q.type}
                </Badge>
                {q.topic_name && (
                  <Badge variant="default">{q.topic_name}</Badge>
                )}
                <Badge variant={difficultyVariant[q.difficulty] || "default"}>
                  {q.difficulty}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Active toggle */}
                <button
                  onClick={() => handleToggleActive(q.id)}
                  disabled={isPending}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: q.active
                      ? "var(--success-bg)"
                      : "var(--surface-muted)",
                    color: q.active
                      ? "var(--success-text)"
                      : "var(--text-muted)",
                  }}
                  title={q.active ? "Click to deactivate" : "Click to activate"}
                >
                  {q.active ? "Active" : "Inactive"}
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEdit(q)}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors"
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

                {/* Delete */}
                <button
                  onClick={() => handleDelete(q.id, q.text)}
                  disabled={isPending}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors"
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingQuestion ? "Edit Question" : "New Question"}
      >
        <QuestionForm
          question={editingQuestion}
          topics={topics}
          onClose={closeModal}
        />
      </Modal>
    </div>
  );
}
