import type { JSONSchema, PromptSpec } from "./types";
import { buildSystemInstruction } from "./shared/formatting";
import { DIFFICULTY_SCHEMA, NON_EMPTY_STRING, NON_EMPTY_STRING_ARRAY, STRING_ARRAY } from "./shared/schemas";

// Versi prompt dipusatkan di ./versions.ts (dipakai juga oleh Service client untuk cek cache).
export { SUMMARY_PROMPT_VERSION } from "./versions";

// §17.3 — AISummaryOutput Schema.
export const AI_SUMMARY_OUTPUT_SCHEMA: JSONSchema = {
  type: "object",
  required: ["title", "summary", "keyPoints", "keywords", "difficulty", "estimatedReadingTime", "language", "confidence"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    summary: NON_EMPTY_STRING,
    keyPoints: NON_EMPTY_STRING_ARRAY,
    keywords: NON_EMPTY_STRING_ARRAY,
    formulas: STRING_ARRAY,
    difficulty: DIFFICULTY_SCHEMA,
    estimatedReadingTime: { type: "integer", minimum: 1 },
    language: { type: "string", enum: ["id", "en"] },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  },
  additionalProperties: false
};

// Output antara untuk mode chunk (§6) — ringkasan parsial berupa teks padat saja; bentuk
// AISummaryOutput penuh baru diminta di mode direct/merge.
export const CHUNK_SUMMARY_OUTPUT_SCHEMA: JSONSchema = {
  type: "object",
  required: ["summary"],
  properties: {
    summary: NON_EMPTY_STRING
  },
  additionalProperties: false
};

export interface SummaryPromptMeta {
  filename?: string;
}

const SUMMARY_FIELD_GUIDE = [
  "Isi field JSON sebagai berikut:",
  '- "title": judul deskriptif materi (bukan nama file).',
  '- "summary": ringkasan utuh dalam beberapa paragraf.',
  '- "keyPoints": poin-poin terpenting materi.',
  '- "keywords": istilah/kata kunci penting.',
  '- "formulas": rumus/persamaan penting — hanya kalau materi memuatnya; kalau tidak ada, hilangkan field ini.',
  '- "difficulty": perkiraan tingkat kesulitan materi ("Easy"/"Medium"/"Hard").',
  '- "estimatedReadingTime": perkiraan waktu baca materi asli dalam menit (bilangan bulat, minimal 1).',
  '- "language": bahasa dominan materi ("id" atau "en").',
  '- "confidence": keyakinanmu atas kualitas ringkasan ini, angka 0 sampai 1.'
].join("\n");

function sourceLabel(meta: SummaryPromptMeta): string {
  return meta.filename ? `Materi berasal dari file "${meta.filename}".` : "";
}

// Mode direct (§6.1) — teks pendek dikirim utuh dalam satu panggilan.
export function buildSummaryPrompt(text: string, meta: SummaryPromptMeta = {}): PromptSpec {
  return {
    system: buildSystemInstruction("Tugasmu meringkas materi kuliah menjadi ringkasan belajar terstruktur."),
    user: [sourceLabel(meta), "Ringkas materi berikut.", SUMMARY_FIELD_GUIDE, "--- MATERI ---", text]
      .filter(Boolean)
      .join("\n\n"),
    responseSchema: AI_SUMMARY_OUTPUT_SCHEMA
  };
}

// Mode chunk (§6.2–6.3) — meringkas SATU bagian dari dokumen panjang; hasilnya digabung
// belakangan lewat mode merge. `index` 0-based.
export function buildChunkSummaryPrompt(chunkText: string, index: number, total: number): PromptSpec {
  return {
    system: buildSystemInstruction(
      "Tugasmu meringkas satu bagian dari dokumen panjang; hasilnya akan digabung dengan ringkasan bagian lain."
    ),
    user: [
      `Ini bagian ${index + 1} dari ${total} dokumen yang sama. Ringkas bagian ini sepadat mungkin tanpa membuang informasi penting (definisi, rumus, angka, kesimpulan).`,
      'Isi field "summary" dengan ringkasan padat bagian ini.',
      "--- BAGIAN DOKUMEN ---",
      chunkText
    ].join("\n\n"),
    responseSchema: CHUNK_SUMMARY_OUTPUT_SCHEMA
  };
}

// Mode merge (§6.3) — menggabungkan ringkasan-ringkasan parsial jadi AISummaryOutput final.
export function buildMergeSummaryPrompt(partials: string[], meta: SummaryPromptMeta = {}): PromptSpec {
  const numbered = partials.map((partial, index) => `[Bagian ${index + 1}]\n${partial}`).join("\n\n");
  return {
    system: buildSystemInstruction(
      "Tugasmu menggabungkan ringkasan per-bagian dari satu dokumen menjadi satu ringkasan belajar yang utuh dan koheren."
    ),
    user: [
      sourceLabel(meta),
      "Gabungkan ringkasan bagian-bagian berikut menjadi satu ringkasan utuh. Hilangkan pengulangan antar bagian, pertahankan urutan logis materi.",
      SUMMARY_FIELD_GUIDE,
      "--- RINGKASAN PER BAGIAN ---",
      numbered
    ]
      .filter(Boolean)
      .join("\n\n"),
    responseSchema: AI_SUMMARY_OUTPUT_SCHEMA
  };
}
