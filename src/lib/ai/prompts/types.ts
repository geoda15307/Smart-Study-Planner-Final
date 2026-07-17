// Tipe generik lapisan Prompt Builder (AI_ARCHITECTURE_FREEZE §5) — murni data,
// provider-agnostic. Sengaja TIDAK di src/types/index.ts: ini tipe lapisan prompt
// (dipakai server-side oleh route + provider nanti), bukan domain model aplikasi —
// pengecualian yang ditetapkan eksplisit oleh freeze §5.1.

// Alias sempit — cukup untuk membawa JSON Schema sebagai data ke provider (§17.3),
// tanpa mengikat ke library validator tertentu.
export type JSONSchema = Record<string, unknown>;

export interface PromptSpec {
  system: string;
  user: string;
  responseSchema?: JSONSchema;
}

export type PromptBuilder<TInput> = (input: TInput) => PromptSpec;

// §17.9 — versi GLOBAL mekanisme kontrak output. Naik hanya kalau fondasi mekanismenya
// berubah (bentuk envelope, tahapan Validation Pipeline) — bukan saat isi satu prompt
// berubah (itu urusan *_PROMPT_VERSION per fitur, yang membatalkan cache fitur itu saja).
export const AI_CONTRACT_VERSION = 1;
