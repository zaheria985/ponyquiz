"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import {
  parseDocument as parseDocumentFromFile,
  type DraftQuestion,
} from "@/lib/server/document-parser";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx === -1) return "";
  return filename.slice(idx).toLowerCase();
}

export async function parseDocument(
  formData: FormData
): Promise<{ success: true; data: DraftQuestion[] } | { error: string }> {
  const file = formData.get("file") as File | null;

  if (!file || !(file instanceof File)) {
    return { error: "No file provided." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "File size exceeds 100MB limit." };
  }

  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      error: `Unsupported file type "${ext}". Supported: PDF, DOC, DOCX, TXT.`,
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const questions = await parseDocumentFromFile(buffer, file.name);

    if (questions.length === 0) {
      return {
        error:
          "No questions could be extracted from the document. The content may not contain identifiable quiz material.",
      };
    }

    return { success: true, data: questions };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to parse document.";
    return { error: message };
  }
}

const questionTypes = [
  "multiple_choice",
  "true_false",
  "flashcard_qa",
  "flashcard_term",
  "flashcard_image",
] as const;

const difficulties = ["beginner", "intermediate", "advanced"] as const;

const draftQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: z.enum(questionTypes),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean(),
      })
    )
    .optional()
    .nullable(),
  answer: z.string().optional().nullable(),
  topic_id: z.string().uuid().optional().nullable().or(z.literal("")),
  topic_name: z.string().optional().nullable().or(z.literal("")),
  page_reference: z.string().max(200).optional().nullable().or(z.literal("")),
  difficulty: z.enum(difficulties),
  explanation: z.string().optional().nullable().or(z.literal("")),
});

export async function saveDraftQuestions(
  formData: FormData
): Promise<{ success: true; data: { count: number } } | { error: string }> {
  const questionsJson = formData.get("questions") as string;

  if (!questionsJson) {
    return { error: "No questions provided." };
  }

  let rawQuestions: unknown[];
  try {
    rawQuestions = JSON.parse(questionsJson);
  } catch {
    return { error: "Invalid questions data." };
  }

  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return { error: "No questions to import." };
  }

  // Validate each question with Zod
  const validQuestions: z.infer<typeof draftQuestionSchema>[] = [];
  for (let i = 0; i < rawQuestions.length; i++) {
    const parsed = draftQuestionSchema.safeParse(rawQuestions[i]);
    if (!parsed.success) {
      return {
        error: `Question ${i + 1}: ${parsed.error.issues[0]?.message || "Invalid data."}`,
      };
    }
    validQuestions.push(parsed.data);
  }

  // Log what we're about to save for debugging
  const topicNames = validQuestions.map((q) => q.topic_name).filter(Boolean);
  console.log(`[Import] Saving ${validQuestions.length} questions. Topics found: [${topicNames.join(", ")}]`);

  // Bulk insert using parameterized SQL
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Auto-create topics: collect unique topic names that need IDs
    const topicNameToId = new Map<string, string>();
    for (const q of validQuestions) {
      if (q.topic_id) continue; // already has an ID
      const name = q.topic_name?.trim();
      if (!name) continue;
      if (topicNameToId.has(name.toLowerCase())) continue;

      // Check if topic already exists (case-insensitive)
      const existing = await client.query(
        "SELECT id FROM topics WHERE LOWER(name) = LOWER($1)",
        [name]
      );
      if (existing.rowCount && existing.rowCount > 0) {
        topicNameToId.set(name.toLowerCase(), existing.rows[0].id);
        console.log(`[Import] Topic "${name}" already exists (id: ${existing.rows[0].id})`);
      } else {
        // Create new topic
        const inserted = await client.query(
          "INSERT INTO topics (name) VALUES ($1) RETURNING id",
          [name]
        );
        topicNameToId.set(name.toLowerCase(), inserted.rows[0].id);
        console.log(`[Import] Created topic "${name}" (id: ${inserted.rows[0].id})`);
      }
    }

    let inserted = 0;
    for (const q of validQuestions) {
      let options: string | null = null;
      let answer: string | null = q.answer || null;

      if (q.type === "multiple_choice" && q.options) {
        options = JSON.stringify(q.options);
        answer = null;
      }

      // Resolve topic ID: use explicit ID, or look up from auto-created map
      let topicId = q.topic_id || null;
      if (!topicId && q.topic_name?.trim()) {
        topicId = topicNameToId.get(q.topic_name.trim().toLowerCase()) || null;
      }

      await client.query(
        `INSERT INTO questions (text, type, topic_id, difficulty, explanation, options, answer, page_reference)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          q.text,
          q.type,
          topicId,
          q.difficulty,
          q.explanation || null,
          options,
          answer,
          q.page_reference || null,
        ]
      );
      inserted++;
    }

    await client.query("COMMIT");

    revalidatePath("/admin/questions");
    revalidatePath("/admin/topics");
    revalidatePath("/admin/import");

    return { success: true, data: { count: inserted } };
  } catch (err) {
    await client.query("ROLLBACK");
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Import] Save failed:", msg);
    return { error: `Failed to save questions: ${msg}` };
  } finally {
    client.release();
  }
}
