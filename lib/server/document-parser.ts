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
  pageReference?: string;
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
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value as string;
    if (!text || text.trim().length === 0) {
      throw new Error(
        `Could not extract text from "${ext}" file. Try saving as .docx or .txt instead.`
      );
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.message.includes("Try saving")) throw err;
    throw new Error(
      `Failed to read "${ext}" file. Try saving as .docx or .txt instead.`
    );
  }
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

// Matches T:, Topic:, topic: etc.
const TOPIC_MARKER = /^\s*(t|topic)\s*:/i;
// Matches S:, Source:, Page:, Page Reference:, Ref: etc.
const SOURCE_MARKER = /^\s*(s|source|page|page\s*ref(?:erence)?|ref)\s*:/i;
// Matches L:, Level:, Difficulty: etc.
const LEVEL_MARKER = /^\s*(l|level|difficulty)\s*:/i;

function stripQMarker(line: string): string {
  return line.replace(/^\s*(q|question)\s*:\s*/i, "").trim();
}

function stripAMarker(line: string): string {
  return line.replace(/^\s*(a|answer)\s*:\s*/i, "").trim();
}

function stripTopicMarker(line: string): string {
  return line.replace(/^\s*(t|topic)\s*:\s*/i, "").trim();
}

function stripSourceMarker(line: string): string {
  return line.replace(/^\s*(s|source|page|page\s*ref(?:erence)?|ref)\s*:\s*/i, "").trim();
}

function stripLevelMarker(line: string): string {
  return line.replace(/^\s*(l|level|difficulty)\s*:\s*/i, "").trim();
}

/** Map letter grades (D/C/B/A) or level names to difficulty */
function parseDifficulty(raw: string): "beginner" | "intermediate" | "advanced" {
  const val = raw.trim().toLowerCase();
  if (val === "d" || val === "beginner") return "beginner";
  if (val === "c" || val === "intermediate") return "intermediate";
  if (val === "b" || val === "a" || val === "advanced") return "advanced";
  return "beginner";
}

