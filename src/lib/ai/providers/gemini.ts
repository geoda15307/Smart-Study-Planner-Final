import type { AITokenUsage, ChatMessage, Task } from "@/types";
import type { AIGenerationResult, AIProvider, GenerateOptions } from "../types";
import type { JSONSchema, PromptSpec } from "../prompts/types";
import { AIProviderError } from "../errors";
import { sortTasks } from "@/utils/date";

// Implementasi provider Gemini sungguhan (AI_ARCHITECTURE_FREEZE §4.2/§17.8). Memakai raw
// fetch ke REST API Generative Language — TIDAK menambah SDK, konsisten dengan gaya project
// yang hand-roll pemanggilan HTTP (lihat lib/ocr/ocrSpaceProvider). Dipakai lewat
// getAIProvider() di route (Milestone D) dan AI Assistant chat (Milestone E).

const PROVIDER_NAME = "gemini";
// Alias selalu-terkini (menghindari "model X no longer available to new users"). Override
// lewat GEMINI_MODEL kalau butuh model spesifik (mis. gemini-3.5-flash).
const DEFAULT_MODEL = "gemini-flash-latest";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 60000;
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;
const DEFAULT_TEMPERATURE = 0.7;

interface GeminiPart {
  text?: string;
}
interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}
interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}
interface GeminiResponse {
  candidates?: GeminiCandidate[];
  usageMetadata?: GeminiUsageMetadata;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
}
interface GeminiRequestBody {
  systemInstruction: { parts: { text: string }[] };
  contents: { role: string; parts: { text: string }[] }[];
  generationConfig: Record<string, unknown>;
}

// Gemini responseSchema hanya menerima subset OpenAPI, BUKAN JSON Schema penuh — keyword seperti
// additionalProperties/minItems/minLength/format bisa memicu 400. Pertahankan hanya yang aman;
// jaminan bentuk sebenarnya tetap di Validation Pipeline sisi kita (§17.4).
function toGeminiSchema(schema: JSONSchema): Record<string, unknown> {
  const input = schema as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (typeof input.type === "string") out.type = input.type;
  if (typeof input.description === "string") out.description = input.description;
  if (Array.isArray(input.enum)) out.enum = input.enum;
  if (input.items && typeof input.items === "object") out.items = toGeminiSchema(input.items as JSONSchema);
  if (input.properties && typeof input.properties === "object") {
    const props: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input.properties as Record<string, unknown>)) {
      props[key] = toGeminiSchema(value as JSONSchema);
    }
    out.properties = props;
  }
  if (Array.isArray(input.required)) out.required = input.required;
  return out;
}

// Best-effort: lepas pembungkus code-fence umum sebelum JSON.parse (§17.7 — pertahanan kedua).
function tryParseJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function toTokenUsage(usage: GeminiUsageMetadata | undefined): AITokenUsage | undefined {
  if (!usage) return undefined;
  return {
    promptTokens: usage.promptTokenCount ?? 0,
    completionTokens: usage.candidatesTokenCount ?? 0,
    totalTokens: usage.totalTokenCount ?? 0
  };
}

function requireApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIProviderError("GEMINI_API_KEY belum diisi di .env.local — set AI_PROVIDER=gemini butuh key ini.", "MISSING_API_KEY");
  }
  return apiKey;
}

// Low-level: kirim satu request ke Gemini, tangani timeout/HTTP/blokir, kembalikan response
// terparse. Dipakai bersama oleh callGemini (JSON mode) dan chatWithGemini (teks). Key lewat
// header x-goog-api-key, bukan URL — jangan pernah menaruh secret di query string.
async function geminiRequest(model: string, apiKey: string, body: GeminiRequestBody): Promise<GeminiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    throw new AIProviderError(
      isAbort
        ? `Gemini tidak merespons dalam ${REQUEST_TIMEOUT_MS / 1000} detik.`
        : `Gagal menghubungi Gemini: ${error instanceof Error ? error.message : "network error"}`,
      isAbort ? "TIMEOUT" : "NETWORK"
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const rawBody = await response.text();
  let data: GeminiResponse | null = null;
  try {
    data = rawBody ? (JSON.parse(rawBody) as GeminiResponse) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error?.message ?? `HTTP ${response.status} ${response.statusText}`;
    // 429 = rate limit vendor → route TIDAK me-retry (§17.6). Selain itu HTTP_ERROR biasa.
    throw new AIProviderError(`Gemini mengembalikan error: ${message}`, response.status === 429 ? "RATE_LIMIT" : "HTTP_ERROR");
  }
  if (data?.promptFeedback?.blockReason) {
    throw new AIProviderError(`Permintaan diblokir Gemini (${data.promptFeedback.blockReason}).`, "BLOCKED");
  }
  if (!data) {
    throw new AIProviderError("Respons Gemini tidak dapat dibaca (bukan JSON valid).", "EMPTY");
  }
  return data;
}

