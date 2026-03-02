"use client";

import { useState, useEffect, useCallback } from "react";
import FlashcardCard from "@/components/flashcards/FlashcardCard";
import TopicPicker from "@/components/flashcards/TopicPicker";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";

interface Flashcard {
  id: string;
  text: string;
  type: "flashcard_qa" | "flashcard_term" | "flashcard_image" | "labeled_diagram";
  topic_id: string | null;
  topic_name: string | null;
  answer: string | null;
  image_path: string | null;
  image_alt: string | null;
  hotspots: { x: number; y: number; label: string }[] | null;
  status: "got_it" | "still_learning" | null;
  review_count: number;
}

interface TopicOption {
  id: string | null;
  name: string;
  count: number;
}

interface FlashcardViewerProps {
  topics: TopicOption[];
}

export default function FlashcardViewer({
  topics,
}: FlashcardViewerProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animating, setAnimating] = useState(true);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<{ got_it: number; still_learning: number }>({
    got_it: 0,
    still_learning: 0,
  });
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchFlashcards = useCallback(async () => {
    setLoading(true);
    setCurrentIndex(0);
    setFlipped(false);
    setAnswered(false);
    setFinished(false);
    setResults({ got_it: 0, still_learning: 0 });

    try {
      const url = selectedTopicId
        ? `/api/flashcards?topic=${selectedTopicId}`
        : "/api/flashcards";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data.flashcards || []);
      } else {
        setFlashcards([]);
      }
    } catch {
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTopicId]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const currentCard = flashcards[currentIndex];
  const total = flashcards.length;
  const progressPercent = total > 0 ? ((currentIndex) / total) * 100 : 0;

  async function handleResponse(status: "got_it" | "still_learning") {
    if (!currentCard || submitting) return;

    setSubmitting(true);
    setResults((prev) => ({
      ...prev,
      [status]: prev[status] + 1,
    }));

    try {
      await fetch("/api/flashcards/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: currentCard.id,
          status,
        }),
      });
    } catch {
      // Progress update failed silently; do not block the user
    }

    setSubmitting(false);

    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      // Disable flip animation so the new card appears instantly without
      // the back face (answer) flashing during a CSS rotation.
      setAnimating(false);
      setCurrentIndex((prev) => prev + 1);
      setFlipped(false);
      setAnswered(false);
      // Re-enable after the browser paints the new card in its unflipped state.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true);
        });
      });
    }
  }

  function handleFlip() {
    if (!answered) {
      setFlipped((prev) => !prev);
      if (!flipped) {
        setAnswered(true);
      }
    }
  }

  function handleRestart() {
    fetchFlashcards();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <TopicPicker
          topics={topics}
          selectedTopicId={selectedTopicId}
          onSelect={setSelectedTopicId}
        />
        <div className="flex items-center justify-center py-16">
          <div
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Loading flashcards...
          </div>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="space-y-6">
        <TopicPicker
          topics={topics}
          selectedTopicId={selectedTopicId}
          onSelect={setSelectedTopicId}
        />
        <EmptyState
          icon={<CardsEmptyIcon />}
          title="No flashcards available"
          description={
            selectedTopicId
              ? "There are no flashcards for this topic yet. Try selecting a different topic."
              : "There are no flashcards available yet. Check back later!"
          }
        />
      </div>
    );
  }

  if (finished) {
    const totalAnswered = results.got_it + results.still_learning;
    const gotItPercent = totalAnswered > 0 ? Math.round((results.got_it / totalAnswered) * 100) : 0;

    return (
      <div className="space-y-6">
        <TopicPicker
          topics={topics}
          selectedTopicId={selectedTopicId}
          onSelect={setSelectedTopicId}
        />
        <div
          className="max-w-lg mx-auto rounded-xl border p-8 text-center"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border-light)",
          }}
        >
          <div className="text-4xl mb-3">
            {gotItPercent >= 80 ? (
              <span role="img" aria-label="Star">&#11088;</span>
            ) : gotItPercent >= 50 ? (
              <span role="img" aria-label="Thumbs up">&#128077;</span>
            ) : (
              <span role="img" aria-label="Books">&#128218;</span>
            )}
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Session Complete!
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            You reviewed {totalAnswered} {totalAnswered === 1 ? "card" : "cards"}
          </p>

          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--success-text)" }}
              >
                {results.got_it}
              </div>
              <div
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Got it
              </div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--warning-text)" }}
              >
                {results.still_learning}
              </div>
              <div
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Still learning
              </div>
            </div>
          </div>

          <ProgressBar value={gotItPercent} color="var(--success-solid)" className="mb-6" />

          <button
            onClick={handleRestart}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--interactive)",
              color: "var(--brand-contrast)",
            }}
          >
            Study Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TopicPicker
        topics={topics}
        selectedTopicId={selectedTopicId}
        onSelect={setSelectedTopicId}
      />

      {/* Progress indicator */}
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Card {currentIndex + 1} of {total}
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

      {/* Flashcard */}
      {currentCard && (
        <FlashcardCard
          type={currentCard.type}
          question={currentCard.text}
          answer={currentCard.answer || ""}
          imagePath={currentCard.image_path}
          imageAlt={currentCard.image_alt}
          hotspots={currentCard.hotspots}
          flipped={flipped}
          animate={animating}
          onFlip={handleFlip}
        />
      )}

      {/* Response buttons (visible after flipping) */}
      <div
        className="flex justify-center gap-4 transition-opacity duration-300"
        style={{ opacity: answered && flipped ? 1 : 0, pointerEvents: answered && flipped ? "auto" : "none" }}
      >
        <button
          onClick={() => handleResponse("still_learning")}
          disabled={submitting}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
          style={{
            backgroundColor: "var(--warning-bg)",
            borderColor: "var(--warning-border)",
            color: "var(--warning-text)",
          }}
        >
          Still Learning
        </button>
        <button
          onClick={() => handleResponse("got_it")}
          disabled={submitting}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
          style={{
            backgroundColor: "var(--success-bg)",
            borderColor: "var(--success-border)",
            color: "var(--success-text)",
          }}
        >
          Got It
        </button>
      </div>
    </div>
  );
}

function CardsEmptyIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="16" height="16" rx="2" />
      <path d="M6 2h12a2 2 0 0 1 2 2v12" />
    </svg>
  );
}
