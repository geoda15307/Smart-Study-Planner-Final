import type { AIQuizRouteResponse, AIQuizSet } from "@/types";
import { aiRepository } from "./aiRepository";
import { postAI } from "./aiApi";
import { generateSummary } from "./documentSummaryService";
import { isDerivedCacheValid } from "@/lib/ai/cache";
import { createId } from "@/utils/id";
import { nowISO } from "@/utils/date";

// Generator quiz (AI_ARCHITECTURE_FREEZE §7.1). Pola identik flashcardService — input AISummary,
// tanpa chunking, cache transitif via summaryId.

export interface GenerateQuizOptions {
  force?: boolean;
  count?: number;
  filename?: string;
}

export async function generateQuiz(documentId: string, options: GenerateQuizOptions = {}): Promise<AIQuizSet> {
  const summary = await generateSummary(documentId, { filename: options.filename });

  const existing = await aiRepository.getQuizSet(documentId);
  if (!options.force && isDerivedCacheValid(existing, summary.id)) {
    return existing;
  }

  const output = await postAI<AIQuizRouteResponse>("/api/ai/quiz", { documentId, summary, count: options.count });

  const set: AIQuizSet = {
    id: createId("quizset"),
    documentId,
    summaryId: summary.id,
    title: output.title,
    questions: output.questions.map((question) => ({ ...question, id: createId("q") })),
    provider: output.provider,
    model: output.model,
    tokenUsage: output.tokenUsage,
    createdAt: nowISO()
  };

  await aiRepository.saveQuizSet(set);
  return set;
}