function tryParseQAPairs(text: string): DraftQuestion[] | null {
  // Normalize whitespace: collapse runs of 3+ blank lines into 2, trim trailing spaces
  let normalized = text.replace(/[ \t]+$/gm, "").replace(/(\r?\n){4,}/g, "\n\n\n");

  // Insert line breaks before known markers so they're on separate lines.
  // .docx extraction often puts Q: A: T: S: L: on the same line/paragraph.
  normalized = normalized.replace(
    /(?<=\S[ \t]+)\b(Q|A|T|S|L|Question|Answer|Topic|Source|Level|Difficulty|Page|Ref)\s*:/gi,
    "\n$1:"
  );

  const lines = normalized.split(/\r?\n/);

  // Try Q:/A:/Question:/Answer: format first
  const qLineCount = lines.filter((l) => Q_MARKER.test(l)).length;
  if (qLineCount >= 2) {
    const result = parseQAMarkers(lines);
    if (result) {
      console.log(`[Q/A Parser] Parsed ${result.length} questions. First:`, JSON.stringify(result[0]));
    }
    return result;
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

/** Section header lines to skip (e.g., "--- MULTIPLE CHOICE ---", "=== END OF CHAPTER 1 ===") */
const SECTION_HEADER = /^\s*[-=]{3,}\s*.+\s*[-=]{3,}\s*$/;

/**
 * Detect question type and extract structured data from raw Q/A text.
 * Returns the type, cleaned question text, options (for MC), answer, and explanation.
 */
function detectQuestionType(
  rawQuestion: string,
  rawAnswer: string
): {
  type: DraftQuestion["type"];
  text: string;
  options?: DraftQuestion["options"];
  answer?: string;
  explanation?: string;
} {
  let text = rawQuestion.trim();
  let answer = rawAnswer.trim();
  let explanation: string | undefined;

  // 1. True/False: question starts with "True or False:" or "T/F:"
  const tfPrefix = text.match(/^(?:True\s+or\s+False|T\s*\/\s*F)\s*:\s*/i);
  if (tfPrefix) {
    text = text.slice(tfPrefix[0].length).trim();
    // Parse answer: "False — it started in England" → answer: "False", explanation: rest
    const tfAnswer = answer.match(/^(True|False)\b\s*(?:[—–\-:,.]?\s*(.+))?$/i);
    if (tfAnswer) {
      answer = tfAnswer[1].charAt(0).toUpperCase() + tfAnswer[1].slice(1).toLowerCase();
      if (tfAnswer[2]?.trim()) {
        explanation = tfAnswer[2].trim();
      }
    }
    return { type: "true_false", text, answer, explanation };
  }

  // 2. Multiple Choice with inline (a)/(b)/(c)/(d) options in the question text
  const inlineOptions = [...text.matchAll(/\(([a-z])\)\s+([^(]+?)(?=\s*\([a-z]\)\s|$)/gi)];
  if (inlineOptions.length >= 2) {
    // Strip the options from the question text
    const firstOptionIdx = text.indexOf(inlineOptions[0][0]);
    const cleanedQ = text.slice(0, firstOptionIdx).trim();
    if (cleanedQ) text = cleanedQ;

    // Parse the answer: "(b) English" → letter "b", text "English"
    const answerLetterMatch = answer.match(/^\(([a-z])\)\s*/i);
    let correctLetter = "";
    let correctText = answer;
    if (answerLetterMatch) {
      correctLetter = answerLetterMatch[1].toLowerCase();
      correctText = answer.slice(answerLetterMatch[0].length).trim();
    }
    // Strip explanation after dash/semicolon in answer
    const explMatch = correctText.match(/^(.+?)\s*[—–;]\s+(.+)$/);
    if (explMatch) {
      correctText = explMatch[1].trim();
      explanation = explMatch[2].trim();
    }

    const options = inlineOptions.map((m) => ({
      text: m[2].trim(),
      isCorrect: correctLetter
        ? m[1].toLowerCase() === correctLetter
        : m[2].trim().toLowerCase() === correctText.toLowerCase(),
    }));

    // Ensure at least one correct answer
    if (!options.some((o) => o.isCorrect)) {
      const best = options.find(
        (o) =>
          correctText.toLowerCase().includes(o.text.toLowerCase()) ||
          o.text.toLowerCase().includes(correctText.toLowerCase())
      );
      if (best) best.isCorrect = true;
      else if (options.length > 0) options[0].isCorrect = true;
    }

    return { type: "multiple_choice", text, options, explanation };
  }

  // 3. Fill-in-the-Blank with word bank: "(Word bank: X, Y, Z)" at end of question
  const wordBankMatch = text.match(/\(?\s*Word\s+bank\s*:\s*(.+?)\)?\s*$/i);
  if (wordBankMatch) {
    text = text.slice(0, text.indexOf(wordBankMatch[0])).trim();
    const bankItems = wordBankMatch[1].split(/\s*,\s*/);
    const options = bankItems
      .filter((item) => item.trim())
      .map((item) => ({
        text: item.trim(),
        isCorrect: item.trim().toLowerCase() === answer.toLowerCase(),
      }));

    if (!options.some((o) => o.isCorrect)) {
      const best = options.find(
        (o) =>
          answer.toLowerCase().includes(o.text.toLowerCase()) ||
          o.text.toLowerCase().includes(answer.toLowerCase())
      );
      if (best) best.isCorrect = true;
    }

    if (options.length >= 2) {
      return { type: "multiple_choice", text, options };
    }
  }

  // 4. This-or-That: "Mare or stallion: Which is a female horse?"
  // Pattern: option text " or " option text ": " question text
  // Uses lazy matching to support hyphens, apostrophes, and multi-word options
  const thisOrThat = text.match(/^(.+?)\s+or\s+(.+?)\s*:\s*(.+)$/i);
  if (thisOrThat) {
    const opt1 = thisOrThat[1].trim();
    const opt2 = thisOrThat[2].trim();
    const questionBody = thisOrThat[3].trim();
    const answerLower = answer.toLowerCase().trim();
    const opt1Lower = opt1.toLowerCase();
    const opt2Lower = opt2.toLowerCase();
    // Match if answer equals or starts with one of the options
    // Handles answers like "Pommel (NOT the cantle)" matching option "Pommel"
    const matchesOpt1 =
      answerLower === opt1Lower || answerLower.startsWith(opt1Lower);
    const matchesOpt2 =
      answerLower === opt2Lower || answerLower.startsWith(opt2Lower);
    if (matchesOpt1 || matchesOpt2) {
      return {
        type: "multiple_choice",
        text: questionBody,
        options: [
          { text: opt1, isCorrect: matchesOpt1 },
          { text: opt2, isCorrect: matchesOpt2 },
        ],
      };
    }
  }

  // 5. Default: flashcard Q/A
  return { type: "flashcard_qa", text, answer };
}

function parseQAMarkers(lines: string[]): DraftQuestion[] | null {
  const questions: DraftQuestion[] = [];
  let currentQ = "";
  let currentA = "";
  let currentTopic = "";
  let currentSource = "";
  let currentLevel = "";
  type Field = "q" | "a" | "topic" | "source" | "level";
  let collecting: Field = "q";

  function flush() {
    if (currentQ) {
      // Fallback: extract inline T:/S:/L: markers from answer text if not parsed as lines
      let answer = currentA.trim();
      if (!currentTopic || !currentSource || !currentLevel) {
        const inlineT = answer.match(/\s+\b(?:T|Topic)\s*:\s*(.+?)(?=\s+\b(?:S|Source|Page|Ref|L|Level|Difficulty)\s*:|$)/i);
        const inlineS = answer.match(/\s+\b(?:S|Source|Page|Ref)\s*:\s*(.+?)(?=\s+\b(?:L|Level|Difficulty)\s*:|$)/i);
        const inlineL = answer.match(/\s+\b(?:L|Level|Difficulty)\s*:\s*(.+?)$/i);
        if (!currentTopic && inlineT) {
          currentTopic = inlineT[1].trim();
          answer = answer.slice(0, answer.indexOf(inlineT[0])).trim();
        }
        if (!currentSource && inlineS) {
          currentSource = inlineS[1].trim();
          const sIdx = answer.indexOf(inlineS[0]);
          if (sIdx >= 0) answer = answer.slice(0, sIdx).trim();
        }
        if (!currentLevel && inlineL) {
          currentLevel = inlineL[1].trim();
          const lIdx = answer.indexOf(inlineL[0]);
          if (lIdx >= 0) answer = answer.slice(0, lIdx).trim();
        }
      }

      // Auto-detect question type from content
      const detected = detectQuestionType(currentQ.trim(), answer);

      const q: DraftQuestion = {
        text: detected.text,
        type: detected.type,
        difficulty: currentLevel ? parseDifficulty(currentLevel) : "beginner",
      };

      if (detected.options) {
        q.options = detected.options;
      } else {
        q.answer = detected.answer ?? answer;
      }

      if (detected.explanation) q.explanation = detected.explanation;
      if (currentTopic) q.topic = currentTopic;
      if (currentSource) q.pageReference = currentSource;
      questions.push(q);
    }
  }

  for (const line of lines) {
    // Skip section headers like "--- MULTIPLE CHOICE ---"
    if (SECTION_HEADER.test(line)) continue;

    if (Q_MARKER.test(line)) {
      flush();
      currentQ = stripQMarker(line);
      currentA = "";
      currentTopic = "";
      currentSource = "";
      currentLevel = "";
      collecting = "q";
    } else if (A_MARKER.test(line)) {
      currentA = stripAMarker(line);
      collecting = "a";
    } else if (TOPIC_MARKER.test(line)) {
      currentTopic = stripTopicMarker(line);
      collecting = "topic";
    } else if (SOURCE_MARKER.test(line)) {
      currentSource = stripSourceMarker(line);
      collecting = "source";
    } else if (LEVEL_MARKER.test(line)) {
      currentLevel = stripLevelMarker(line);
      collecting = "level";
    } else if (line.trim()) {
      // Continuation line — append to whatever field we're currently collecting
      if (collecting === "a") currentA += " " + line.trim();
      else if (collecting === "q" && currentQ) currentQ += " " + line.trim();
      else if (collecting === "source") currentSource += " " + line.trim();
    }
  }

  flush();
  return questions.length >= 2 ? questions : null;
}

function parseNumberedQuestions(lines: string[]): DraftQuestion[] | null {
  const questions: DraftQuestion[] = [];
  let currentQ = "";
  let currentA = "";
  let currentTopic = "";
  let currentSource = "";
  let currentLevel = "";

  function flush() {
    if (currentQ) {
      const q: DraftQuestion = {
        text: currentQ,
        type: "flashcard_qa",
        answer: currentA.trim(),
        difficulty: currentLevel ? parseDifficulty(currentLevel) : "beginner",
      };
      if (currentTopic) q.topic = currentTopic;
      if (currentSource) q.pageReference = currentSource;
      questions.push(q);
    }
  }

  for (const line of lines) {
    // Numbered line = new question (e.g. "1. What is..." or "23) Describe...")
    if (/^\s*\d+[\.\)]\s+\S/.test(line)) {
      flush();
      currentQ = line.replace(/^\s*\d+[\.\)]\s*/, "").trim();
      currentA = "";
      currentTopic = "";
      currentSource = "";
      currentLevel = "";
    } else if (TOPIC_MARKER.test(line)) {
      currentTopic = stripTopicMarker(line);
    } else if (SOURCE_MARKER.test(line)) {
      currentSource = stripSourceMarker(line);
    } else if (LEVEL_MARKER.test(line)) {
      currentLevel = stripLevelMarker(line);
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

  flush();
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

  // Q/A parser didn't detect a pattern — build a diagnostic preview
  const textLines = text.split(/\r?\n/);
  const lineCount = textLines.length;
  const firstLines = textLines.slice(0, 8).join(" | ").slice(0, 300);
  const parserDebug = `[Parser debug: ${lineCount} lines, first lines: "${firstLines}"]`;
  console.log("Q/A parser did not detect pattern.", parserDebug);

  // Send to Claude API for parsing
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      `Could not detect Q/A structure in this document. ${parserDebug}. ` +
      `To use AI parsing, set the ANTHROPIC_API_KEY environment variable.`
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
      `Failed to parse AI response. Q/A parser also could not detect a pattern. ${parserDebug}`
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
