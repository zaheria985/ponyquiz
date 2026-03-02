import Anthropic from "@anthropic-ai/sdk";

export interface DraftQuestion {
  text: string;
  type:
    | "multiple_choice"
    | "true_false"
    | "flashcard_qa"
    | "flashcard_term"
    | "flashcard_image";
  options?: { text: string; isCorrect: boolean }[];
  answer?: string;
  topic?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  explanation?: string;
}

const SUPPORTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx === -1) return "";
  return filename.slice(idx).toLowerCase();
}

async function extractText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = getExtension(filename);

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported file type "${ext}". Supported: PDF, DOC, DOCX, TXT.`
    );
  }

  if (ext === ".txt") {
    return buffer.toString("utf-8");
  }

  if (ext === ".pdf") {
    const pdfParse = require("pdf-parse"); // CJS, lazy-loaded to avoid DOMMatrix crash
    const result = await pdfParse(buffer);
    return result.text;
  }

  // .doc or .docx
  const mammoth = require("mammoth"); // CJS, lazy-loaded
  const result = await mammoth.extractRawText({ buffer });
  return result.value as string;
}

const SYSTEM_PROMPT = `You are an expert educational content parser. Your job is to analyze document text and extract quiz questions from it.

For each question you identify, classify it as one of these types:
- "multiple_choice": A question with multiple answer options (one correct)
- "true_false": A statement that is either true or false
- "flashcard_qa": A question-and-answer pair suitable for flashcards
- "flashcard_term": A term/definition pair (term on front, definition on back)
- "flashcard_image": A question that references an image (use when text mentions a figure/diagram)

For each question, provide:
- "text": The question or term text
- "type": One of the types above
- "options": (only for multiple_choice) Array of { "text": string, "isCorrect": boolean } with exactly one correct
- "answer": (for all types except multiple_choice) The correct answer text
- "topic": A suggested topic/category name if you can determine one
- "difficulty": "beginner", "intermediate", or "advanced" based on the content complexity
- "explanation": A brief explanation of the correct answer if possible

Respond ONLY with a JSON array of question objects. Do not include any other text, markdown formatting, or code fences. Just the raw JSON array.

If the document doesn't contain any identifiable questions or educational content, return an empty array: []`;

/**
 * Attempt to parse structured Q/A text. Supports two formats:
 * 1. Q:/A: markers (case-insensitive)
 * 2. Numbered questions ending with ? followed by answer lines
 * Returns DraftQuestion[] if pattern detected, null otherwise (falls back to AI).
 */
// Matches Q:, Question:, q:, question: etc.
const Q_MARKER = /^\s*(q|question)\s*:/i;
// Matches A:, Answer:, a:, answer: etc.
const A_MARKER = /^\s*(a|answer)\s*:/i;

function stripQMarker(line: string): string {
  return line.replace(/^\s*(q|question)\s*:\s*/i, "").trim();
}

function stripAMarker(line: string): string {
  return line.replace(/^\s*(a|answer)\s*:\s*/i, "").trim();
}

function tryParseQAPairs(text: string): DraftQuestion[] | null {
  const lines = text.split(/\r?\n/);

  // Try Q:/A:/Question:/Answer: format first
  const qLineCount = lines.filter((l) => Q_MARKER.test(l)).length;
  if (qLineCount >= 2) {
    return parseQAMarkers(lines);
  }

  // Try numbered question format: "1. Question text" or "1) Question text"
  const numberedQCount = lines.filter((l) =>
    /^\s*\d+[\.\)]\s+\S/.test(l)
  ).length;
  if (numberedQCount >= 2) {
    return parseNumberedQuestions(lines);
  }

  return null;
}

function parseQAMarkers(lines: string[]): DraftQuestion[] | null {
  const questions: DraftQuestion[] = [];
  let currentQ = "";
  let currentA = "";
  let collectingA = false;

  for (const line of lines) {
    if (Q_MARKER.test(line)) {
      if (currentQ) {
        questions.push({
          text: currentQ,
          type: "flashcard_qa",
          answer: currentA.trim(),
          difficulty: "beginner",
        });
      }
      currentQ = stripQMarker(line);
      currentA = "";
      collectingA = false;
    } else if (A_MARKER.test(line)) {
      currentA = stripAMarker(line);
      collectingA = true;
    } else if (collectingA && line.trim()) {
      currentA += " " + line.trim();
    } else if (!collectingA && currentQ && line.trim()) {
      currentQ += " " + line.trim();
    }
  }

  if (currentQ) {
    questions.push({
      text: currentQ,
      type: "flashcard_qa",
      answer: currentA.trim(),
      difficulty: "beginner",
    });
  }

  return questions.length >= 2 ? questions : null;
}

