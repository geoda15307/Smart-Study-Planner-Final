import type { AIChunkSummaryResponse, AISummary, AISummaryDirectResponse, AITokenUsage } from "@/types";
import { aiRepository } from "./aiRepository";
import { postAI } from "./aiApi";
import { documentRepository } from "@/services/document/documentRepository";
import { computeSourceTextHash, isSummaryCacheValid } from "@/lib/ai/cache";
import { SUMMARY_DIRECT_MAX_CHARS, TARGET_CHUNK_CHARS, splitIntoChunks } from "@/lib/ai/chunking";
import { SUMMARY_PROMPT_VERSION } from "@/lib/ai/prompts/versions";
import { createId } from "@/utils/id";
import { nowISO } from "@/utils/date";

// Orchestrator ringkasan (AI_ARCHITECTURE_FREEZE §6.3/§7.1/§9). Client-only. SATU-SATUNYA tempat
// teks mentah (content.text) pernah dikirim ke AI; fitur turunan memakai AISummary (§3.2).
// Boundary §7.2: Service TIDAK mengimpor Prompt Builder / provider — hanya kirim teks + mode
// ke route sendiri. Cek cache + hitung SHA-256 di client supaya cache-hit = nol network.

const MAX_HIERARCHICAL_ROUNDS = 5; // pengaman anti-loop untuk dokumen ekstrem (§6.4)

export interface GenerateSummaryOptions {
  force?: boolean; // "Generate Ulang" (§9.3) — lewati cache
  filename?: string; // untuk judul yang lebih deskriptif (opsional)
}

function totalLength(pieces: string[]): number {
  return pieces.reduce((sum, piece) => sum + piece.length, 0);
}

function addUsage(acc: AITokenUsage | undefined, next: AITokenUsage | undefined): AITokenUsage | undefined {
  if (!next) return acc;
  if (!acc) return { ...next };
  return {
    promptTokens: acc.promptTokens + next.promptTokens,
    completionTokens: acc.completionTokens + next.completionTokens,
    totalTokens: acc.totalTokens + next.totalTokens
  };
}

export async function generateSummary(documentId: string, options: GenerateSummaryOptions = {}): Promise<AISummary> {
  const record = await documentRepository.findById(documentId);
  if (!record?.content?.text) {
    throw new Error("Dokumen ini belum punya teks hasil ekstraksi untuk diringkas.");
  }
  const text = record.content.text;
  const sourceTextHash = await computeSourceTextHash(text);

  // Cache-check (§9.2): valid & tidak dipaksa → kembalikan, nol panggilan AI / nol token.
  const existing = await aiRepository.getSummary(documentId);
  if (!options.force && isSummaryCacheValid(existing, sourceTextHash, SUMMARY_PROMPT_VERSION)) {
    return existing;
  }

  const meta = options.filename ? { filename: options.filename } : {};
  let output: AISummaryDirectResponse;
  let strategy: AISummary["generationStrategy"];
  let tokenUsage: AITokenUsage | undefined;

  if (text.length <= SUMMARY_DIRECT_MAX_CHARS) {
    // Teks pendek — kirim utuh, satu panggilan (§6.1).
    output = await postAI<AISummaryDirectResponse>("/api/ai/summary", { documentId, mode: "direct", text, meta });
    strategy = "direct";
    tokenUsage = output.tokenUsage;
  } else {
    // Dokumen panjang — chunking, diterapkan berulang sampai gabungan cukup kecil (§6.3).
    let pieces = splitIntoChunks(text, TARGET_CHUNK_CHARS);
    let rounds = 0;
    while (totalLength(pieces) > SUMMARY_DIRECT_MAX_CHARS && rounds < MAX_HIERARCHICAL_ROUNDS) {
      rounds++;
      const partials: string[] = [];
      for (let i = 0; i < pieces.length; i++) {
        const res = await postAI<AIChunkSummaryResponse>("/api/ai/summary", {
          documentId,
          mode: "chunk",
          text: pieces[i],
          index: i,
          total: pieces.length
        });
        partials.push(res.summary);
        tokenUsage = addUsage(tokenUsage, res.tokenUsage);
      }
      pieces = splitIntoChunks(partials.join("\n\n"), TARGET_CHUNK_CHARS);
    }
    output = await postAI<AISummaryDirectResponse>("/api/ai/summary", { documentId, mode: "merge", partials: pieces, meta });
    tokenUsage = addUsage(tokenUsage, output.tokenUsage);
    strategy = rounds > 1 ? "hierarchical" : "chunked";
  }

  // Service merakit record domain penuh: field konten dari route + provenance/storage lokal (§17.2).
  const summary: AISummary = {
    title: output.title,
    summary: output.summary,
    keyPoints: output.keyPoints,
    keywords: output.keywords,
    formulas: output.formulas,
    difficulty: output.difficulty,
    estimatedReadingTime: output.estimatedReadingTime,
    language: output.language,
    confidence: output.confidence,
    id: createId("sum"),
    documentId,
    summaryVersion: (existing?.summaryVersion ?? 0) + 1,
    sourceTextHash,
    promptVersion: SUMMARY_PROMPT_VERSION,
    generationStrategy: strategy,
    provider: output.provider,
    model: output.model,
    tokenUsage,
    createdAt: existing?.createdAt ?? nowISO(),
    updatedAt: nowISO()
  };

  await aiRepository.saveSummary(summary);
  return summary;
}
