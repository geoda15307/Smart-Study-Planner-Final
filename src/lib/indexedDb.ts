import { openDB, type IDBPDatabase } from "idb";
import type {
  AIFlashcardSet,
  AIQuizSet,
  AIRecommendation,
  AISummary,
  DocumentRecord
} from "@/types";

const DB_NAME = "smart-study-planner";
// v2 menambah object store `documents` (Sprint 1, Milestone 4).
// v3 menambah 4 store AI (`ai_summaries`/`ai_flashcards`/`ai_quizzes`/`ai_recommendations`)
// untuk hasil AI — AI_ARCHITECTURE_FREEZE §8.3, Milestone B. Semua bump murni additive:
// store lama (`files`/`documents`) tidak disentuh, upgrade hanya membuat store yang belum ada.
const DB_VERSION = 3;
const FILES_STORE = "files";
const DOCUMENTS_STORE = "documents";
const AI_SUMMARIES_STORE = "ai_summaries";
const AI_FLASHCARDS_STORE = "ai_flashcards";
const AI_QUIZZES_STORE = "ai_quizzes";
const AI_RECOMMENDATIONS_STORE = "ai_recommendations";

// Keempat store AI memakai `documentId` sebagai key (satu record aktif per dokumen per fitur,
// ditimpa saat "Generate Ulang") — AI_ARCHITECTURE_FREEZE §8.3.
const AI_STORES = [AI_SUMMARIES_STORE, AI_FLASHCARDS_STORE, AI_QUIZZES_STORE, AI_RECOMMENDATIONS_STORE] as const;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          db.createObjectStore(FILES_STORE);
        }
        if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
          db.createObjectStore(DOCUMENTS_STORE);
        }
        for (const store of AI_STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store);
          }
        }
      }
    });
  }
  return dbPromise;
}

export async function putBlob(id: string, blob: Blob) {
  const db = await getDb();
  await db.put(FILES_STORE, blob, id);
}

export async function getBlob(id: string): Promise<Blob | undefined> {
  const db = await getDb();
  return db.get(FILES_STORE, id);
}

export async function deleteBlob(id: string) {
  const db = await getDb();
  await db.delete(FILES_STORE, id);
}

export async function getAllBlobIds(): Promise<string[]> {
  const db = await getDb();
  const keys = await db.getAllKeys(FILES_STORE);
  return keys.map(String);
}

export async function putDocument(record: DocumentRecord) {
  const db = await getDb();
  await db.put(DOCUMENTS_STORE, record, record.id);
}

export async function getDocument(id: string): Promise<DocumentRecord | undefined> {
  const db = await getDb();
  return db.get(DOCUMENTS_STORE, id);
}

export async function deleteDocument(id: string) {
  const db = await getDb();
  await db.delete(DOCUMENTS_STORE, id);
}

export async function getAllDocuments(): Promise<DocumentRecord[]> {
  const db = await getDb();
  return db.getAll(DOCUMENTS_STORE);
}

// --- AI stores (v3) — key = documentId untuk keempatnya (§8.3) ---

export async function putAISummary(record: AISummary) {
  const db = await getDb();
  await db.put(AI_SUMMARIES_STORE, record, record.documentId);
}

export async function getAISummary(documentId: string): Promise<AISummary | undefined> {
  const db = await getDb();
  return db.get(AI_SUMMARIES_STORE, documentId);
}

export async function deleteAISummary(documentId: string) {
  const db = await getDb();
  await db.delete(AI_SUMMARIES_STORE, documentId);
}

export async function putAIFlashcardSet(record: AIFlashcardSet) {
  const db = await getDb();
  await db.put(AI_FLASHCARDS_STORE, record, record.documentId);
}

export async function getAIFlashcardSet(documentId: string): Promise<AIFlashcardSet | undefined> {
  const db = await getDb();
  return db.get(AI_FLASHCARDS_STORE, documentId);
}

export async function deleteAIFlashcardSet(documentId: string) {
  const db = await getDb();
  await db.delete(AI_FLASHCARDS_STORE, documentId);
}

export async function putAIQuizSet(record: AIQuizSet) {
  const db = await getDb();
  await db.put(AI_QUIZZES_STORE, record, record.documentId);
}

export async function getAIQuizSet(documentId: string): Promise<AIQuizSet | undefined> {
  const db = await getDb();
  return db.get(AI_QUIZZES_STORE, documentId);
}

export async function deleteAIQuizSet(documentId: string) {
  const db = await getDb();
  await db.delete(AI_QUIZZES_STORE, documentId);
}

export async function putAIRecommendation(record: AIRecommendation) {
  const db = await getDb();
  await db.put(AI_RECOMMENDATIONS_STORE, record, record.documentId);
}

export async function getAIRecommendation(documentId: string): Promise<AIRecommendation | undefined> {
  const db = await getDb();
  return db.get(AI_RECOMMENDATIONS_STORE, documentId);
}

export async function deleteAIRecommendation(documentId: string) {
  const db = await getDb();
  await db.delete(AI_RECOMMENDATIONS_STORE, documentId);
}
