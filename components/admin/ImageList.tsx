"use client";

import { useState, useTransition } from "react";
import { deleteImage, updateImage } from "@/lib/actions/images";
import type { Image } from "@/lib/queries/images";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import ImageUploader from "@/components/admin/ImageUploader";
import HotspotEditor from "@/components/admin/HotspotEditor";

const typeVariant: Record<string, "primary" | "success" | "warning"> = {
  diagram: "primary",
  photo: "success",
  reference: "warning",
};

interface ImageListProps {
  initialImages: Image[];
}

export default function ImageList({ initialImages }: ImageListProps) {
  const [filterType, setFilterType] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<Image | null>(null);
  const [hotspotImage, setHotspotImage] = useState<Image | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Edit form state
  const [editAltText, setEditAltText] = useState("");
  const [editType, setEditType] = useState("");

  const filtered = initialImages.filter((img) => {
    if (filterType && img.type !== filterType) return false;
    return true;
  });

  function openEdit(image: Image) {
    setEditingImage(image);
    setEditAltText(image.alt_text || "");
    setEditType(image.type);
  }

  function closeEdit() {
    setEditingImage(null);
    setEditAltText("");
    setEditType("");
  }

  function handleUpdate() {
    if (!editingImage) return;
    setError(null);

    const formData = new FormData();
    formData.set("id", editingImage.id);
    formData.set("alt_text", editAltText);
    formData.set("type", editType);

    startTransition(async () => {
      const result = await updateImage(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        closeEdit();
      }
    });
  }

  function handleDelete(image: Image) {
    const preview = image.alt_text || image.file_path;
    const label =
      preview.length > 50 ? preview.slice(0, 50) + "..." : preview;
    if (!confirm(`Delete image "${label}"? This cannot be undone.`)) return;
    setError(null);

    const formData = new FormData();
    formData.set("id", image.id);

    startTransition(async () => {
      const result = await deleteImage(formData);
      if ("error" in result) {
        setError(result.error);
      }
    });
  }

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--input-text)",
  };

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
    <div>
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

      {/* Filters + Upload button */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm outline-none"
          style={inputStyle}
        >
          <option value="">All Types</option>
          <option value="diagram">Diagram</option>
          <option value="photo">Photo</option>
          <option value="reference">Reference</option>
        </select>

        <div className="sm:ml-auto">
          <button
            onClick={() => setUploadOpen(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
            + Upload Image
          </button>
        </div>
      </div>

      {/* Image count */}
      <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
        {filtered.length} image{filtered.length !== 1 ? "s" : ""}
        {filterType ? " (filtered)" : ""}
      </p>

      {/* Image grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No images found"
          description={
            filterType
              ? "Try adjusting your filter."
              : "Upload your first image to get started."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((img) => (
            <div
              key={img.id}
              className="rounded-card border overflow-hidden shadow-card transition-shadow hover:shadow-card-lg"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-light)",
              }}
            >
              {/* Thumbnail */}
              <div
                className="aspect-video relative overflow-hidden cursor-pointer"
                style={{ backgroundColor: "var(--surface-muted)" }}
                onClick={() => openEdit(img)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.file_path}
                  alt={img.alt_text || "Image"}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card info */}
              <div className="px-4 py-3">
                <p
                  className="text-sm truncate mb-2"
                  style={{ color: "var(--text-primary)" }}
                  title={img.alt_text || img.file_path}
                >
                  {img.alt_text || "No alt text"}
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={typeVariant[img.type] || "default"}>
                    {img.type}
                  </Badge>
                  {(img.question_count ?? 0) > 0 && (
                    <Badge variant="default">
                      {img.question_count} question
                      {img.question_count !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {(img.hotspots?.length ?? 0) > 0 && (
                    <Badge variant="info">
                      {img.hotspots.length} hotspot
                      {img.hotspots.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(img)}
                    className="px-2 py-1 rounded text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--surface-muted)",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--interactive-light)";
                      e.currentTarget.style.color = "var(--interactive)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--surface-muted)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setHotspotImage(img)}
                    className="px-2 py-1 rounded text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--surface-muted)",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--interactive-light)";
                      e.currentTarget.style.color = "var(--interactive)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--surface-muted)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    Hotspots
                  </button>
                  <button
                    onClick={() => handleDelete(img)}
                    disabled={isPending}
                    className="px-2 py-1 rounded text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--surface-muted)",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--error-bg)";
                      e.currentTarget.style.color = "var(--error-text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--surface-muted)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(img.id);
                    }}
                    className="ml-auto px-2 py-1 rounded text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--surface-muted)",
                      color: "var(--text-muted)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--interactive-light)";
                      e.currentTarget.style.color = "var(--interactive)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--surface-muted)";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                    title="Copy image ID for use in questions"
                  >
                    Copy ID
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Image"
      >
        <ImageUploader onClose={() => setUploadOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editingImage}
        onClose={closeEdit}
        title="Edit Image"
      >
        {editingImage && (
          <div className="space-y-4">
            {/* Preview */}
            <div
              className="rounded-lg overflow-hidden border"
              style={{ borderColor: "var(--border-light)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={editingImage.file_path}
                alt={editingImage.alt_text || "Image"}
                className="w-full max-h-48 object-contain"
                style={{ backgroundColor: "var(--surface-muted)" }}
              />
            </div>

            {/* ID display */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Image ID
              </label>
              <p
                className="text-xs font-mono px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: "var(--surface-muted)",
                  color: "var(--text-tertiary)",
                }}
              >
                {editingImage.id}
              </p>
            </div>

            {/* Alt text */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Alt Text
              </label>
              <input
                type="text"
                value={editAltText}
                onChange={(e) => setEditAltText(e.target.value)}
                placeholder="Describe the image..."
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            {/* Type */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Image Type
              </label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              >
                <option value="diagram">Diagram</option>
                <option value="photo">Photo</option>
                <option value="reference">Reference</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeEdit}
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
              <button
                onClick={handleUpdate}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
                {isPending ? "Saving..." : "Update Image"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hotspot editor modal */}
      <Modal
        open={!!hotspotImage}
        onClose={() => setHotspotImage(null)}
        title="Edit Hotspots"
      >
        {hotspotImage && (
          <HotspotEditor
            image={hotspotImage}
            onClose={() => setHotspotImage(null)}
          />
        )}
      </Modal>
    </div>
  );
}
