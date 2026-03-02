"use client";

import { useState } from "react";
import MultipleChoiceQuestion from "@/components/quiz/MultipleChoiceQuestion";
import TrueFalseQuestion from "@/components/quiz/TrueFalseQuestion";
import ImageQuestion from "@/components/quiz/ImageQuestion";
import DiagramQuestion from "@/components/quiz/DiagramQuestion";
import QuizResults from "@/components/quiz/QuizResults";
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

interface StoredAnswer {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
}

interface AnswerResult {
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  explanation: string | null;
}

interface GradedQuizProps {
  topics: TopicOption[];
  totalCount: number;
}

type QuizPhase = "setup" | "loading" | "active" | "submitting" | "results";

const QUESTION_COUNTS = [5, 10, 15, 20];
const DIFFICULTIES = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function GradedQuiz({ topics, totalCount }: GradedQuizProps) {
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("all");
  const [questionCount, setQuestionCount] = useState(10);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionClient[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [storedAnswers, setStoredAnswers] = useState<StoredAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);

  // Results state
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [finalScore, setFinalScore] = useState(0);

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
          mode: "graded",
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
      setStoredAnswers([]);
      setCurrentAnswer(null);
      setResults([]);
      setFinalScore(0);
      setPhase("active");
    } catch {
      setError("Network error. Please try again.");
      setPhase("setup");
    }
  }

  function handleAnswer(answer: string) {
    setCurrentAnswer(answer);
  }

  function handleNext() {
    if (currentAnswer === null) return;

    const currentQuestion = questions[currentIndex];
    const newStoredAnswers = [
      ...storedAnswers,
      {
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        selectedAnswer: currentAnswer,
      },
    ];
    setStoredAnswers(newStoredAnswers);
    setCurrentAnswer(null);

    if (currentIndex + 1 >= questions.length) {
      // All questions answered, submit everything
      submitAllAnswers(newStoredAnswers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  async function submitAllAnswers(answers: StoredAnswer[]) {
    if (!attemptId) return;

    setPhase("submitting");

    try {
      const answerResults: AnswerResult[] = [];

      // Submit each answer sequentially
      for (const answer of answers) {
        const res = await fetch("/api/quiz/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            questionId: answer.questionId,
            selectedAnswer: answer.selectedAnswer,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          answerResults.push({
            questionText: answer.questionText,
            userAnswer: answer.selectedAnswer,
            correctAnswer: data.correctAnswer,
            correct: data.correct,
            explanation: data.explanation,
          });
        } else {
          answerResults.push({
            questionText: answer.questionText,
            userAnswer: answer.selectedAnswer,
            correctAnswer: "",
            correct: false,
            explanation: "Failed to check this answer.",
          });
        }
      }

      // Complete the quiz attempt
      const completeRes = await fetch("/api/quiz/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });

      let score = answerResults.filter((r) => r.correct).length;
      if (completeRes.ok) {
        const completeData = await completeRes.json();
        score = completeData.score;
      }

      setResults(answerResults);
      setFinalScore(score);
      setPhase("results");
    } catch {
      // Even on error, try to show what we have
      setResults([]);
      setFinalScore(0);
      setPhase("results");
    }
  }

  function handleRestart() {
    setPhase("setup");
    setAttemptId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setStoredAnswers([]);
    setCurrentAnswer(null);
    setResults([]);
    setFinalScore(0);
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
                  e.currentTarget.style.backgroundColor =
                    "var(--surface-muted)";
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
          Start Quiz
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

  // Submitting phase
  if (phase === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div
          className="w-8 h-8 border-3 rounded-full animate-spin"
          style={{
            borderColor: "var(--surface-muted)",
            borderTopColor: "var(--interactive)",
          }}
        />
        <div
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Grading your quiz...
        </div>
      </div>
    );
  }

  // Results phase
  if (phase === "results") {
    return (
      <QuizResults
        score={finalScore}
        total={results.length || questions.length}
        answers={results}
        onTryAgain={handleRestart}
      />
    );
  }

  // Active quiz phase
  const currentQuestion = questions[currentIndex];
  const progressPercent =
    questions.length > 0
      ? ((currentIndex + (currentAnswer !== null ? 1 : 0)) / questions.length) *
        100
      : 0;

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
      <GradedQuestionRenderer
        key={currentQuestion.id}
        question={currentQuestion}
        onAnswer={handleAnswer}
        selectedAnswer={currentAnswer}
      />

      {/* Next / Finish button */}
      <button
        onClick={handleNext}
        disabled={currentAnswer === null}
        className="w-full py-3 rounded-lg text-base font-semibold transition-colors"
        style={{
          backgroundColor: "var(--interactive)",
          color: "var(--brand-contrast)",
          opacity: currentAnswer === null ? 0.5 : 1,
        }}
      >
        {currentIndex + 1 >= questions.length ? "Finish Quiz" : "Next"}
      </button>
    </div>
  );
}

/**
 * Renders a question without feedback — for graded mode.
 * Shows the question type component and allows selecting an answer,
 * but does not submit to the API or show correctness.
 */
function GradedQuestionRenderer({
  question,
  onAnswer,
  selectedAnswer,
}: {
  question: QuizQuestionClient;
  onAnswer: (answer: string) => void;
  selectedAnswer: string | null;
}) {
  return (
    <div>
      {question.topic_name && (
        <div className="mb-3">
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              backgroundColor: "var(--interactive-light)",
              color: "var(--interactive)",
            }}
          >
            {question.topic_name}
          </span>
          <span
            className="text-xs ml-2"
            style={{ color: "var(--text-muted)" }}
          >
            {question.difficulty}
          </span>
        </div>
      )}

      <div
        className="rounded-xl border p-5"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: selectedAnswer !== null
            ? "var(--interactive-border)"
            : "var(--border-light)",
        }}
      >
        {question.type === "multiple_choice" && question.options && (
          <MultipleChoiceQuestion
            text={question.text}
            options={question.options}
            onAnswer={onAnswer}
            disabled={false}
            selectedAnswer={selectedAnswer}
            correctAnswer={null}
          />
        )}

        {question.type === "true_false" && (
          <TrueFalseQuestion
            text={question.text}
            onAnswer={onAnswer}
            disabled={false}
            selectedAnswer={selectedAnswer}
            correctAnswer={null}
          />
        )}

        {(question.type === "photo_id" || question.type === "image_text") && (
          <ImageQuestion
            text={question.text}
            type={question.type as "photo_id" | "image_text"}
            imagePath={question.image_path}
            imageAlt={question.image_alt}
            options={question.options}
            onAnswer={onAnswer}
            disabled={false}
            selectedAnswer={selectedAnswer}
            correctAnswer={null}
          />
        )}

        {question.type === "labeled_diagram" && (
          <DiagramQuestion
            text={question.text}
            imagePath={question.image_path}
            imageAlt={question.image_alt}
            hotspots={
              question.hotspots as
                | { x: number; y: number; label: string }[]
                | null
            }
            options={question.options}
            onAnswer={onAnswer}
            disabled={false}
            selectedAnswer={selectedAnswer}
            correctAnswer={null}
          />
        )}
      </div>
    </div>
  );
}
