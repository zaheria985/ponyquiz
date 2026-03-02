"use client";

import { useState, useTransition } from "react";
import { createQuestion, updateQuestion } from "@/lib/actions/questions";
import type { Question } from "@/lib/queries/questions";
import type { Topic } from "@/lib/queries/topics";

const questionTypes = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True/False" },
  { value: "flashcard_qa", label: "Flashcard Q&A" },
  { value: "flashcard_term", label: "Flashcard Term" },
  { value: "flashcard_image", label: "Flashcard Image" },
  { value: "labeled_diagram", label: "Labeled Diagram" },
  { value: "photo_id", label: "Photo ID" },
  { value: "image_text", label: "Image Text" },
] as const;

const difficulties = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

interface QuestionFormProps {
  question?: Question | null;
  topics: Topic[];
  onClose: () => void;
}

export default function QuestionForm({
  question,
  topics,
  onClose,
}: QuestionFormProps) {
  const isEdit = !!question;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState(question?.type || "multiple_choice");
  const [text, setText] = useState(question?.text || "");
  const [topicId, setTopicId] = useState(question?.topic_id || "");
  const [difficulty, setDifficulty] = useState(
    question?.difficulty || "beginner"
  );
  const [explanation, setExplanation] = useState(question?.explanation || "");
  const [answer, setAnswer] = useState(question?.answer || "");
  const [imageId, setImageId] = useState(question?.image_id || "");

  // Multiple choice options
  const existingOptions =
    question?.type === "multiple_choice" && Array.isArray(question.options)
      ? question.options
      : null;
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>(
    existingOptions || [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]
  );

  function updateOption(index: number, text: string) {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, text } : o))
    );
  }

  function setCorrectOption(index: number) {
    setOptions((prev) =>
      prev.map((o, i) => ({ ...o, isCorrect: i === index }))
    );
  }

  function handleSubmit() {
    setError(null);
    const formData = new FormData();

    if (isEdit && question) {
      formData.set("id", question.id);
    }

    formData.set("text", text);
    formData.set("type", type);
    formData.set("topic_id", topicId);
    formData.set("difficulty", difficulty);
    formData.set("explanation", explanation);
    formData.set("image_id", imageId);

    if (type === "multiple_choice") {
      options.forEach((opt, i) => {
        formData.set(`option_${i}`, opt.text);
      });
      const correctIdx = options.findIndex((o) => o.isCorrect);
      formData.set("correct_option", String(correctIdx));
    } else if (type === "true_false") {
      formData.set("answer", answer);
    } else {
      formData.set("answer", answer);
    }

    const action = isEdit ? updateQuestion : createQuestion;

    startTransition(async () => {
      const result = await action(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--input-text)",
  };

  const labelStyle = { color: "var(--text-secondary)" };

  function handleInputFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "var(--input-focus-ring)";
  }

  function handleInputBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "var(--input-border)";
  }

  return (
    <div className="space-y-4">
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

      {/* Question type */}
      <div>
        <label className="block text-sm font-medium mb-1" style={labelStyle}>
          Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
          style={inputStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        >
          {questionTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Question text */}
      <div>
        <label className="block text-sm font-medium mb-1" style={labelStyle}>
          Question Text
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y"
          style={inputStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Enter question text..."
        />
      </div>

      {/* Topic + Difficulty row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>
            Topic
          </label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
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
          <label className="block text-sm font-medium mb-1" style={labelStyle}>
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
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

      {/* Type-specific fields */}
      {type === "multiple_choice" && (
        <div>
          <label className="block text-sm font-medium mb-2" style={labelStyle}>
            Options (select correct answer)
          </label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct_option"
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

      {type === "true_false" && (
        <div>
          <label className="block text-sm font-medium mb-2" style={labelStyle}>
            Correct Answer
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
              <input
                type="radio"
                name="tf_answer"
                value="true"
                checked={answer === "true"}
                onChange={() => setAnswer("true")}
                style={{ accentColor: "var(--interactive)" }}
              />
              True
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
              <input
                type="radio"
                name="tf_answer"
                value="false"
                checked={answer === "false"}
                onChange={() => setAnswer("false")}
                style={{ accentColor: "var(--interactive)" }}
              />
              False
            </label>
          </div>
        </div>
      )}

      {(type === "flashcard_qa" || type === "flashcard_term") && (
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>
            Answer / Back of Card
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y"
            style={inputStyle}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Enter answer or back of card text..."
          />
        </div>
      )}

      {(type === "flashcard_image" ||
        type === "labeled_diagram" ||
        type === "photo_id" ||
        type === "image_text") && (
        <>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={labelStyle}
            >
              Image ID
            </label>
            <input
              type="text"
              value={imageId}
              onChange={(e) => setImageId(e.target.value)}
              placeholder="Enter image UUID (from Images section)"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Upload images in the Images section first, then paste the ID here.
            </p>
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={labelStyle}
            >
              Answer
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter answer text..."
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
        </>
      )}

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium mb-1" style={labelStyle}>
          Explanation (optional)
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y"
          style={inputStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Explain the correct answer..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--surface-muted)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--surface-subtle)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--surface-muted)";
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending || !text.trim()}
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
          {isPending
            ? "Saving..."
            : isEdit
              ? "Update Question"
              : "Create Question"}
        </button>
      </div>
    </div>
  );
}
