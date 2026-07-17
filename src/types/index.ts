export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type TaskStatus = "Belum Mulai" | "Selesai" | "Terlambat";
export type ProductiveTime = "Pagi" | "Siang" | "Sore" | "Malam";

export interface User {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
}

export interface Course {
  id: string;
  name: string;
  color: string;
  lecturerName?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  activities: string[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface AIAnalysis {
  id: string;
  taskId: string;
  summary: string;
  recommendedPriority: Priority;
  reason: string;
  steps: string[];
  tips: string[];
  estimatedDurationMinutes: number;
  riskLevel: "low" | "medium" | "high";
  warning?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  categoryId: string;
  description: string;
  deadlineDate: string;
  deadlineTime: string;
  priority: Priority;
  difficulty: Difficulty;
  estimatedDurationMinutes: number;
  priorityScore: number;
  status: TaskStatus;
  tags: string[];
  subtasks: Subtask[];
  notes?: string;
  aiAnalysis?: AIAnalysis;
  // Diisi hanya kalau task dibuat dari saran AI (AI_ARCHITECTURE_FREEZE §3.2) — merujuk
  // dokumen & AITaskSuggestion asal via id (join, tidak menduplikasi filename/isi saran).
  sourceDocumentId?: string;
  sourceSuggestionId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ClassSchedule {
  id: string;
  courseName: string;
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
  color: string;
}

export interface StudySession {
  id: string;
  taskId?: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "Terjadwal" | "Selesai" | "Dilewati";
  source: "manual" | "ai" | "rule-based";
  // Sama seperti Task — hanya terisi kalau sesi dibuat dari saran AI (AI_ARCHITECTURE_FREEZE §3.2).
  sourceDocumentId?: string;
  sourceSuggestionId?: string;
}

export interface Preference {
  theme: "Biru Akademik" | "Ungu Modern" | "Hijau Produktif" | "Orange Energetic";
  language: "id" | "en";
  productiveTime: ProductiveTime;
  maxStudyHoursPerDay: number;
  defaultReminder: number;
  aiEnabled: boolean;
  notificationEnabled: boolean;
  darkMode: boolean;
}

export interface WidgetPreference {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  size: "small" | "medium" | "large";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  unlocked: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface TaskInput {
  title: string;
  description: string;
  activity: string;
  categoryId: string;
  deadlineDate: string;
  deadlineTime: string;
  priority: Priority;
  difficulty: Difficulty;
  estimatedDurationMinutes: number;
  notes?: string;
  subtasks: Subtask[];
}

export type UploadStatus = "uploading" | "ready" | "error";

export interface UploadedFileMeta {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  category: DocumentCategory;
  status: UploadStatus;
  errorMessage?: string;
  createdAt: string;
}

// --- Document Processing Pipeline (Sprint 1 domain model) ---
// UploadCategory (3 nilai lama) sudah disatukan ke DocumentCategory (5 nilai) sejak
// migrasi Sprint 2 (lihat docs/SPRINT_1_ARCHITECTURE_FREEZE.md §8 dan useAppStore.ts
// untuk migrasi data persisted lama).

export type DocumentCategory = "image" | "pdf" | "document" | "spreadsheet" | "presentation";

export type DocumentStatus = "pending" | "processing" | "extracted" | "needs_ocr" | "completed" | "failed";

// Subset dari DocumentStatus yang boleh dikembalikan langsung oleh satu pemanggilan
// DocumentProcessor.process() — "pending"/"processing"/"completed" adalah state milik
// orchestrator (documentService), bukan sesuatu yang processor tentukan sendiri.
export type ProcessorOutcome = "extracted" | "needs_ocr" | "failed";

export interface NormalizedContent {
  text: string;
  sourceType: DocumentCategory;
  pageCount?: number;
  sheetNames?: string[];
  slideCount?: number;
}

export interface ProcessorResult {
  status: ProcessorOutcome;
  rawText?: string;
  pageCount?: number;
  sheetNames?: string[];
  slideCount?: number;
  // Provenance opsional dari provider eksternal (OCR/AI) yang dipanggil processor —
  // bukan bagian dari NormalizedContent karena tidak semua kategori punya konsep ini
  // (mis. parser lokal spreadsheet tidak punya "confidence").
  confidence?: number;
  provider?: string;
  processingTimeMs?: number;
  raw?: unknown;
  errorCode?: string;
  errorMessage?: string;
}

export interface ProcessingResult {
  status: ProcessorOutcome;
  content: NormalizedContent | null;
  requiresOCR: boolean;
  confidence?: number;
  provider?: string;
  processingTimeMs?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface DocumentRecord {
  id: string;
  category: DocumentCategory;
  status: DocumentStatus;
  content: NormalizedContent | null;
  confidence?: number;
  provider?: string;
  processingTimeMs?: number;
  processedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  retentionPolicy?: "keep_original" | "balanced" | "storage_saver";
  createdAt: string;
  updatedAt: string;
}

// --- AI domain (AI_ARCHITECTURE_FREEZE — APPROVED, Milestone A) ---
// Dua lapis bentuk (§17.2): *Output = persis yang diminta & divalidasi dari AI (tanpa id/
// provenance); record domain = Output + metadata provenance/storage, ditambahkan Service.
// Konten AI hanya hidup di IndexedDB (store ai_* — Milestone B), tidak pernah di
// localStorage/Supabase.

export type AILanguage = "id" | "en";
export type AIGenerationStrategy = "direct" | "chunked" | "hierarchical";
export type AISuggestionStatus = "pending" | "applied" | "dismissed";
// Diskriminator kontrak output rekomendasi (§17.2, polymorphic). Saat disimpan:
// "Task"/"Study" → AITaskSuggestion, "Calendar" → AICalendarSuggestion.
export type AIRecommendationType = "Task" | "Study" | "Calendar";

export interface AITokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AISummaryOutput {
  title: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  formulas?: string[];
  difficulty: Difficulty;
  // Perkiraan waktu baca materi asli, dalam menit.
  estimatedReadingTime: number;
  language: AILanguage;
  // Keyakinan AI atas kualitas ringkasannya sendiri, 0–1.
  confidence: number;
}

export interface AIFlashcardOutput {
  question: string;
  answer: string;
  difficulty: Difficulty;
}

export interface AIFlashcardSetOutput {
  title: string;
  cards: AIFlashcardOutput[];
}

export interface AIQuizQuestionOutput {
  question: string;
  options: string[];
  // Index jawaban benar di `options` (0-based). Aturan lintas-field
  // correctIndex < options.length ditegakkan Business Validation (§17.4), bukan schema.
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
}

export interface AIQuizSetOutput {
  title: string;
  questions: AIQuizQuestionOutput[];
}

export interface AIRecommendationItemOutput {
  type: AIRecommendationType;
  title: string;
  description: string;
  priority: Priority;
  estimatedDurationMinutes: number;
  reason: string;
  // Hanya relevan untuk type "Calendar" — opsional di semua item (konsekuensi bentuk
  // polymorphic yang disadari, §17.2).
  suggestedDate?: string;
  suggestedStartTime?: string;
  suggestedEndTime?: string;
}

export interface AIRecommendationOutput {
  recommendations: AIRecommendationItemOutput[];
}

export interface AISummary extends AISummaryOutput {
  id: string;
  documentId: string;
  summaryVersion: number;
  sourceTextHash: string;
  promptVersion: string;
  generationStrategy: AIGenerationStrategy;
  provider: string;
  model: string;
  tokenUsage?: AITokenUsage;
  createdAt: string;
  updatedAt: string;
}

export interface AIFlashcard extends AIFlashcardOutput {
  // id per-card TIDAK diminta ke AI — ditambahkan Service lewat createId() setelah validasi.
  id: string;
}

export interface AIFlashcardSet {
  id: string;
  documentId: string;
  summaryId: string;
  title: string;
  cards: AIFlashcard[];
  provider: string;
  model: string;
  tokenUsage?: AITokenUsage;
  createdAt: string;
}

export interface AIQuizQuestion extends AIQuizQuestionOutput {
  id: string;
}

export interface AIQuizSet {
  id: string;
  documentId: string;
  summaryId: string;
  title: string;
  questions: AIQuizQuestion[];
  provider: string;
  model: string;
  tokenUsage?: AITokenUsage;
  createdAt: string;
}

export interface AITaskSuggestion {
  id: string;
  title: string;
  description?: string;
  categoryHint?: string;
  priorityHint?: Priority;
  estimatedDurationMinutes?: number;
  dueDateHint?: string;
  reasoning: string;
  status: AISuggestionStatus;
  // Terisi setelah user klik "Tambahkan ke Tugas" — id Task yang dibuat darinya.
  appliedTaskId?: string;
}

export interface AICalendarSuggestion {
  id: string;
  title: string;
  suggestedDate: string;
  suggestedStartTime?: string;
  suggestedEndTime?: string;
  relatedTaskSuggestionId?: string;
  reasoning: string;
  status: AISuggestionStatus;
  appliedSessionId?: string;
}

export interface AIRecommendation {
  id: string;
  documentId: string;
  summaryId: string;
  taskSuggestions: AITaskSuggestion[];
  calendarSuggestions: AICalendarSuggestion[];
  provider: string;
  model: string;
  tokenUsage?: AITokenUsage;
  createdAt: string;
}

// --- Kontrak route AI (Milestone D, AI_ARCHITECTURE_FREEZE §7.3) ---
// Dipakai bersama oleh Service client (services/ai/*) dan route server (app/api/ai/*) lewat
// import TYPE-ONLY, jadi tidak melanggar aturan boundary §13 (tidak ada kode runtime yang
// menyeberang). Response route = AI Output Contract (§17.2) + metadata generasi; field storage
// (id/documentId/hash/promptVersion/timestamps) ditambahkan Service, bukan dikembalikan route.

export type AISummaryMode = "direct" | "chunk" | "merge";

export interface AIGenerationMeta {
  provider: string;
  model: string;
  tokenUsage?: AITokenUsage;
}

export interface AISummaryRouteRequest {
  documentId: string;
  mode: AISummaryMode;
  text?: string; // untuk mode direct/chunk
  partials?: string[]; // untuk mode merge
  index?: number; // untuk mode chunk (bagian ke-berapa)
  total?: number; // untuk mode chunk (dari berapa bagian)
  meta?: { filename?: string };
}

export interface AIFlashcardRouteRequest {
  documentId: string;
  summary: AISummary;
  count?: number;
}

export interface AIQuizRouteRequest {
  documentId: string;
  summary: AISummary;
  count?: number;
}

export interface AIRecommendationRouteRequest {
  documentId: string;
  summary: AISummary;
}

export type AISummaryDirectResponse = AISummaryOutput & AIGenerationMeta;
export interface AIChunkSummaryResponse extends AIGenerationMeta {
  summary: string;
}
export type AIFlashcardRouteResponse = AIFlashcardSetOutput & AIGenerationMeta;
export type AIQuizRouteResponse = AIQuizSetOutput & AIGenerationMeta;
export type AIRecommendationRouteResponse = AIRecommendationOutput & AIGenerationMeta;
