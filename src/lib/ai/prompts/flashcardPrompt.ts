import type { AISummary } from "@/types";
import type { JSONSchema, PromptSpec } from "./types";
import { buildSystemInstruction, formatSummaryContext } from "./shared/formatting";
import { DIFFICULTY_SCHEMA, NON_EMPTY_STRING } from "./shared/schemas";

export { FLASHCARD_PROMPT_VERSION } from "./versions";
export const DEFAULT_FLASHCARD_COUNT = 10;

// §17.3 — AIFlashcardSetOutput Schema. `id` per-card TIDAK diminta ke AI — ditambahkan
// Service lewat createId() setelah output tervalidasi (§17.2).
export const AI_FLASHCARD_SET_OUTPUT_SCHEMA: JSONSchema = {
  type: "object",
  required: ["title", "cards"],
  properties: {
    title: NON_EMPTY_STRING,
    cards: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["question", "answer", "difficulty"],
        properties: {
          question: NON_EMPTY_STRING,
          answer: NON_EMPTY_STRING,
          difficulty: DIFFICULTY_SCHEMA
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
};

export function buildFlashcardPrompt(summary: AISummary, count: number = DEFAULT_FLASHCARD_COUNT): PromptSpec {
  return {
    system: buildSystemInstruction("Tugasmu membuat flashcard tanya-jawab untuk menghafal dan memahami materi."),
    user: [
      `Buat ${count} flashcard dari ringkasan materi berikut. Pertanyaan harus spesifik dan bisa dijawab dari materi; jawaban ringkas tapi lengkap; jangan ada pertanyaan yang duplikat. Isi "difficulty" tiap card ("Easy"/"Medium"/"Hard") dan "title" sebagai judul set flashcard ini.`,
      "--- RINGKASAN MATERI ---",
      formatSummaryContext(summary)
    ].join("\n\n"),
    responseSchema: AI_FLASHCARD_SET_OUTPUT_SCHEMA
  };
}
