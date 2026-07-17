"use client";

import { useEffect, useState } from "react";
import type { AIFlashcardSet, AISummary } from "@/types";
import { aiRepository } from "@/services/ai/aiRepository";
import { generateFlashcards } from "@/services/ai/flashcardService";
import { Button } from "@/components/common/Button";
import { AIError, AILoading, AIStaleNote, errorMessage } from "./AIStates";

export function AIFlashcardView({ documentId, summary, filename }: { documentId: string; summary: AISummary; filename?: string }) {
  const [set, setSet] = useState<AIFlashcardSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    aiRepository.getFlashcardSet(documentId).then((existing) => {
      if (active) setSet(existing ?? null);
    });
    return () => {
      active = false;
    };
  }, [documentId]);

  const stale = set !== null && set.summaryId !== summary.id;

  async function run(force = false) {
    setLoading(true);
    setError("");
    try {
      const result = await generateFlashcards(documentId, { force, filename });
      setSet(result);
      setRevealed({});
    } catch (err) {
      setError(errorMessage(err, "Gagal membuat flashcard."));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <AILoading label="Membuat flashcard..." />;

  if (!set || stale) {
    return (
      <div className="space-y-2">
        {stale ? <AIStaleNote /> : null}
        {error ? <AIError message={error} onRetry={() => run(stale)} /> : null}
        <Button variant="secondary" onClick={() => run(stale)}>
          {set ? "Generate ulang flashcard" : "Buat Flashcard"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <AIError message={error} onRetry={() => run(true)} /> : null}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black text-slate-900">
          {set.title} <span className="font-bold text-slate-400">· {set.cards.length} kartu</span>
        </p>
        <button type="button" onClick={() => run(true)} className="shrink-0 text-xs font-bold text-primary-600 hover:underline">
          Generate ulang
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {set.cards.map((card) => {
          const open = revealed[card.id];
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setRevealed((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
              className="flex min-h-[92px] flex-col rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-primary-200"
            >
              <p className="text-xs font-black text-slate-900">{card.question}</p>
              <p className={`mt-2 flex-1 text-xs ${open ? "text-slate-600" : "text-slate-400"}`}>
                {open ? card.answer : "Ketuk untuk lihat jawaban"}
              </p>
              <span className="mt-2 inline-block w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{card.difficulty}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
