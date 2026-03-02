"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { parseDocument, saveDraftQuestions } from "@/lib/actions/import";
import type { Topic } from "@/lib/queries/topics";
import DraftQuestionReview, {
  type DraftQuestionData,
} from "@/components/admin/DraftQuestionReview";

type Step = "upload" | "parsing" | "review";

interface ImportWizardProps {
  topics: Topic[];
}

export default function ImportWizard({ topics }: ImportWizardProps) {
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DraftQuestionData[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [, startParsingTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      setSuccessMessage(null);

      // Validate file type
      const ext = file.name.lastIndexOf(".") >= 0
        ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
        : "";
      if (![".pdf", ".doc", ".docx"].includes(ext)) {
        setError("Unsupported file type. Please upload a PDF or Word document.");
        return;
      }

      // Validate file size (20MB)
      if (file.size > 20 * 1024 * 1024) {
        setError("File size exceeds 20MB limit.");
        return;
      }

      setStep("parsing");

      const formData = new FormData();
      formData.set("file", file);

      startParsingTransition(async () => {
        const result = await parseDocument(formData);

        if ("error" in result) {
          setError(result.error);
          setStep("upload");
          return;
        }

        // Map AI results to editable DraftQuestionData, matching topic names to IDs
        const mapped: DraftQuestionData[] = result.data.map((q) => {
          let topicId = "";
          if (q.topic) {
            const match = topics.find(
              (t) =>
                t.name.toLowerCase() === q.topic?.toLowerCase() ||
                t.name.toLowerCase().includes(q.topic?.toLowerCase() || "")
            );
            if (match) {
              topicId = match.id;
            }
          }

          return {
            text: q.text,
            type: q.type,
            options: q.options,
            answer: q.answer,
            topic: q.topic,
            topic_id: topicId,
            difficulty: q.difficulty || "beginner",
            explanation: q.explanation,
            included: true,
          };
        });

        setQuestions(mapped);
        setStep("review");
      });
    },
    [topics]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  }

  function handleQuestionChange(index: number, updated: DraftQuestionData) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? updated : q))
    );
  }

  function selectAll() {
    setQuestions((prev) => prev.map((q) => ({ ...q, included: true })));
  }

  function deselectAll() {
    setQuestions((prev) => prev.map((q) => ({ ...q, included: false })));
  }

  function handleImport(onlySelected: boolean) {
    setError(null);
    setSuccessMessage(null);

    const toImport = onlySelected
      ? questions.filter((q) => q.included)
      : questions;

    if (toImport.length === 0) {
      setError("No questions selected for import.");
      return;
    }

    // Validate that all questions have required fields
    for (let i = 0; i < toImport.length; i++) {
      const q = toImport[i];
      if (!q.text.trim()) {
        setError(`Question ${i + 1} is missing question text.`);
        return;
      }
      if (!q.type) {
        setError(`Question ${i + 1} is missing a type. Please select one.`);
        return;
      }
      if (!q.difficulty) {
        setError(
          `Question ${i + 1} is missing a difficulty. Please select one.`
        );
        return;
      }
    }

    // Prepare payload for server action
    const payload = toImport.map((q) => ({
      text: q.text,
      type: q.type,
      options:
        q.type === "multiple_choice" ? q.options || null : null,
      answer:
        q.type === "multiple_choice" ? null : q.answer || null,
      topic_id: q.topic_id || null,
      difficulty: q.difficulty,
      explanation: q.explanation || null,
    }));

    const formData = new FormData();
    formData.set("questions", JSON.stringify(payload));

    startSavingTransition(async () => {
      const result = await saveDraftQuestions(formData);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setSuccessMessage(
        `Successfully imported ${result.data.count} question${result.data.count !== 1 ? "s" : ""}.`
      );
      setQuestions([]);
      setStep("upload");
    });
  }

  function handleCancel() {
    setQuestions([]);
    setError(null);
    setSuccessMessage(null);
    setStep("upload");
  }

  const includedCount = questions.filter((q) => q.included).length;

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

      {/* Success message */}
      {successMessage && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm border"
          style={{
            backgroundColor: "var(--success-bg)",
            color: "var(--success-text)",
            borderColor: "var(--success-border)",
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div
          className="rounded-lg border-2 border-dashed p-10 text-center transition-colors"
          style={{
            borderColor: dragOver
              ? "var(--interactive)"
              : "var(--border-light)",
            backgroundColor: dragOver
              ? "var(--interactive-light)"
              : "var(--surface)",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="mb-4">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto"
              style={{ color: "var(--text-muted)" }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p
            className="text-base font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Drag and drop a document here
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Supports PDF, DOC, and DOCX files (up to 20MB)
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
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
            Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Step 2: Parsing */}
      {step === "parsing" && (
        <div
          className="rounded-lg border p-10 text-center"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border-light)",
          }}
        >
          <div className="mb-4">
            <div
              className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: "var(--interactive)", borderTopColor: "transparent" }}
            />
          </div>
          <p
            className="text-base font-medium mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Analyzing document with AI...
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            This may take a moment depending on the document size.
          </p>
        </div>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <div>
          {/* Summary bar */}
          <div
            className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 px-4 py-3 rounded-lg border"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border-light)",
            }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {questions.length} question{questions.length !== 1 ? "s" : ""}{" "}
              found &mdash; {includedCount} selected
            </p>
            <div className="flex items-center gap-2 sm:ml-auto">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "var(--surface-muted)",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--surface-subtle)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--surface-muted)";
                }}
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "var(--surface-muted)",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--surface-subtle)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--surface-muted)";
                }}
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Question cards */}
          <div className="space-y-4 mb-6">
            {questions.map((q, i) => (
              <DraftQuestionReview
                key={i}
                index={i}
                question={q}
                topics={topics}
                onChange={handleQuestionChange}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div
            className="flex flex-col sm:flex-row gap-3 px-4 py-4 rounded-lg border"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border-light)",
            }}
          >
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--surface-muted)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--surface-subtle)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--surface-muted)";
              }}
            >
              Cancel
            </button>
            <div className="sm:ml-auto flex gap-3">
              <button
                onClick={() => handleImport(true)}
                disabled={isSaving || includedCount === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "var(--interactive)",
                  color: "var(--brand-contrast)",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor =
                      "var(--interactive-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--interactive)";
                }}
              >
                {isSaving
                  ? "Importing..."
                  : `Import Selected (${includedCount})`}
              </button>
              <button
                onClick={() => handleImport(false)}
                disabled={isSaving || questions.length === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "var(--interactive)",
                  color: "var(--brand-contrast)",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor =
                      "var(--interactive-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--interactive)";
                }}
              >
                {isSaving ? "Importing..." : "Import All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