function extractText(data: GeminiResponse): { text: string; finishReason?: string } {
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();
  return { text, finishReason: candidate?.finishReason };
}

// Structured output (JSON) — untuk summarize/generateFlashcards/generateQuiz/recommend.
async function callGemini(spec: PromptSpec, options?: GenerateOptions): Promise<AIGenerationResult> {
  const apiKey = requireApiKey();
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  const generationConfig: Record<string, unknown> = {
    temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
    maxOutputTokens: options?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    responseMimeType: "application/json"
  };
  if (spec.responseSchema) generationConfig.responseSchema = toGeminiSchema(spec.responseSchema);

  const data = await geminiRequest(model, apiKey, {
    systemInstruction: { parts: [{ text: spec.system }] },
    contents: [{ role: "user", parts: [{ text: spec.user }] }],
    generationConfig
  });

  const { text, finishReason } = extractText(data);
  if (!text) {
    throw new AIProviderError(`Gemini mengembalikan respons kosong${finishReason ? ` (finishReason: ${finishReason})` : ""}.`, "EMPTY");
  }

  return {
    raw: text,
    parsed: tryParseJson(text),
    tokenUsage: toTokenUsage(data.usageMetadata),
    provider: PROVIDER_NAME,
    model,
    finishReason
  };
}

// AI Assistant chat (Milestone E) — teks bebas, BUKAN JSON mode. Konteks tugas + riwayat
// disuntikkan ke satu user-turn (menghindari masalah alternasi role multi-turn Gemini).
async function chatWithGemini(message: string, tasks: Task[], history: ChatMessage[]): Promise<string> {
  const apiKey = requireApiKey();
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  const system =
    "Kamu adalah asisten belajar akademik untuk mahasiswa Indonesia. Bantu soal prioritas tugas, jadwal belajar, ringkasan tugas, dan tips belajar. Jawab ringkas, jelas, dan membantu dalam Bahasa Indonesia. Jangan mengarang data tugas yang tidak diberikan di konteks.";

  const active = sortTasks(tasks).filter((task) => task.status !== "Selesai").slice(0, 6);
  const taskContext = active.length
    ? "Tugas aktif user (urut prioritas):\n" +
      active.map((task, i) => `${i + 1}. ${task.title} — deadline ${task.deadlineDate} ${task.deadlineTime}, prioritas ${task.priority}, skor ${task.priorityScore}/100`).join("\n")
    : "User belum punya tugas aktif.";

  const recentHistory = history.slice(-6);
  const historyContext = recentHistory.length
    ? "Percakapan sebelumnya:\n" + recentHistory.map((m) => `${m.role === "user" ? "User" : "Asisten"}: ${m.content}`).join("\n")
    : "";

  const userText = [historyContext, taskContext, `Pertanyaan user: ${message}`].filter(Boolean).join("\n\n");

  const data = await geminiRequest(model, apiKey, {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 1024 }
  });

  const { text, finishReason } = extractText(data);
  if (!text) {
    throw new AIProviderError(`Gemini mengembalikan respons kosong${finishReason ? ` (finishReason: ${finishReason})` : ""}.`, "EMPTY");
  }
  return text;
}

// analyzeTask masih rule-based di route /api/ai/analyze (di luar cakupan freeze ini).
function analyzeNotWired(): never {
  throw new AIProviderError("analyzeTask untuk provider Gemini tidak dipakai — route /api/ai/analyze masih rule-based.", "NOT_CONFIGURED");
}

export const geminiProvider: AIProvider = {
  name: PROVIDER_NAME,
  analyzeTask: analyzeNotWired,
  chat: (message, tasks, history) => chatWithGemini(message, tasks, history),
  summarize: (spec, options) => callGemini(spec, options),
  generateFlashcards: (spec, options) => callGemini(spec, options),
  generateQuiz: (spec, options) => callGemini(spec, options),
  recommend: (spec, options) => callGemini(spec, options)
};
