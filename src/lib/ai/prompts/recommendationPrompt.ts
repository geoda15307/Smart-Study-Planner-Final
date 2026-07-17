import type { AISummary } from "@/types";
import type { JSONSchema, PromptSpec } from "./types";
import { buildSystemInstruction, formatSummaryContext } from "./shared/formatting";
import { NON_EMPTY_STRING, PRIORITY_SCHEMA } from "./shared/schemas";
import { TASK_SUGGESTION_FRAGMENT } from "./taskPrompt";
import { CALENDAR_SUGGESTION_FRAGMENT } from "./calendarPrompt";

export { RECOMMENDATION_PROMPT_VERSION } from "./versions";

// §17.3 — AIRecommendationOutput Schema (bentuk polymorphic FINAL, Riwayat Revisi #10):
// satu array seragam + diskriminator "type"; field tanggal/jam opsional (hanya relevan untuk
// "Calendar"). Pemetaan ke bentuk penyimpanan terjadi di Business Validation (§17.4,
// Milestone D): "Task"/"Study" → AITaskSuggestion, "Calendar" → AICalendarSuggestion.
export const AI_RECOMMENDATION_OUTPUT_SCHEMA: JSONSchema = {
  type: "object",
  required: ["recommendations"],
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "title", "description", "priority", "estimatedDurationMinutes", "reason"],
        properties: {
          type: { type: "string", enum: ["Task", "Study", "Calendar"] },
          title: NON_EMPTY_STRING,
          description: NON_EMPTY_STRING,
          priority: PRIORITY_SCHEMA,
          estimatedDurationMinutes: { type: "integer", minimum: 1 },
          reason: NON_EMPTY_STRING,
          suggestedDate: { type: "string", format: "date" },
          suggestedStartTime: { type: "string" },
          suggestedEndTime: { type: "string" }
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
};

// Satu PromptSpec utuh = satu panggilan AI untuk saran Task + Study + Calendar sekaligus (§4.3).
export function buildRecommendationPrompt(summary: AISummary): PromptSpec {
  return {
    system: buildSystemInstruction(
      "Tugasmu memberi rekomendasi tindak lanjut belajar (tugas, sesi belajar, dan jadwal) dari ringkasan materi."
    ),
    user: [
      'Berdasarkan ringkasan materi berikut, buat daftar rekomendasi. Tiap item punya "type": "Task", "Study", atau "Calendar".',
      TASK_SUGGESTION_FRAGMENT,
      CALENDAR_SUGGESTION_FRAGMENT,
      "--- RINGKASAN MATERI ---",
      formatSummaryContext(summary)
    ].join("\n\n"),
    responseSchema: AI_RECOMMENDATION_OUTPUT_SCHEMA
  };
}
