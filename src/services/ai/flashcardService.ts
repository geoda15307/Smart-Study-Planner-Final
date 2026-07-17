import type { AIFlashcardRouteResponse, AIFlashcardSet } from "@/types";
import { aiRepository } from "./aiRepository";
import { postAI } from "./aiApi";
import { generateSummary } from "./documentSummaryService";
import { isDerivedCacheValid } from "@/lib/ai/cache";
import { createId } from "@/utils/id";
import { nowISO } from "@/utils/date";

// Generator flashcard (AI_ARCHITECTURE_FREEZE §7.1). Client-only. Input = AISummary aktif
// (§3.2), jadi tidak butuh chunking sendiri. Memastikan AISummary tersedia lebih dulu.

export interface GenerateFlashcardsOptions {
  force?: boolean; // "Generate Ulang" (§9.3)
  count?: number;
  filename?: string;
}

export async function generateFlashcards(documentId: string, options: GenerateFlashcardsOptions = {}): Promise<AIFlashcardSet> {
  // Pastikan AISummary aktif ada & valid dulu (regenerasi otomatis kalau teks berubah).
  const summary = await generateSummary(documentId, { filename: options.filename });

  // Cache-check transitif via summaryId (§9.1).
  const existing = await aiRepository.getFlashcardSet(documentId);
  if (!options.force && isDerivedCacheValid(existing, summary.id)) {
    return existing;
  }

  const output = await postAI<AIFlashcardRouteResponse>("/api/ai/flashcard", { documentId, summary, count: options.count });

  const set: AIFlashcardSet = {
    id: createId("fcset"),
    documentId,
    summaryId: summary.id,
    title: output.title,
    // id per-card ditambahkan Service (§17.2), bukan diminta ke AI.
    cards: output.cards.map((card) => ({ ...card, id: createId("card") })),
    provider: output.provider,
    model: output.model,
    tokenUsage: output.tokenUsage,
    createdAt: nowISO()
  };

  await aiRepository.saveFlashcardSet(set);
  return set;
}
