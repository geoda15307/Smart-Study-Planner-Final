import type { AISummary } from "@/types";

// Fragmen instruksi bersama untuk SEMUA Prompt Builder (AI_ARCHITECTURE_FREEZE §17.7) —
// satu tempat, tidak ditulis ulang di tiap file prompt.

export const STUDY_ASSISTANT_ROLE =
  "Kamu adalah asisten belajar untuk mahasiswa Indonesia yang membantu memahami materi kuliah.";

// Instruksi baku §17.7 — mengurangi (bukan menjamin nol) kebiasaan LLM membungkus jawaban
// dengan code fence; lapisan parsing tetap wajib toleran sebagai pertahanan kedua (Milestone D).
export const JSON_ONLY_INSTRUCTION =
  "Kembalikan hanya JSON valid sesuai schema yang diminta. Jangan gunakan markdown, code block, atau teks penjelasan apa pun di luar objek JSON.";

export const INDONESIAN_OUTPUT_INSTRUCTION =
  "Tulis seluruh teks di dalam JSON dalam Bahasa Indonesia, kecuali istilah teknis yang lazim dipakai dalam bahasa aslinya.";

export function buildSystemInstruction(taskInstruction: string): string {
  return [STUDY_ASSISTANT_ROLE, taskInstruction, JSON_ONLY_INSTRUCTION, INDONESIAN_OUTPUT_INSTRUCTION].join(" ");
}

// Konteks ringkasan untuk fitur turunan (flashcard/quiz/recommendation, §3.2) — hanya field
// konten yang relevan, tanpa provenance (provider/model/hash), supaya hemat token.
export function formatSummaryContext(summary: AISummary): string {
  const parts = [
    `Judul materi: ${summary.title}`,
    `Ringkasan:\n${summary.summary}`,
    `Poin penting:\n${summary.keyPoints.map((point) => `- ${point}`).join("\n")}`,
    `Kata kunci: ${summary.keywords.join(", ")}`
  ];
  if (summary.formulas?.length) {
    parts.push(`Rumus penting:\n${summary.formulas.map((formula) => `- ${formula}`).join("\n")}`);
  }
  parts.push(`Perkiraan tingkat kesulitan materi: ${summary.difficulty}`);
  return parts.join("\n\n");
}