function parseNumberedQuestions(lines: string[]): DraftQuestion[] | null {
  const questions: DraftQuestion[] = [];
  let currentQ = "";
  let currentA = "";

  for (const line of lines) {
    // Numbered line = new question (e.g. "1. What is..." or "23) Describe...")
    if (/^\s*\d+[\.\)]\s+\S/.test(line)) {
      // Flush previous pair
      if (currentQ) {
        questions.push({
          text: currentQ,
          type: "flashcard_qa",
          answer: currentA.trim(),
          difficulty: "beginner",
        });
      }
      currentQ = line.replace(/^\s*\d+[\.\)]\s*/, "").trim();
      currentA = "";
    } else if (currentQ && line.trim()) {
      // Non-numbered, non-empty line = answer content
      let cleaned = line.trim();
      // Strip Answer:/A: prefix
      if (A_MARKER.test(cleaned)) {
        cleaned = stripAMarker(cleaned);
      }
      // Strip leading emoji/star markers (⭐★✦✧●•◆▸►etc)
      cleaned = cleaned.replace(/^[\u2B50\u2605\u2606\u2726\u2727\u2728\u25CF\u2022\u25C6\u25B8\u25BA\uFE0F\u200D*\-•]+\s*/, "");
      currentA += (currentA ? " " : "") + cleaned;
    }
  }

  if (currentQ) {
    questions.push({
      text: currentQ,
      type: "flashcard_qa",
      answer: currentA.trim(),
      difficulty: "beginner",
    });
  }

  return questions.length >= 2 ? questions : null;
}

export async function parseDocument(
  buffer: Buffer,
  filename: string
): Promise<DraftQuestion[]> {
  // Extract text from the document
  const text = await extractText(buffer, filename);

  if (!text || text.trim().length === 0) {
    throw new Error("The document appears to be empty or could not be read.");
  }

  // Try plain-text Q/A parsing first — no API key needed
  const qaParsed = tryParseQAPairs(text);
  if (qaParsed) {
    return qaParsed;
  }

  // Send to Claude API for parsing
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Please set it in your environment variables."
    );
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please analyze the following document text and extract all quiz questions, flashcard content, and educational Q&A pairs you can identify:\n\n---\n${text}\n---`,
      },
    ],
  });

  // Extract the text content from the response
  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (!responseText.trim()) {
    throw new Error("AI returned an empty response.");
  }

  // Parse the JSON response — Claude sometimes wraps JSON in text or code fences
  let parsed: unknown;
  try {
    const text = responseText.trim();

    // Strategy 1: try direct parse
    try {
      parsed = JSON.parse(text);
    } catch {
      // Strategy 2: extract from markdown code fence
      const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
      if (fenceMatch) {
        parsed = JSON.parse(fenceMatch[1].trim());
      } else {
        // Strategy 3: find the first [ ... ] in the response
        const bracketStart = text.indexOf("[");
        const bracketEnd = text.lastIndexOf("]");
        if (bracketStart !== -1 && bracketEnd > bracketStart) {
          parsed = JSON.parse(text.slice(bracketStart, bracketEnd + 1));
        } else {
          throw new Error("No JSON array found");
        }
      }
    }
  } catch {
    throw new Error(
      "Failed to parse AI response as JSON. The document may be too complex."
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI response was not an array of questions.");
  }

  // Validate and normalize each question
  const questions: DraftQuestion[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object" || !item.text) {
      continue;
    }

    const validTypes = [
      "multiple_choice",
      "true_false",
      "flashcard_qa",
      "flashcard_term",
      "flashcard_image",
    ];
    const type = validTypes.includes(item.type) ? item.type : "flashcard_qa";

    const validDifficulties = ["beginner", "intermediate", "advanced"];
    const difficulty = validDifficulties.includes(item.difficulty)
      ? item.difficulty
      : undefined;

    const question: DraftQuestion = {
      text: String(item.text),
      type,
      topic: item.topic ? String(item.topic) : undefined,
      difficulty,
      explanation: item.explanation ? String(item.explanation) : undefined,
    };

    if (type === "multiple_choice" && Array.isArray(item.options)) {
      question.options = item.options
        .filter(
          (o: unknown) =>
            o && typeof o === "object" && "text" in o && "isCorrect" in o
        )
        .map((o: { text: string; isCorrect: boolean }) => ({
          text: String(o.text),
          isCorrect: Boolean(o.isCorrect),
        }));
      // Ensure at least one correct option
      const opts = question.options;
      if (opts && opts.length > 0 && !opts.some((o) => o.isCorrect)) {
        opts[0].isCorrect = true;
      }
    } else {
      question.answer = item.answer ? String(item.answer) : "";
    }

    questions.push(question);
  }

  return questions;
}
