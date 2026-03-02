"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/server/uploads";

const imageTypes = ["diagram", "photo", "reference"] as const;

const imageIdSchema = z.object({
  id: z.string().uuid("Invalid image ID"),
});

const imageMetaSchema = z.object({
  alt_text: z.string().max(500).optional().or(z.literal("")),
  type: z.enum(imageTypes),
});

const hotspotSchema = z.array(
  z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    label: z.string().min(1, "Label is required"),
  })
);

export async function uploadImage(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "No file provided." };
  }

  const parsed = imageMetaSchema.safeParse({
    alt_text: formData.get("alt_text"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { alt_text, type } = parsed.data;

  // Save file to disk
  const result = await saveUploadedFile(file, type);
  if ("error" in result) {
    return { error: result.error };
  }

  // Insert into database
  try {
    await pool.query(
      `INSERT INTO images (file_path, alt_text, type)
       VALUES ($1, $2, $3)`,
      [result.path, alt_text || null, type]
    );
  } catch {
    // Clean up the file if DB insert fails
    await deleteUploadedFile(result.path);
    return { error: "Failed to save image record." };
  }

  revalidatePath("/admin/images");
  return { success: true };
}

export async function updateImage(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const idParsed = imageIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) {
    return { error: "Invalid image ID." };
  }

  const parsed = imageMetaSchema.safeParse({
    alt_text: formData.get("alt_text"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { id } = idParsed.data;
  const { alt_text, type } = parsed.data;

  try {
    const res = await pool.query(
      `UPDATE images SET alt_text = $1, type = $2 WHERE id = $3`,
      [alt_text || null, type, id]
    );
    if (res.rowCount === 0) {
      return { error: "Image not found." };
    }
  } catch {
    return { error: "Failed to update image." };
  }

  revalidatePath("/admin/images");
  return { success: true };
}

export async function updateHotspots(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const idParsed = imageIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) {
    return { error: "Invalid image ID." };
  }

  let hotspots: unknown;
  try {
    hotspots = JSON.parse(formData.get("hotspots") as string);
  } catch {
    return { error: "Invalid hotspots data." };
  }

  const parsed = hotspotSchema.safeParse(hotspots);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid hotspots." };
  }

  const { id } = idParsed.data;

  try {
    const res = await pool.query(
      `UPDATE images SET hotspots = $1 WHERE id = $2`,
      [JSON.stringify(parsed.data), id]
    );
    if (res.rowCount === 0) {
      return { error: "Image not found." };
    }
  } catch {
    return { error: "Failed to update hotspots." };
  }

  revalidatePath("/admin/images");
  return { success: true };
}

export async function deleteImage(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = imageIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: "Invalid image ID." };
  }

  const { id } = parsed.data;

  // Check if any questions reference this image
  const questionCheck = await pool.query(
    "SELECT COUNT(*) FROM questions WHERE image_id = $1",
    [id]
  );

  if (parseInt(questionCheck.rows[0].count, 10) > 0) {
    return {
      error: "Cannot delete image: it is referenced by existing questions.",
    };
  }

  // Get the file path before deleting
  const imageRow = await pool.query(
    "SELECT file_path FROM images WHERE id = $1",
    [id]
  );
  if (imageRow.rowCount === 0) {
    return { error: "Image not found." };
  }

  const filePath = imageRow.rows[0].file_path;

  // Delete from database
  try {
    await pool.query("DELETE FROM images WHERE id = $1", [id]);
  } catch {
    return { error: "Failed to delete image." };
  }

  // Delete file from disk
  await deleteUploadedFile(filePath);

  revalidatePath("/admin/images");
  return { success: true };
}
