import type { AIFlashcardSet, AIQuizSet, AIRecommendation, AISummary } from "@/types";

// Kontrak repository untuk keempat store AI di IndexedDB (AI_ARCHITECTURE_FREEZE §7.1/§8.3) —
// pola identik DocumentRepository (services/document/types.ts). Wajib client-only: IndexedDB
// tidak ada di runtime server. Semua akses baca/tulis store ai_* WAJIB lewat sini, tidak
// pernah menyentuh lib/indexedDb.ts langsung dari Service/komponen.
export interface AIRepository {
  getSummary(documentId: string): Promise<AISummary | undefined>;
  saveSummary(record: AISummary): Promise<void>;
  deleteSummary(documentId: string): Promise<void>;

  getFlashcardSet(documentId: string): Promise<AIFlashcardSet | undefined>;
  saveFlashcardSet(record: AIFlashcardSet): Promise<void>;
  deleteFlashcardSet(documentId: string): Promise<void>;

  getQuizSet(documentId: string): Promise<AIQuizSet | undefined>;
  saveQuizSet(record: AIQuizSet): Promise<void>;
  deleteQuizSet(documentId: string): Promise<void>;

  getRecommendation(documentId: string): Promise<AIRecommendation | undefined>;
  saveRecommendation(record: AIRecommendation): Promise<void>;
  deleteRecommendation(documentId: string): Promise<void>;

  // Bersihkan semua record AI untuk satu dokumen sekaligus — dipakai saat dokumen dihapus
  // (Milestone E) supaya tidak meninggalkan Summary/Flashcard/Quiz/Recommendation yatim.
  deleteAllForDocument(documentId: string): Promise<void>;
}
