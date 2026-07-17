import type {
  AICalendarSuggestion,
  AIRecommendation,
  AIRecommendationOutput,
  AIRecommendationRouteResponse,
  AITaskSuggestion
} from "@/types";
import { aiRepository } from "./aiRepository";
import { postAI } from "./aiApi";
import { generateSummary } from "./documentSummaryService";
import { isDerivedCacheValid } from "@/lib/ai/cache";
import { createId } from "@/utils/id";
import { nowISO } from "@/utils/date";

// Generator rekomendasi (AI_ARCHITECTURE_FREEZE §7.1/§4.3). Satu panggilan → saran
// Task+Study+Calendar. Pemetaan output polymorphic → bentuk penyimpanan dua-array terjadi
// DI SINI (Service, "saat disimpan" §17.2): type "Task"/"Study" → AITaskSuggestion,
// "Calendar" → AICalendarSuggestion.

export interface GenerateRecommendationOptions {
  force?: boolean;
  filename?: string;
}

function mapRecommendations(output: AIRecommendationOutput): {
  taskSuggestions: AITaskSuggestion[];
  calendarSuggestions: AICalendarSuggestion[];
} {
  const taskSuggestions: AITaskSuggestion[] = [];
  const calendarSuggestions: AICalendarSuggestion[] = [];

  for (const rec of output.recommendations) {
    if (rec.type === "Calendar") {
      calendarSuggestions.push({
        id: createId("calsug"),
        title: rec.title,
        // suggestedDate opsional di output (§17.2); kalau AI tak memberi, simpan string kosong
        // — UI (Milestone E) menampilkannya sebagai "tanggal belum ditentukan".
        suggestedDate: rec.suggestedDate ?? "",
        suggestedStartTime: rec.suggestedStartTime,
        suggestedEndTime: rec.suggestedEndTime,
        reasoning: rec.reason,
        status: "pending"
      });
    } else {
      // "Task" dan "Study" sama-sama → AITaskSuggestion (keputusan APPROVED, §17.2).
      taskSuggestions.push({
        id: createId("tasksug"),
        title: rec.title,
        description: rec.description,
        categoryHint: rec.type === "Study" ? "Belajar" : undefined,
        priorityHint: rec.priority,
        estimatedDurationMinutes: rec.estimatedDurationMinutes,
        reasoning: rec.reason,
        status: "pending"
      });
    }
  }

  return { taskSuggestions, calendarSuggestions };
}

export async function generateRecommendation(documentId: string, options: GenerateRecommendationOptions = {}): Promise<AIRecommendation> {
  const summary = await generateSummary(documentId, { filename: options.filename });

  const existing = await aiRepository.getRecommendation(documentId);
  if (!options.force && isDerivedCacheValid(existing, summary.id)) {
    return existing;
  }

  const output = await postAI<AIRecommendationRouteResponse>("/api/ai/recommendation", { documentId, summary });
  const { taskSuggestions, calendarSuggestions } = mapRecommendations(output);

  const recommendation: AIRecommendation = {
    id: createId("rec"),
    documentId,
    summaryId: summary.id,
    taskSuggestions,
    calendarSuggestions,
    provider: output.provider,
    model: output.model,
    tokenUsage: output.tokenUsage,
    createdAt: nowISO()
  };

  await aiRepository.saveRecommendation(recommendation);
  return recommendation;
}
