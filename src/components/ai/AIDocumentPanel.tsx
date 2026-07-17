"use client";

import { useEffect, useState } from "react";
import type { AISummary } from "@/types";
import { aiRepository } from "@/services/ai/aiRepository";
import { generateSummary } from "@/services/ai/documentSummaryService";
import { Button } from "@/components/common/Button";
import { AIError, AILoading, errorMessage } from "./AIStates";
import { AIFlashcardView } from "./AIFlashcardView";
import { AIQuizView } from "./AIQuizView";
import { AIRecommendationView } from "./AIRecommendationView";

type Tab = "flashcard" | "quiz" | "recommendation";

const strategyLabel: Record<AISummary["generationStrategy"], string> = {
  direct: "",
  chunked: "Dokumen panjang — diringkas bertahap.",
  hierarchical: "Dokumen sangat panjang — diringkas bertingkat."
};

// Panel AI per-dokumen (AI_ARCHITECTURE_FREEZE §11). Generate on-demand (bukan otomatis saat
// upload — hemat token). Semua aksi lewat service Milestone D (cache-check, chunking, dst.).
export function AIDocumentPanel({ documentId, filename }: { documentId: string; filename?: string }) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab | null>(null);

  useEffect(() => {
    let active = true;
    aiRepository.getSummary(documentId).then((existing) => {
      if (active) setSummary(existing ?? null);
    });
    return () => {
      active = false;
    };
  }, [documentId]);

  async function run(force = false) {
    setLoading(true);
    setError("");
    try {
      const result = await generateSummary(documentId, { force, filename });
      setSummary(result);
    } catch (err) {
      setError(errorMessage(err, "Gagal membuat ringkasan."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 rounded-2xl border border-primary-100 bg-primary-50/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-primary-700">✨ Asisten AI</p>
        {summary ? (
          <button type="button" onClick={() => run(true)} disabled={loading} className="text-xs font-bold text-primary-600 hover:underline disabled:opacity-50">
            Generate ulang ringkasan
          </button>
        ) : null}
      </div>

      {loading ? <AILoading label="Membuat ringkasan AI... (dokumen panjang bisa memakan waktu)" /> : null}

      {!summary && !loading ? (
        <div className="mt-2 space-y-2">
          {error ? <AIError message={error} onRetry={() => run()} /> : null}
          <Button onClick={() => run()}>Buat Ringkasan AI</Button>
        </div>
      ) : null}

      {summary && !loading ? (
        <div className="mt-2 space-y-3">
          {error ? <AIError message={error} onRetry={() => run(true)} /> : null}

          <div className="rounded-2xl bg-white p-3">
            <p className="text-sm font-black text-slate-900">{summary.title}</p>
            <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-600">{summary.summary}</p>

            {summary.keyPoints.length ? (
              <ul className="mt-2 space-y-1">
                {summary.keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-700">
                    <span className="text-primary-500">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}

            {summary.keywords.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {summary.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{keyword}</span>
                ))}
              </div>
            ) : null}

            {summary.formulas?.length ? (
              <div className="mt-2 rounded-xl bg-slate-50 p-2">
                <p className="text-[10px] font-black uppercase text-slate-400">Rumus</p>
                {summary.formulas.map((formula, i) => (
                  <p key={i} className="text-xs text-slate-700">{formula}</p>
                ))}
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400">
              <span>Kesulitan: {summary.difficulty}</span>
              <span>~{summary.estimatedReadingTime} menit baca</span>
              <span>Bahasa: {summary.language}</span>
              <span>Keyakinan: {Math.round(summary.confidence * 100)}%</span>
            </div>
            {strategyLabel[summary.generationStrategy] ? (
              <p className="mt-1 text-[10px] text-slate-400">{strategyLabel[summary.generationStrategy]}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {(["flashcard", "quiz", "recommendation"] as Tab[]).map((item) => {
              const label = item === "flashcard" ? "Flashcard" : item === "quiz" ? "Quiz" : "Rekomendasi";
              const active = tab === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(active ? null : item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${active ? "bg-primary-600 text-white" : "bg-white text-primary-700 hover:bg-primary-100"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {tab === "flashcard" ? <AIFlashcardView documentId={documentId} summary={summary} filename={filename} /> : null}
          {tab === "quiz" ? <AIQuizView documentId={documentId} summary={summary} filename={filename} /> : null}
          {tab === "recommendation" ? <AIRecommendationView documentId={documentId} summary={summary} filename={filename} /> : null}

          <p className="text-[10px] text-slate-300">Dihasilkan oleh {summary.provider}/{summary.model}</p>
        </div>
      ) : null}
    </div>
  );
}
