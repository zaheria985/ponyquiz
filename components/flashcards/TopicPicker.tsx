"use client";

interface TopicOption {
  id: string | null;
  name: string;
  count: number;
}

interface TopicPickerProps {
  topics: TopicOption[];
  selectedTopicId: string | null;
  onSelect: (topicId: string | null) => void;
}

export default function TopicPicker({
  topics,
  selectedTopicId,
  onSelect,
}: TopicPickerProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {topics.map((topic) => {
        const isSelected = selectedTopicId === topic.id;
        return (
          <button
            key={topic.id ?? "all"}
            onClick={() => onSelect(topic.id)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border"
            style={{
              backgroundColor: isSelected
                ? "var(--interactive)"
                : "var(--surface)",
              color: isSelected
                ? "var(--brand-contrast)"
                : "var(--text-secondary)",
              borderColor: isSelected
                ? "var(--interactive)"
                : "var(--border-light)",
            }}
          >
            <span>{topic.name}</span>
            <span
              className="text-xs rounded-full px-1.5 py-0.5"
              style={{
                backgroundColor: isSelected
                  ? "rgba(255,255,255,0.2)"
                  : "var(--surface-muted)",
                color: isSelected
                  ? "var(--brand-contrast)"
                  : "var(--text-muted)",
              }}
            >
              {topic.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
