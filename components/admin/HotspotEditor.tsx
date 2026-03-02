"use client";

import { useState, useRef, useTransition } from "react";
import { updateHotspots } from "@/lib/actions/images";
import type { Image } from "@/lib/queries/images";

interface HotspotEditorProps {
  image: Image;
  onClose: () => void;
}

interface Hotspot {
  x: number;
  y: number;
  label: string;
}

export default function HotspotEditor({ image, onClose }: HotspotEditorProps) {
  const [hotspots, setHotspots] = useState<Hotspot[]>(
    image.hotspots || []
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const imageRef = useRef<HTMLDivElement>(null);

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setHotspots((prev) => [
      ...prev,
      { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, label: "" },
    ]);
  }

  function updateLabel(index: number, label: string) {
    setHotspots((prev) =>
      prev.map((h, i) => (i === index ? { ...h, label } : h))
    );
  }

  function removeHotspot(index: number) {
    setHotspots((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    // Validate all hotspots have labels
    const emptyLabel = hotspots.find((h) => !h.label.trim());
    if (emptyLabel) {
      setError("All hotspots must have a label.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("id", image.id);
    formData.set("hotspots", JSON.stringify(hotspots));

    startTransition(async () => {
      const result = await updateHotspots(formData);
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

  function handleInputFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "var(--input-focus-ring)";
  }

  function handleInputBlur(e: React.FocusEvent<HTMLInputElement>) {
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

      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
        Click on the image to place a hotspot marker. Add labels below.
      </p>

      {/* Image with hotspot markers */}
      <div
        ref={imageRef}
        className="relative w-full cursor-crosshair rounded-lg overflow-hidden border"
        style={{ borderColor: "var(--border-light)" }}
        onClick={handleImageClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.file_path}
          alt={image.alt_text || "Image"}
          className="w-full block"
          draggable={false}
        />
        {hotspots.map((h, i) => (
          <div
            key={i}
            className="absolute w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${h.x}%`,
              top: `${h.y}%`,
              backgroundColor: "var(--interactive)",
              borderColor: "var(--brand-contrast)",
              color: "var(--brand-contrast)",
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Hotspot list */}
      {hotspots.length > 0 && (
        <div className="space-y-2">
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Hotspots ({hotspots.length})
          </p>
          {hotspots.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: "var(--interactive)",
                  color: "var(--brand-contrast)",
                }}
              >
                {i + 1}
              </span>
              <input
                type="text"
                value={h.label}
                onChange={(e) => updateLabel(i, e.target.value)}
                placeholder="Enter label..."
                className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <span
                className="text-xs shrink-0"
                style={{ color: "var(--text-muted)" }}
              >
                ({h.x.toFixed(1)}%, {h.y.toFixed(1)}%)
              </span>
              <button
                onClick={() => removeHotspot(i)}
                className="shrink-0 px-2 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "var(--surface-muted)",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--error-bg)";
                  e.currentTarget.style.color = "var(--error-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--surface-muted)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {hotspots.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
          No hotspots yet. Click on the image to add one.
        </p>
      )}

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
          onClick={handleSave}
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
          {isPending ? "Saving..." : "Save Hotspots"}
        </button>
      </div>
    </div>
  );
}
