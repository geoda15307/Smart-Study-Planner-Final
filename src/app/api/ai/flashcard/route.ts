import { NextResponse } from "next/server";
import type { AIFlashcardRouteRequest, AIFlashcardRouteResponse, AIFlashcardSetOutput } from "@/types";
import { guardAIRoute, aiError } from "@/lib/ai/guard";
import { getAIProvider } from "@/lib/ai/getAIProvider";
import { generateValidated } from "@/lib/ai/generate";
import { AIProviderError } from "@/lib/ai/errors";
import { businessValidateFlashcards } from "@/lib/ai/validation";
import { AI_FLASHCARD_SET_OUTPUT_SCHEMA, buildFlashcardPrompt } from "@/lib/ai/prompts/flashcardPrompt";

// POST /api/ai/flashcard — generate flashcard dari AISummary (§7.3). Input adalah ringkasan
// (bukan teks mentah, §3.2) — tidak butuh chunking. Auth + Rate-limit via guard.
export async function POST(request: Request) {
  const guard = await guardAIRoute();
  if (!guard.ok) return guard.response;

  let body: AIFlashcardRouteRequest;
  try {
    body = (await request.json()) as AIFlashcardRouteRequest;
  } catch {
    return aiError(400, "BAD_REQUEST", "Body request tidak valid.");
  }

  if (!body.documentId || !body.summary) {
    return aiError(400, "BAD_REQUEST", "documentId dan summary wajib diisi.");
  }

  const provider = getAIProvider();
  const spec = buildFlashcardPrompt(body.summary, body.count);

  try {
    const gen = await generateValidated({
      call: (s, o) => provider.generateFlashcards(s, o),
      spec,
      options: { temperature: 0.5 },
      schema: AI_FLASHCARD_SET_OUTPUT_SCHEMA,
      business: businessValidateFlashcards
    });
    const response: AIFlashcardRouteResponse = { ...(gen.output as AIFlashcardSetOutput), provider: gen.provider, model: gen.model, tokenUsage: gen.tokenUsage };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AIProviderError && error.code === "RATE_LIMIT") {
      return aiError(429, "PROVIDER_RATE_LIMIT", "Provider AI sedang sibuk. Coba lagi sebentar.");
    }
    return aiError(502, "AI_GENERATION_FAILED", "Gagal membuat flashcard dari AI. Coba lagi.");
  }
}
