"use client";

import { useState, useRef, useTransition } from "react";
import { uploadImage } from "@/lib/actions/images";

const imageTypes = [
  { value: "diagram", label: "Diagram" },
  { value: "photo", label: "Photo" },
  { value: "reference", label: "Reference" },
] as const;

interface ImageUploaderProps {
  onClose: () => void;
}

export default function ImageUploader({ onClose }: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [type, setType] = useState("diagram");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(selectedFile: File | null) {
    if (!selectedFile) return;

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif",
    ];
    if (!allowed.includes(selectedFile.type)) {
      setError("Invalid file type. Allowed: JPG, PNG, WEBP, GIF, SVG, AVIF.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setError(null);
    setFile(selectedFile);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleSubmit() {
    if (!file) {
      setError("Please select a file.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("alt_text", altText);
    formData.set("type", type);

    startTransition(async () => {
      const result = await uploadImage(formData);
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

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors"
        style={{
          borderColor: dragOver
            ? "var(--interactive)"
            : "var(--border)",
          backgroundColor: dragOver
            ? "var(--interactive-light)"
            : "var(--surface-muted)",
        }}
      >
        {preview ? (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 max-w-full rounded-lg object-contain"
            />
            <p
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {file?.name} ({((file?.size || 0) / 1024).toFixed(1)} KB)
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setPreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="text-xs px-3 py-1 rounded-lg transition-colors"
              style={{
                backgroundColor: "var(--surface-muted)",
                color: "var(--text-tertiary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--error-bg)";
                e.currentTarget.style.color = "var(--error-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--surface-muted)";
                e.currentTarget.style.color = "var(--text-tertiary)";
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto mb-3"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--text-muted)" }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Drop an image here or click to browse
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              JPG, PNG, WEBP, GIF, SVG, AVIF -- Max 10MB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          className="hidden"
        />
      </div>

      {/* Alt text */}
      <div>
        <label className="block text-sm font-medium mb-1" style={labelStyle}>
          Alt Text
        </label>
        <input
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Describe the image..."
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
          style={inputStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>

      {/* Image type */}
      <div>
        <label className="block text-sm font-medium mb-1" style={labelStyle}>
          Image Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
          style={inputStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        >
          {imageTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
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
          disabled={isPending || !file}
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
          {isPending ? "Uploading..." : "Upload Image"}
        </button>
      </div>
    </div>
  );
}
