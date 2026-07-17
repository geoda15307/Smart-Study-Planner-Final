import type { AISummary } from "@/types";
import type { JSONSchema, PromptSpec } from "./types";
import { buildSystemInstruction, formatSummaryContext } from "./shared/formatting";
import { DIFFICULTY_SCHEMA, NON_EMPTY_STRING } from "./shared/schemas";

export { QUIZ_PROMPT_VERSION } from "./versions";
export const DEFAULT_QUIZ_COUNT = 5;

// §17.3 — AIQuizSetOutput Schema. Keputusan final (Riwayat Revisi #10): `correctIndex`
// (index ke `options`), bukan teks jawaban. JSON Schema tidak bisa mengekspresikan
// `correctIndex < options.length` — aturan lintas-field itu ditegakkan Business Validation
// (§17.4, Milestone D).
export const AI_QUIZ_SET_OUTPUT_SCHEMA: JSONSchema = {
  type: "object",
  required: ["title", "questions"],
  properties: {
    title: NON_EMPTY_STRING,
    questions: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["question", "options", "correctIndex", "explanation", "difficulty"],
        properties: {
          question: NON_EMPTY_STRING,
          options: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
          correctIndex: { type: "integer", minimum: 0 },
          explanation: NON_EMPTY_STRING,
          difficulty: DIFFICULTY_SCHEMA
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
};

export function buildQuizPrompt(summary: AISummary, count: number = DEFAULT_QUIZ_COUNT): PromptSpec {
  return {
    system: buildSystemInstruction("Tugasmu membuat soal pilihan ganda untuk menguji pemahaman materi."),
    user: [
      `Buat ${count} soal pilihan ganda dari ringkasan materi berikut. Tiap soal punya 2-6 opsi yang masuk akal (bukan opsi asal yang jelas salah), tepat satu jawaban benar — "correctIndex" adalah index jawaban benar di array "options", dimulai dari 0. Isi "explanation" dengan alasan kenapa jawaban itu benar, "difficulty" ("Easy"/"Medium"/"Hard") per soal, dan "title" sebagai judul set quiz ini.`,
      "--- RINGKASAN MATERI ---",
      formatSummaryContext(summary)
    ].join("\n\n"),
    responseSchema: AI_QUIZ_SET_OUTPUT_SCHEMA
  };
}
