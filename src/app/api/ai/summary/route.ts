import { NextResponse } from "next/server";
import type { AISummaryDirectResponse, AISummaryOutput, AISummaryRouteRequest } from "@/types";
import { guardAIRoute, aiError } from "@/lib/ai/guard";
import { getAIProvider } from "@/lib/ai/getAIProvider";
import { generateValidated } from "@/lib/ai/generate";
import { AIProviderError } from "@/lib/ai/errors";
import { businessValidateChunkSummary, businessValidateSummary } from "@/lib/ai/validation";
import {
  AI_SUMMARY_OUTPUT_SCHEMA,
  CHUNK_SUMMARY_OUTPUT_SCHEMA,
  buildChunkSummaryPrompt,
  buildMergeSummaryPrompt,
  buildSummaryPrompt
} from "@/lib/ai/prompts/summaryPrompt";

// POST /api/ai/summary — batas server untuk generate ringkasan (§7.3). Menangani 3 mode
// chunking (§6): direct (teks pendek langsung), chunk (ringkas satu bagian), merge (gabung
// ringkasan parsial). Auth + Rate-limit dijalankan lebih dulu lewat guard; tiap mode = satu
// permintaan tersendiri yang dihitung di ai_usage_log (§14.2).

export async function POST(request: Request) {
  const guard = await guardAIRoute();
  if (!guard.ok) return guard.response;

  let body: AISummaryRouteRequest;
  try {
    body = (await request.json()) as AISummaryRouteRequest;
  } catch {
    return aiError(400, "BAD_REQUEST", "Body request tidak valid.");
  }

  if (!body.documentId || !body.mode) {
    return aiError(400, "BAD_REQUEST", "documentId dan mode wajib diisi.");
  }

  const provider = getAIProvider();

  try {
    if (body.mode === "chunk") {
      if (!body.text) return aiError(400, "BAD_REQUEST", "text wajib untuk mode chunk.");
      const spec = buildChunkSummaryPrompt(body.text, body.index ?? 0, body.total ?? 1);
      const gen = await generateValidated({
        call: (s, o) => provider.summarize(s, o),
        spec,
        options: { temperature: 0.3, maxOutputTokens: 2048 },
        schema: CHUNK_SUMMARY_OUTPUT_SCHEMA,
        business: businessValidateChunkSummary
      });
      const output = gen.output as { summary: string };
      return NextResponse.json({ summary: output.summary, provider: gen.provider, model: gen.model, tokenUsage: gen.tokenUsage });
    }

    if (body.mode === "merge") {
      if (!Array.isArray(body.partials) || body.partials.length === 0) {
        return aiError(400, "BAD_REQUEST", "partials wajib (array non-kosong) untuk mode merge.");
      }
      const spec = buildMergeSummaryPrompt(body.partials, body.meta ?? {});
      const gen = await generateValidated({
        call: (s, o) => provider.summarize(s, o),
        spec,
        options: { temperature: 0.3 },
        schema: AI_SUMMARY_OUTPUT_SCHEMA,
        business: businessValidateSummary
      });
      const response: AISummaryDirectResponse = { ...(gen.output as AISummaryOutput), provider: gen.provider, model: gen.model, tokenUsage: gen.tokenUsage };
      return NextResponse.json(response);
    }

    // mode direct
    if (!body.text) return aiError(400, "BAD_REQUEST", "text wajib untuk mode direct.");
    const spec = buildSummaryPrompt(body.text, body.meta ?? {});
    const gen = await generateValidated({
      call: (s, o) => provider.summarize(s, o),
      spec,
      options: { temperature: 0.3 },
      schema: AI_SUMMARY_OUTPUT_SCHEMA,
      business: businessValidateSummary
    });
    const response: AISummaryDirectResponse = { ...(gen.output as AISummaryOutput), provider: gen.provider, model: gen.model, tokenUsage: gen.tokenUsage };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AIProviderError && error.code === "RATE_LIMIT") {
      return aiError(429, "PROVIDER_RATE_LIMIT", "Provider AI sedang sibuk. Coba lagi sebentar.");
    }
    return aiError(502, "AI_GENERATION_FAILED", "Gagal membuat ringkasan dari AI. Coba lagi.");
  }
}
