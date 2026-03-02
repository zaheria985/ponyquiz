"use client";

import { useState } from "react";
import MultipleChoiceQuestion from "@/components/quiz/MultipleChoiceQuestion";
import TrueFalseQuestion from "@/components/quiz/TrueFalseQuestion";
import ImageQuestion from "@/components/quiz/ImageQuestion";
import DiagramQuestion from "@/components/quiz/DiagramQuestion";
import FeedbackCard from "@/components/quiz/FeedbackCard";

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

interface FeedbackData {
  correct: boolean;
  explanation: string | null;
  correctAnswer: string;
}

interface QuestionRendererProps {
  question: QuizQuestionClient;
  attemptId: string;
  onNext: () => void;
  isLast: boolean;
}

export default function QuestionRenderer({
  question,
  attemptId,
  onNext,
  isLast,
}: QuestionRendererProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAnswer(answer: string) {
    if (submitting || selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    setSubmitting(true);

    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          questionId: question.id,
          selectedAnswer: answer,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback({
          correct: data.correct,
          explanation: data.explanation,
          correctAnswer: data.correctAnswer,
        });
      } else {
        setFeedback({
          correct: false,
          explanation: "Failed to check answer. Please try again.",
          correctAnswer: "",
        });
      }
    } catch {
      setFeedback({
        correct: false,
        explanation: "Network error. Please try again.",
        correctAnswer: "",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isAnswered = selectedAnswer !== null;

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
          borderColor: "var(--border-light)",
        }}
      >
        {question.type === "multiple_choice" && question.options && (
          <MultipleChoiceQuestion
            text={question.text}
            options={question.options}
            onAnswer={handleAnswer}
            disabled={isAnswered}
            selectedAnswer={selectedAnswer}
            correctAnswer={feedback?.correctAnswer || null}
          />
        )}

        {question.type === "true_false" && (
          <TrueFalseQuestion
            text={question.text}
            onAnswer={handleAnswer}
            disabled={isAnswered}
            selectedAnswer={selectedAnswer}
            correctAnswer={feedback?.correctAnswer || null}
          />
        )}

        {(question.type === "photo_id" || question.type === "image_text") && (
          <ImageQuestion
            text={question.text}
            type={question.type as "photo_id" | "image_text"}
            imagePath={question.image_path}
            imageAlt={question.image_alt}
            options={question.options}
            onAnswer={handleAnswer}
            disabled={isAnswered}
            selectedAnswer={selectedAnswer}
            correctAnswer={feedback?.correctAnswer || null}
          />
        )}

        {question.type === "labeled_diagram" && (
          <DiagramQuestion
            text={question.text}
            imagePath={question.image_path}
            imageAlt={question.image_alt}
            hotspots={question.hotspots as { x: number; y: number; label: string }[] | null}
            options={question.options}
            onAnswer={handleAnswer}
            disabled={isAnswered}
            selectedAnswer={selectedAnswer}
            correctAnswer={feedback?.correctAnswer || null}
          />
        )}

        {submitting && (
          <div
            className="mt-4 text-sm text-center"
            style={{ color: "var(--text-muted)" }}
          >
            Checking answer...
          </div>
        )}
      </div>

      {feedback && (
        <FeedbackCard
          correct={feedback.correct}
          correctAnswer={feedback.correctAnswer}
          explanation={feedback.explanation}
          onNext={onNext}
          isLast={isLast}
        />
      )}
    </div>
  );
}
