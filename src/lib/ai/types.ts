import type { AIAnalysis, AITokenUsage, ChatMessage, Task } from "@/types";
import type { PromptSpec } from "./prompts/types";

// Parameter eksekusi generik per panggilan (AI_ARCHITECTURE_FREEZE §4.2). Route (Milestone D)
// yang menentukan nilainya per fitur (mis. generateQuiz boleh temperature lebih rendah).
export interface GenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

// Hasil generik satu panggilan provider (§4.2). `raw` = teks mentah dari model (string JSON
// yang diminta). `parsed` = best-effort JSON.parse (validasi otoritatif dilakukan di route,
// Milestone D — §17.4). `tokenUsage` untuk observability biaya (§10).
export interface AIGenerationResult {
  raw: string;
  parsed?: unknown;
  tokenUsage?: AITokenUsage;
  provider: string;
  model: string;
  finishReason?: string;
}

export interface AIProvider {
  name: string;

  // Dipakai /api/ai/analyze & /api/ai/chat yang sudah ada (rule-based hari ini, di luar
  // cakupan Milestone C). chat() disambungkan ke provider sungguhan di Milestone E — §16.
  analyzeTask(task: Task): Promise<AIAnalysis>;
  chat(message: string, tasks: Task[], history: ChatMessage[]): Promise<string>;

  // Satu method eksplisit per fitur berbasis dokumen (§4.2). Semua menerima PromptSpec dari
  // Prompt Builder (§5) dan mengembalikan bentuk generik yang sama — hanya nama method yang
  // eksplisit per fitur, bukan satu generate() generik. Menggantikan summarizeDocument() lama
  // (Lampiran #4 freeze: superseded, dihapus di Milestone C ini).
  summarize(spec: PromptSpec, options?: GenerateOptions): Promise<AIGenerationResult>;
  generateFlashcards(spec: PromptSpec, options?: GenerateOptions): Promise<AIGenerationResult>;
  generateQuiz(spec: PromptSpec, options?: GenerateOptions): Promise<AIGenerationResult>;
  recommend(spec: PromptSpec, options?: GenerateOptions): Promise<AIGenerationResult>;
}
