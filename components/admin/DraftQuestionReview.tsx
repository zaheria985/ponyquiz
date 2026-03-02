"use client";

import type { Topic } from "@/lib/queries/topics";

export interface DraftQuestionData {
  text: string;
  type: string;
  options?: { text: string; isCorrect: boolean }[];
  answer?: string;
  topic?: string;
  topic_id?: string;
  pageReference?: string;
  difficulty?: string;
  explanation?: string;
  included: boolean;
}

const questionTypes = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True/False" },
  { value: "flashcard_qa", label: "Flashcard Q&A" },
  { value: "flashcard_term", label: "Flashcard Term" },
  { value: "flashcard_image", label: "Flashcard Image" },
] as const;

const difficulties = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

interface DraftQuestionReviewProps {
  index: number;
  question: DraftQuestionData;
  topics: Topic[];
  onChange: (index: number, updated: DraftQuestionData) => void;
}

export default function DraftQuestionReview({
  index,
  question,
  topics,
  onChange,
}: DraftQuestionReviewProps) {
  const needsType = !question.type;
  const needsTopic = !question.topic_id && !question.topic;

  function update(partial: Partial<DraftQuestionData>) {
    onChange(index, { ...question, ...partial });
  }

  function updateOption(optIndex: number, text: string) {
    const newOptions = (question.options || []).map((o, i) =>
      i === optIndex ? { ...o, text } : o
    );
    update({ options: newOptions });
  }

  function setCorrectOption(optIndex: number) {
    const newOptions = (question.options || []).map((o, i) => ({
      ...o,
      isCorrect: i === optIndex,
    }));
    update({ options: newOptions });
  }

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--input-text)",
  };

  const labelStyle = { color: "var(--text-secondary)" };

  function handleInputFocus(
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    e.currentTarget.style.borderColor = "var(--input-focus-ring)";
  }

  function handleInputBlur(
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    e.currentTarget.style.borderColor = "var(--input-border)";
  }

  return (
    <div
      className="rounded-lg border p-4 space-y-3 transition-opacity"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: question.included
          ? "var(--border-light)"
          : "var(--border-light)",
        opacity: question.included ? 1 : 0.5,
      }}
    >
      {/* Header row: checkbox + index + warnings */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={question.included}
          onChange={(e) => update({ included: e.target.checked })}
          className="shrink-0 w-4 h-4"
          style={{ accentColor: "var(--interactive)" }}
        />
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Question {index + 1}
        </span>
        {(needsType || needsTopic) && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "var(--warning-bg)",
              color: "var(--warning-text)",
            }}
          >
            {needsType && needsTopic
              ? "Needs type & topic"
              : needsType
                ? "Needs type"
                : "Needs topic"}
          </span>
        )}
        {question.topic && !question.topic_id && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "var(--interactive-light)",
              color: "var(--interactive)",
            }}
          >
            New topic: {question.topic}
          </span>
        )}
      </div>

      {/* Question text */}
      <div>
        <label className="block text-xs font-medium mb-1" style={labelStyle}>
          Question Text
        </label>
        <textarea
          value={question.text}
          onChange={(e) => update({ text: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y"
          style={inputStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>

      {/* Type + Topic + Difficulty row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={labelStyle}>
            Type
          </label>
          <select
            value={question.type || ""}
            onChange={(e) => {
              const newType = e.target.value;
              const updated: Partial<DraftQuestionData> = { type: newType };
              // Initialize options for MC if switching to it
              if (
                newType === "multiple_choice" &&
                (!question.options || question.options.length === 0)
              ) {
                updated.options = [
                  { text: "", isCorrect: true },
                  { text: "", isCorrect: false },
                  { text: "", isCorrect: false },
                  { text: "", isCorrect: false },
                ];
              }
              update(updated);
            }}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
            <option value="">Select type...</option>
            {questionTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={labelStyle}>
            Topic
          </label>
          <select
            value={question.topic_id || ""}
            onChange={(e) => update({ topic_id: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
            <option value="">No topic</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={labelStyle}>
            Difficulty
          </label>
          <select
            value={question.difficulty || "beginner"}
            onChange={(e) => update({ difficulty: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
            {difficulties.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Page reference */}
      <div>
        <label className="block text-xs font-medium mb-1" style={labelStyle}>
          Source / Page Reference
        </label>
        <input
          type="text"
          value={question.pageReference || ""}
          onChange={(e) => update({ pageReference: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
          style={inputStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="e.g. USPC Manual p. 42"
        />
      </div>

      {/* Type-specific answer fields */}
      {question.type === "multiple_choice" && (
        <div>
          <label className="block text-xs font-medium mb-2" style={labelStyle}>
            Options (select correct answer)
          </label>
          <div className="space-y-2">
            {(question.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct_option_${index}`}
                  checked={opt.isCorrect}
                  onChange={() => setCorrectOption(i)}
                  className="shrink-0"
                  style={{ accentColor: "var(--interactive)" }}
                />
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {question.type === "true_false" && (
        <div>
          <label className="block text-xs font-medium mb-2" style={labelStyle}>
            Correct Answer
          </label>
          <div className="flex gap-4">
            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              <input
                type="radio"
                name={`tf_answer_${index}`}
                value="true"
                checked={question.answer === "true"}
                onChange={() => update({ answer: "true" })}
                style={{ accentColor: "var(--interactive)" }}
              />
              True
            </label>
            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              <input
                type="radio"
                name={`tf_answer_${index}`}
                value="false"
                checked={question.answer === "false"}
                onChange={() => update({ answer: "false" })}
                style={{ accentColor: "var(--interactive)" }}
              />
              False
            </label>
          </div>
        </div>
      )}

      {question.type !== "multiple_choice" && question.type !== "true_false" && (
        <div>
          <label className="block text-xs font-medium mb-1" style={labelStyle}>
            Answer
          </label>
          <textarea
            value={question.answer || ""}
            onChange={(e) => update({ answer: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y"
            style={inputStyle}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Enter answer..."
          />
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="block text-xs font-medium mb-1" style={labelStyle}>
          Explanation (optional)
        </label>
        <textarea
          value={question.explanation || ""}
          onChange={(e) => update({ explanation: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y"
          style={inputStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Explain the correct answer..."
        />
      </div>
    </div>
  );
}
