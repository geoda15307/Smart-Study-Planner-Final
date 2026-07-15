"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { Task } from "@/types";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { PriorityBadge, StatusBadge } from "@/components/common/Badge";
import { useAppStore } from "@/store/useAppStore";
import { analyzeTask } from "@/services/ai/aiService";
import { deadlineLabel } from "@/utils/date";
import { riskLevel } from "@/utils/priorityScore";
import { CategoryIcon } from "@/components/category/CategoryIcon";

const accent: Record<Task["priority"], string> = {
  Low: "border-l-emerald-400",
  Medium: "border-l-yellow-400",
  High: "border-l-orange-400",
  Urgent: "border-l-red-500"
};

const riskStyle = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700"
} as const;

const riskLabel = {
  low: "Risiko Rendah",
  medium: "Risiko Sedang",
  high: "Risiko Tinggi"
} as const;

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const task = useAppStore((state) => state.tasks.find((item) => item.id === params.id));
  const category = useAppStore((state) => state.categories.find((item) => item.id === task?.categoryId));
  const updateTask = useAppStore((state) => state.updateTask);
  const completeTask = useAppStore((state) => state.completeTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!task) return <AppShell title="Task tidak ditemukan"><Card>Task tidak ditemukan.</Card></AppShell>;

  const currentTask = task;
  const risk = riskLevel(currentTask.priorityScore);
  const done = currentTask.subtasks.filter((item) => item.completed).length;
  const progress = currentTask.subtasks.length ? Math.round((done / currentTask.subtasks.length) * 100) : currentTask.status === "Selesai" ? 100 : 0;

  function updateSubtask(subtaskId: string, updates: { title?: string; completed?: boolean }) {
    updateTask(currentTask.id, {
      subtasks: currentTask.subtasks.map((item) => item.id === subtaskId ? { ...item, ...updates } : item)
    });
  }

  function removeSubtask(subtaskId: string) {
    updateTask(currentTask.id, {
      subtasks: currentTask.subtasks.filter((item) => item.id !== subtaskId)
    });
  }

  async function runAI() {
    setLoading(true);
    setError("");
    try {
      const analysis = await analyzeTask(currentTask);
      updateTask(currentTask.id, { aiAnalysis: analysis });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analisis AI gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Detail Task" subtitle="Fokus pada satu tugas: info inti, subtask, dan analisis AI.">
      <div className="space-y-5">
        <Card className={`border-l-4 ${accent[currentTask.priority]}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryIcon category={category} className="h-9 w-9 text-lg" />
                <PriorityBadge priority={currentTask.priority} />
                <StatusBadge status={currentTask.status} />
              </div>
              <h2 className="mt-4 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{currentTask.title}</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">{currentTask.courseName}</p>
              <p className={`mt-1 text-sm font-bold ${currentTask.status === "Terlambat" ? "text-red-600" : "text-slate-600"}`}>
                Deadline {deadlineLabel(currentTask)} pukul {currentTask.deadlineTime}
              </p>
            </div>

            <div className={`flex shrink-0 flex-col items-center justify-center rounded-3xl px-8 py-5 ${riskStyle[risk]}`}>
              <p className="text-[11px] font-black uppercase tracking-wide opacity-70">Priority Score</p>
              <p className="text-4xl font-black">{currentTask.priorityScore}</p>
              <p className="text-[11px] font-black uppercase tracking-wide opacity-70">{riskLabel[risk]}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => completeTask(currentTask.id)} disabled={currentTask.status === "Selesai"}>Tandai Selesai</Button>
            <Button variant="secondary" onClick={runAI} disabled={loading}>{loading ? "AI memproses..." : "Analisis AI"}</Button>
            <Button variant="danger" onClick={() => { if (confirm("Hapus task ini?")) { deleteTask(currentTask.id); router.push("/tasks"); } }}>Hapus</Button>
          </div>
          {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
        </Card>

        <Card>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Deskripsi Tugas</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{currentTask.description || "Belum ada deskripsi tugas."}</p>
          {currentTask.notes ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Catatan Tambahan</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{currentTask.notes}</p>
            </div>
          ) : null}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-slate-900">Subtask</h3>
            {currentTask.subtasks.length ? <span className="text-xs font-bold text-slate-500">{done}/{currentTask.subtasks.length} selesai ({progress}%)</span> : null}
          </div>
          {currentTask.subtasks.length ? (
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-primary-600" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
          <div className="mt-4 space-y-2">
            {currentTask.subtasks.length ? currentTask.subtasks.map((subtask) => (
              <div key={subtask.id} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={(e) => updateSubtask(subtask.id, { completed: e.target.checked })}
                  className="focus-ring h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600"
                  aria-label={`Tandai "${subtask.title}" selesai`}
                />
                <input
                  value={subtask.title}
                  onChange={(e) => updateSubtask(subtask.id, { title: e.target.value })}
                  className={`focus-ring min-w-0 flex-1 rounded-lg border-none bg-transparent px-1 text-sm ${subtask.completed ? "text-slate-400 line-through" : "text-slate-700"}`}
                />
                <button type="button" onClick={() => removeSubtask(subtask.id)} className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50" aria-label={`Hapus "${subtask.title}"`}>Hapus</button>
              </div>
            )) : <p className="text-sm text-slate-500">Belum ada subtask.</p>}
          </div>
        </Card>

        {currentTask.aiAnalysis ? (
          <Card className="border-primary-100 bg-primary-50/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-primary-600">🤖 Hasil Analisis AI</p>
                <h3 className="mt-1 text-lg font-black text-slate-900">{currentTask.aiAnalysis.summary}</h3>
              </div>
              <PriorityBadge priority={currentTask.aiAnalysis.recommendedPriority} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{currentTask.aiAnalysis.reason}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div><h4 className="font-bold text-slate-900">Langkah pengerjaan</h4><ol className="mt-2 space-y-2 text-sm text-slate-600">{currentTask.aiAnalysis.steps.map((step, i) => <li key={step}>{i + 1}. {step}</li>)}</ol></div>
              <div><h4 className="font-bold text-slate-900">Tips belajar</h4><ul className="mt-2 space-y-2 text-sm text-slate-600">{currentTask.aiAnalysis.tips.map((tip) => <li key={tip}>• {tip}</li>)}</ul></div>
            </div>
            {currentTask.aiAnalysis.warning ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{currentTask.aiAnalysis.warning}</p> : null}
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
