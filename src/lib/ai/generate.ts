import type { AITokenUsage } from "@/types";
import type { AIGenerationResult, GenerateOptions } from "./types";
import type { JSONSchema, PromptSpec } from "./prompts/types";
import { AIProviderError, AIValidationError } from "./errors";
import { tryParseJson, validateAgainstSchema } from "./validation";

// Orchestrator generate + Validation Pipeline + Retry (AI_ARCHITECTURE_FREEZE §17.4/§17.6).
// Server-only. Dipanggil route setelah gerbang Auth+Rate-limit (guard) lolos.

const MAX_ATTEMPTS = 2; // 1 percobaan + 1 retry (§17.6)

export interface GeneratedContent {
  output: unknown; // parsed + tervalidasi (aman di-cast di pemanggil, §17.4)
  provider: string;
  model: string;
  tokenUsage?: AITokenUsage; // menjumlahkan seluruh percobaan (§17.6)
}

function addTokenUsage(acc: AITokenUsage | undefined, next: AITokenUsage | undefined): AITokenUsage | undefined {
  if (!next) return acc;
  if (!acc) return { ...next };
  return {
    promptTokens: acc.promptTokens + next.promptTokens,
    completionTokens: acc.completionTokens + next.completionTokens,
    totalTokens: acc.totalTokens + next.totalTokens
  };
}

export async function generateValidated(opts: {
  call: (spec: PromptSpec, options?: GenerateOptions) => Promise<AIGenerationResult>;
  spec: PromptSpec;
  options?: GenerateOptions;
  schema: JSONSchema;
  business?: (data: unknown) => string[];
}): Promise<GeneratedContent> {
  let tokenUsage: AITokenUsage | undefined;
  let lastErrors: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let result: AIGenerationResult;
    try {
      result = await opts.call(opts.spec, opts.options);
    } catch (error) {
      // Provider rate-limit vendor TIDAK di-retry (§17.6) — teruskan supaya route memetakan 429.
      if (error instanceof AIProviderError && error.code === "RATE_LIMIT") throw error;
      lastErrors = [error instanceof Error ? error.message : "provider error"];
      if (attempt < MAX_ATTEMPTS) continue;
      throw new AIProviderError(lastErrors[0], error instanceof AIProviderError ? error.code : "PROVIDER_ERROR");
    }

    tokenUsage = addTokenUsage(tokenUsage, result.tokenUsage);

    const parsed = tryParseJson(result.raw);
    if (parsed === undefined) {
      lastErrors = ["JSON tidak valid"];
      if (attempt < MAX_ATTEMPTS) continue;
      break;
    }

    const schemaErrors = validateAgainstSchema(parsed, opts.schema);
    const businessErrors = opts.business ? opts.business(parsed) : [];
    if (schemaErrors.length === 0 && businessErrors.length === 0) {
      return { output: parsed, provider: result.provider, model: result.model, tokenUsage };
    }
    lastErrors = [...schemaErrors, ...businessErrors];
    // retry (kalau masih ada percobaan)
  }

  throw new AIValidationError("Hasil AI gagal validasi setelah retry.", lastErrors);
}
