"use client";

import { useEffect, useState } from "react";
import type { AICalendarSuggestion, AIRecommendation, AISummary, AITaskSuggestion, Category, StudySession, Task } from "@/types";
import { aiRepository } from "@/services/ai/aiRepository";
import { generateRecommendation } from "@/services/ai/recommendationService";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/common/Button";
import { PriorityBadge } from "@/components/common/Badge";
import { createId } from "@/utils/id";
import { nowISO, todayISO } from "@/utils/date";
import { AIError, AILoading, AIStaleNote, errorMessage } from "./AIStates";

function inDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

// Pemetaan saran AI → entity aplikasi yang sudah ada. Aksi searah & manual (§3.2). Jejak asal
// dicatat lewat sourceDocumentId + sourceSuggestionId; priorityScore dihitung ulang oleh addTask.
function suggestionToTask(suggestion: AITaskSuggestion, documentId: string, categories: Category[]): Task {
  const category = categories.find((c) => c.id === "lainnya") ?? categories[0];
  const timestamp = nowISO();
  return {
    id: createId("task"),
    title: suggestion.title,
    courseId: "-",
    courseName: "-",
    categoryId: category?.id ?? "lainnya",
    description: suggestion.description ?? suggestion.reasoning,
    deadlineDate: suggestion.dueDateHint || inDays(7),
    deadlineTime: "23:59",
    priority: suggestion.priorityHint ?? "Medium",
    difficulty: "Medium",
    estimatedDurationMinutes: suggestion.estimatedDurationMinutes ?? 60,
    priorityScore: 0,
    status: "Belum Mulai",
    tags: [],
    subtasks: [],
    sourceDocumentId: documentId,
    sourceSuggestionId: suggestion.id,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function suggestionToStudySession(suggestion: AICalendarSuggestion, documentId: string): StudySession {
  const date = suggestion.suggestedDate || todayISO();
  const start = suggestion.suggestedStartTime || "19:00";
  const end = suggestion.suggestedEndTime || "20:00";
  return {
    id: createId("session"),
    title: suggestion.title,
    startTime: `${date}T${start}:00`,
    endTime: `${date}T${end}:00`,
    status: "Terjadwal",
    source: "ai",
    sourceDocumentId: documentId,
    sourceSuggestionId: suggestion.id
  };
}

export function AIRecommendationView({ documentId, summary, filename }: { documentId: string; summary: AISummary; filename?: string }) {
  const [rec, setRec] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const categories = useAppStore((state) => state.categories);
  const addTask = useAppStore((state) => state.addTask);
  const addStudySession = useAppStore((state) => state.addStudySession);

  useEffect(() => {
    let active = true;
    aiRepository.getRecommendation(documentId).then((existing) => {
      if (active) setRec(existing ?? null);
    });
    return () => {
      active = false;
    };
  }, [documentId]);

  const stale = rec !== null && rec.summaryId !== summary.id;

  async function run(force = false) {
    setLoading(true);
    setError("");
    try {
      const result = await generateRecommendation(documentId, { force, filename });
      setRec(result);
    } catch (err) {
      setError(errorMessage(err, "Gagal membuat rekomendasi."));
    } finally {
      setLoading(false);
    }
  }

  async function applyTask(suggestion: AITaskSuggestion) {
    if (!rec) return;
    const task = suggestionToTask(suggestion, documentId, categories);
    addTask(task);
    const updated: AIRecommendation = {
      ...rec,
      taskSuggestions: rec.taskSuggestions.map((s) => (s.id === suggestion.id ? { ...s, status: "applied", appliedTaskId: task.id } : s))
    };
    setRec(updated);
    await aiRepository.saveRecommendation(updated);
  }

  async function applyCalendar(suggestion: AICalendarSuggestion) {
    if (!rec) return;
    const session = suggestionToStudySession(suggestion, documentId);
    addStudySession(session);
    const updated: AIRecommendation = {
      ...rec,
      calendarSuggestions: rec.calendarSuggestions.map((s) => (s.id === suggestion.id ? { ...s, status: "applied", appliedSessionId: session.id } : s))
    };
    setRec(updated);
    await aiRepository.saveRecommendation(updated);
  }

  if (loading) return <AILoading label="Membuat rekomendasi..." />;

  if (!rec || stale) {
    return (
      <div className="space-y-2">
        {stale ? <AIStaleNote /> : null}
        {error ? <AIError message={error} onRetry={() => run(stale)} /> : null}
        <Button variant="secondary" onClick={() => run(stale)}>
          {rec ? "Generate ulang rekomendasi" : "Buat Rekomendasi"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <AIError message={error} onRetry={() => run(true)} /> : null}
      <div className="flex items-center justify-end">
        <button type="button" onClick={() => run(true)} className="text-xs font-bold text-primary-600 hover:underline">
          Generate ulang
        </button>
      </div>

      {rec.taskSuggestions.length ? (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Saran Tugas</p>
          {rec.taskSuggestions.map((suggestion) => {
            const applied = suggestion.status === "applied";
            return (
              <div key={suggestion.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-black text-slate-900">{suggestion.title}</p>
                  {suggestion.priorityHint ? <PriorityBadge priority={suggestion.priorityHint} /> : null}
                </div>
                {suggestion.description ? <p className="mt-1 text-xs text-slate-600">{suggestion.description}</p> : null}
                <p className="mt-1 text-[11px] text-slate-400">{suggestion.reasoning}</p>
                <div className="mt-2">
                  {applied ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">✓ Ditambahkan ke Tugas</span>
                  ) : (
                    <Button variant="secondary" onClick={() => applyTask(suggestion)}>Tambahkan ke Tugas</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {rec.calendarSuggestions.length ? (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Saran Kalender</p>
          {rec.calendarSuggestions.map((suggestion) => {
            const applied = suggestion.status === "applied";
            const timeLabel = [suggestion.suggestedDate || "tanggal belum ditentukan", suggestion.suggestedStartTime && suggestion.suggestedEndTime ? `${suggestion.suggestedStartTime}–${suggestion.suggestedEndTime}` : ""].filter(Boolean).join(" · ");
            return (
              <div key={suggestion.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-black text-slate-900">{suggestion.title}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">{timeLabel}</p>
                <p className="mt-1 text-[11px] text-slate-400">{suggestion.reasoning}</p>
                <div className="mt-2">
                  {applied ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">✓ Ditambahkan ke Kalender</span>
                  ) : (
                    <Button variant="secondary" onClick={() => applyCalendar(suggestion)}>Tambahkan ke Kalender</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {!rec.taskSuggestions.length && !rec.calendarSuggestions.length ? (
        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">AI tidak menghasilkan saran untuk dokumen ini.</p>
      ) : null}
    </div>
  );
}
