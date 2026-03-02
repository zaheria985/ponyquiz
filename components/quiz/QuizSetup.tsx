"use client";

import { useState, useCallback } from "react";
import QuestionRenderer from "@/components/quiz/QuestionRenderer";
import ProgressBar from "@/components/ui/ProgressBar";

interface TopicOption {
  id: string;
  name: string;
  count: number;
}

interface QuizQuestionClient {
  id: string;
  text: string;
  type: string;
  topic_name: string | null;
  difficulty: string;
  options: { text: string }[] | null;
  image_path: string | null;
  image_alt: string | null;
  hotspots: unknown[] | null;
}

interface QuizSetupProps {
  topics: TopicOption[];
  totalCount: number;
}

type QuizPhase = "setup" | "loading" | "active" | "results";

const QUESTION_COUNTS = [5, 10, 15, 20];
const DIFFICULTIES = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function QuizSetup({ topics, totalCount }: QuizSetupProps) {
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("all");
  const [questionCount, setQuestionCount] = useState(10);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionClient[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  function toggleTopic(topicId: string) {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  }

  async function handleStart() {
    setError(null);
    setPhase("loading");

    try {
      const res = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
          difficulty: difficulty !== "all" ? difficulty : undefined,
          count: questionCount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to start quiz");
        setPhase("setup");
        return;
      }

      const data = await res.json();
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setCorrectCount(0);
      setAnsweredCount(0);
      setPhase("active");
    } catch {
      setError("Network error. Please try again.");
      setPhase("setup");
    }
  }

  const handleNext = useCallback(async () => {
    if (currentIndex + 1 >= questions.length) {
      // Complete the quiz
      if (attemptId) {
        try {
          const res = await fetch("/api/quiz/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attemptId }),
          });

          if (res.ok) {
            const data = await res.json();
            setCorrectCount(data.score);
            setAnsweredCount(data.total);
          }
        } catch {
          // Still show results even if complete fails
        }
      }
      setPhase("results");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length, attemptId]);

  function handleRestart() {
    setPhase("setup");
    setAttemptId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setCorrectCount(0);
    setAnsweredCount(0);
    setError(null);
  }

  // Setup phase
  if (phase === "setup") {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        {/* Topic selection */}
        <div
          className="rounded-xl border p-5"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border-light)",
          }}
        >
          <h3
            className="text-base font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Select Topics
          </h3>
          <p
            className="text-sm mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            {selectedTopics.length === 0
              ? "All topics selected"
              : `${selectedTopics.length} topic${selectedTopics.length !== 1 ? "s" : ""} selected`}
          </p>
          <div className="space-y-2">
            {topics.map((topic) => (
              <label
                key={topic.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                style={{ color: "var(--text-primary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--surface-muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedTopics.includes(topic.id)}
                  onChange={() => toggleTopic(topic.id)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "var(--interactive)" }}
                />
                <span className="flex-1 text-sm">{topic.name}</span>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {topic.count} {topic.count === 1 ? "question" : "questions"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div
          className="rounded-xl border p-5"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border-light)",
          }}
        >
          <h3
            className="text-base font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Difficulty
          </h3>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={{
                  backgroundColor:
                    difficulty === d.value
                      ? "var(--interactive)"
                      : "var(--surface)",
                  color:
                    difficulty === d.value
                      ? "var(--brand-contrast)"
                      : "var(--text-primary)",
                  borderColor:
                    difficulty === d.value
                      ? "var(--interactive)"
                      : "var(--border-light)",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question count */}
        <div
          className="rounded-xl border p-5"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border-light)",
          }}
        >
          <h3
            className="text-base font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Number of Questions
          </h3>
          <div className="flex gap-2">
            {QUESTION_COUNTS.map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                style={{
                  backgroundColor:
                    questionCount === count
                      ? "var(--interactive)"
                      : "var(--surface)",
                  color:
                    questionCount === count
                      ? "var(--brand-contrast)"
                      : "var(--text-primary)",
                  borderColor:
                    questionCount === count
                      ? "var(--interactive)"
                      : "var(--border-light)",
                }}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            className="rounded-lg border px-4 py-3 text-sm"
            style={{
              backgroundColor: "var(--error-bg)",
              borderColor: "var(--error-border)",
              color: "var(--error-text)",
            }}
          >
            {error}
          </div>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={totalCount === 0}
          className="w-full py-3 rounded-lg text-base font-semibold transition-colors"
          style={{
            backgroundColor: "var(--interactive)",
            color: "var(--brand-contrast)",
            opacity: totalCount === 0 ? 0.5 : 1,
          }}
        >
          Start Practice
        </button>

        <p
          className="text-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {totalCount} questions available
        </p>
      </div>
    );
  }

  // Loading phase
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Preparing your quiz...
        </div>
      </div>
    );
  }

  // Results phase
  if (phase === "results") {
    const total = answeredCount || questions.length;
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="max-w-lg mx-auto">
        <div
          className="rounded-xl border p-8 text-center"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border-light)",
          }}
        >
          <div className="text-4xl mb-3">
            {percent >= 80 ? (
              <span role="img" aria-label="Star">&#11088;</span>
            ) : percent >= 50 ? (
              <span role="img" aria-label="Thumbs up">&#128077;</span>
            ) : (
              <span role="img" aria-label="Books">&#128218;</span>
            )}
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Practice Complete!
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            You got {correctCount} out of {total} questions correct
          </p>

          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--success-text)" }}
              >
                {correctCount}
              </div>
              <div
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Correct
              </div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--error-text)" }}
              >
                {total - correctCount}
              </div>
              <div
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Incorrect
              </div>
            </div>
          </div>

          <ProgressBar
            value={percent}
            color={
              percent >= 80
                ? "var(--success-solid)"
                : percent >= 50
                  ? "var(--warning-solid)"
                  : "var(--error-text)"
            }
            className="mb-6"
          />

          <p
            className="text-lg font-bold mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            {percent}%
          </p>

          <button
            onClick={handleRestart}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--interactive)",
              color: "var(--brand-contrast)",
            }}
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  // Active quiz phase
  const currentQuestion = questions[currentIndex];
  const progressPercent =
    questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {Math.round(progressPercent)}% complete
          </span>
        </div>
        <ProgressBar value={progressPercent} />
      </div>

      {/* Question */}
      <QuestionRenderer
        key={currentQuestion.id}
        question={currentQuestion}
        attemptId={attemptId!}
        onNext={handleNext}
        isLast={currentIndex + 1 >= questions.length}
      />
    </div>
  );
}
