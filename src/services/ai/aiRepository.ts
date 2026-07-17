import type { AIFlashcardSet, AIQuizSet, AIRecommendation, AISummary } from "@/types";
import {
  deleteAIFlashcardSet,
  deleteAIQuizSet,
  deleteAIRecommendation,
  deleteAISummary,
  getAIFlashcardSet,
  getAIQuizSet,
  getAIRecommendation,
  getAISummary,
  putAIFlashcardSet,
  putAIQuizSet,
  putAIRecommendation,
  putAISummary
} from "@/lib/indexedDb";
import type { AIRepository } from "./types";

// Satu-satunya pintu baca/tulis keempat store ai_* di IndexedDB (AI_ARCHITECTURE_FREEZE
// §7.1/§8.3) — pola identik IndexedDbDocumentRepository. Client-only.
export class IndexedDbAIRepository implements AIRepository {
  getSummary(documentId: string): Promise<AISummary | undefined> {
    return getAISummary(documentId);
  }

  async saveSummary(record: AISummary): Promise<void> {
    await putAISummary(record);
  }

  async deleteSummary(documentId: string): Promise<void> {
    await deleteAISummary(documentId);
  }

  getFlashcardSet(documentId: string): Promise<AIFlashcardSet | undefined> {
    return getAIFlashcardSet(documentId);
  }

  async saveFlashcardSet(record: AIFlashcardSet): Promise<void> {
    await putAIFlashcardSet(record);
  }

  async deleteFlashcardSet(documentId: string): Promise<void> {
    await deleteAIFlashcardSet(documentId);
  }

  getQuizSet(documentId: string): Promise<AIQuizSet | undefined> {
    return getAIQuizSet(documentId);
  }

  async saveQuizSet(record: AIQuizSet): Promise<void> {
    await putAIQuizSet(record);
  }

  async deleteQuizSet(documentId: string): Promise<void> {
    await deleteAIQuizSet(documentId);
  }

  getRecommendation(documentId: string): Promise<AIRecommendation | undefined> {
    return getAIRecommendation(documentId);
  }

  async saveRecommendation(record: AIRecommendation): Promise<void> {
    await putAIRecommendation(record);
  }

  async deleteRecommendation(documentId: string): Promise<void> {
    await deleteAIRecommendation(documentId);
  }

  async deleteAllForDocument(documentId: string): Promise<void> {
    await Promise.all([
      deleteAISummary(documentId),
      deleteAIFlashcardSet(documentId),
      deleteAIQuizSet(documentId),
      deleteAIRecommendation(documentId)
    ]);
  }
}

export const aiRepository = new IndexedDbAIRepository();
