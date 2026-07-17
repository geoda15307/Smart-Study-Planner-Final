import { NextResponse } from "next/server";
import type { AIQuizRouteRequest, AIQuizRouteResponse, AIQuizSetOutput } from "@/types";
import { guardAIRoute, aiError } from "@/lib/ai/guard";
import { getAIProvider } from "@/lib/ai/getAIProvider";
import { generateValidated } from "@/lib/ai/generate";
import { AIProviderError } from "@/lib/ai/errors";
import { businessValidateQuiz } from "@/lib/ai/validation";
import { AI_QUIZ_SET_OUTPUT_SCHEMA, buildQuizPrompt } from "@/lib/ai/prompts/quizPrompt";

// POST /api/ai/quiz — generate quiz dari AISummary (§7.3). temperature rendah supaya jawaban
// lebih deterministik (§4.2). Auth + Rate-limit via guard.
export async function POST(request: Request) {
  const guard = await guardAIRoute();
  if (!guard.ok) return guard.response;

  let body: AIQuizRouteRequest;
  try {
    body = (await request.json()) as AIQuizRouteRequest;
  } catch {
    return aiError(400, "BAD_REQUEST", "Body request tidak valid.");
  }

  if (!body.documentId || !body.summary) {
    return aiError(400, "BAD_REQUEST", "documentId dan summary wajib diisi.");
  }

  const provider = getAIProvider();
  const spec = buildQuizPrompt(body.summary, body.count);

  try {
    const gen = await generateValidated({
      call: (s, o) => provider.generateQuiz(s, o),
      spec,
      options: { temperature: 0.2 },
      schema: AI_QUIZ_SET_OUTPUT_SCHEMA,
      business: businessValidateQuiz
    });
    const response: AIQuizRouteResponse = { ...(gen.output as AIQuizSetOutput), provider: gen.provider, model: gen.model, tokenUsage: gen.tokenUsage };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AIProviderError && error.code === "RATE_LIMIT") {
      return aiError(429, "PROVIDER_RATE_LIMIT", "Provider AI sedang sibuk. Coba lagi sebentar.");
    }
    return aiError(502, "AI_GENERATION_FAILED", "Gagal membuat quiz dari AI. Coba lagi.");
  }
}
