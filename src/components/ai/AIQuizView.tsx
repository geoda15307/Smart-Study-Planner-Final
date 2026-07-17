"use client";

import { useEffect, useState } from "react";
import type { AIQuizSet, AISummary } from "@/types";
import { aiRepository } from "@/services/ai/aiRepository";
import { generateQuiz } from "@/services/ai/quizService";
import { Button } from "@/components/common/Button";
import { AIError, AILoading, AIStaleNote, errorMessage } from "./AIStates";

export function AIQuizView({ documentId, summary, filename }: { documentId: string; summary: AISummary; filename?: string }) {
  const [set, setSet] = useState<AIQuizSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // questionId -> index opsi yang dipilih (terkunci begitu dipilih)
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    aiRepository.getQuizSet(documentId).then((existing) => {
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
      const result = await generateQuiz(documentId, { force, filename });
      setSet(result);
      setAnswers({});
    } catch (err) {
      setError(errorMessage(err, "Gagal membuat quiz."));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <AILoading label="Membuat quiz..." />;

  if (!set || stale) {
    return (
      <div className="space-y-2">
        {stale ? <AIStaleNote /> : null}
        {error ? <AIError message={error} onRetry={() => run(stale)} /> : null}
        <Button variant="secondary" onClick={() => run(stale)}>
          {set ? "Generate ulang quiz" : "Buat Quiz"}
        </Button>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const score = set.questions.filter((question) => answers[question.id] === question.correctIndex).length;

  return (
    <div className="space-y-3">
      {error ? <AIError message={error} onRetry={() => run(true)} /> : null}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black text-slate-900">
          {set.title} <span className="font-bold text-slate-400">· {set.questions.length} soal</span>
        </p>
        <button type="button" onClick={() => run(true)} className="shrink-0 text-xs font-bold text-primary-600 hover:underline">
          Generate ulang
        </button>
      </div>

      {answeredCount === set.questions.length ? (
        <p className="rounded-xl bg-emerald-50 p-2.5 text-xs font-black text-emerald-700">
          Skor kamu: {score}/{set.questions.length}
        </p>
      ) : null}

      <div className="space-y-3">
        {set.questions.map((question, qIndex) => {
          const selected = answers[question.id];
          const locked = selected !== undefined;
          return (
            <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-black text-slate-900">
                {qIndex + 1}. {question.question}
              </p>
              <div className="mt-2 space-y-1.5">
                {question.options.map((option, oIndex) => {
                  const isCorrect = oIndex === question.correctIndex;
                  const isChosen = oIndex === selected;
                  let tone = "border-slate-200 bg-slate-50 text-slate-700 hover:border-primary-200";
                  if (locked && isCorrect) tone = "border-emerald-300 bg-emerald-50 text-emerald-700";
                  else if (locked && isChosen) tone = "border-red-300 bg-red-50 text-red-700";
                  else if (locked) tone = "border-slate-200 bg-white text-slate-400";
                  return (
                    <button
                      key={oIndex}
                      type="button"
                      disabled={locked}
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: oIndex }))}
                      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition disabled:cursor-default ${tone}`}
                    >
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-[10px]">{String.fromCharCode(65 + oIndex)}</span>
                      {option}
                    </button>
                  );
                })}
              </div>
              {locked ? (
                <p className="mt-2 rounded-xl bg-slate-50 p-2 text-[11px] text-slate-600">
                  <span className="font-black text-slate-900">Penjelasan: </span>
                  {question.explanation}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
