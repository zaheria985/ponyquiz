import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SUBDIR_MAP: Record<string, string> = {
  diagram: "diagrams",
  photo: "photos",
  reference: "references",
};

export async function saveUploadedFile(
  file: File,
  imageType: string
): Promise<{ path: string } | { error: string }> {
  // Validate MIME type
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return {
      error: `Invalid file type "${file.type}". Allowed: JPG, PNG, WEBP, GIF, SVG, AVIF.`,
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File size exceeds 10MB limit." };
  }

  // Determine subdirectory
  const subdir = SUBDIR_MAP[imageType] || "references";
  const uuid = randomUUID();
  const filename = `${uuid}${ext}`;
  const relativePath = `/uploads/${subdir}/${filename}`;
  const absoluteDir = path.join(process.cwd(), "public", "uploads", subdir);
  const absolutePath = path.join(absoluteDir, filename);

  try {
    // Ensure directory exists
    await mkdir(absoluteDir, { recursive: true });

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    return { path: relativePath };
  } catch {
    return { error: "Failed to save file to disk." };
  }
}

export async function deleteUploadedFile(
  filePath: string
): Promise<{ success: true } | { error: string }> {
  const { unlink } = await import("fs/promises");
  const absolutePath = path.join(process.cwd(), "public", filePath);

  try {
    await unlink(absolutePath);
    return { success: true };
  } catch {
    // File may already be deleted; treat as success
    return { success: true };
  }
}
