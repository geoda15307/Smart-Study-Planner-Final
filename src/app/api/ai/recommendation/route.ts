import { NextResponse } from "next/server";
import type { AIRecommendationOutput, AIRecommendationRouteRequest, AIRecommendationRouteResponse } from "@/types";
import { guardAIRoute, aiError } from "@/lib/ai/guard";
import { getAIProvider } from "@/lib/ai/getAIProvider";
import { generateValidated } from "@/lib/ai/generate";
import { AIProviderError } from "@/lib/ai/errors";
import { businessValidateRecommendation } from "@/lib/ai/validation";
import { AI_RECOMMENDATION_OUTPUT_SCHEMA, buildRecommendationPrompt } from "@/lib/ai/prompts/recommendationPrompt";

// POST /api/ai/recommendation — satu panggilan menghasilkan saran Task+Study+Calendar sekaligus
// (§4.3, output polymorphic §17.2). Pemetaan ke bentuk penyimpanan dua-array terjadi di Service
// (client), bukan di sini. Auth + Rate-limit via guard.
export async function POST(request: Request) {
  const guard = await guardAIRoute();
  if (!guard.ok) return guard.response;

  let body: AIRecommendationRouteRequest;
  try {
    body = (await request.json()) as AIRecommendationRouteRequest;
  } catch {
    return aiError(400, "BAD_REQUEST", "Body request tidak valid.");
  }

  if (!body.documentId || !body.summary) {
    return aiError(400, "BAD_REQUEST", "documentId dan summary wajib diisi.");
  }

  const provider = getAIProvider();
  const spec = buildRecommendationPrompt(body.summary);

  try {
    const gen = await generateValidated({
      call: (s, o) => provider.recommend(s, o),
      spec,
      options: { temperature: 0.5 },
      schema: AI_RECOMMENDATION_OUTPUT_SCHEMA,
      business: businessValidateRecommendation
    });
    const response: AIRecommendationRouteResponse = { ...(gen.output as AIRecommendationOutput), provider: gen.provider, model: gen.model, tokenUsage: gen.tokenUsage };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AIProviderError && error.code === "RATE_LIMIT") {
      return aiError(429, "PROVIDER_RATE_LIMIT", "Provider AI sedang sibuk. Coba lagi sebentar.");
    }
    return aiError(502, "AI_GENERATION_FAILED", "Gagal membuat rekomendasi dari AI. Coba lagi.");
  }
}
