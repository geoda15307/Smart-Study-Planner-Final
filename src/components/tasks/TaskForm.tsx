"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Difficulty, Priority, Subtask, TaskInput } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Field, Input, Select, Textarea } from "@/components/common/Form";
import { analyzeTask } from "@/services/ai/aiService";
import { calculatePriorityScore } from "@/utils/priorityScore";
import { createId } from "@/utils/id";
import { nowISO, todayISO } from "@/utils/date";

export function TaskForm() {
  const router = useRouter();
  const courses = useAppStore((state) => state.courses);
  const categories = useAppStore((state) => state.categories);
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const [form, setForm] = useState<TaskInput>({
    title: "",
    description: "",
    courseId: courses[0]?.id ?? "",
    categoryId: categories[1]?.id ?? "",
    deadlineDate: todayISO(),
    deadlineTime: "23:59",
    priority: "Medium",
    difficulty: "Medium",
    estimatedDurationMinutes: 90,
    notes: "",
    subtasks: []
  });
  const [subtask, setSubtask] = useState("");
  const [error, setError] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  function setValue<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addSubtask() {
    if (!subtask.trim()) return;
    setValue("subtasks", [...form.subtasks, { id: createId("subtask"), title: subtask.trim(), completed: false }]);
    setSubtask("");
  }

  function updateSubtask(id: string, updates: Partial<Subtask>) {
    setValue("subtasks", form.subtasks.map((item) => item.id === id ? { ...item, ...updates } : item));
  }

  function removeSubtask(id: string) {
    setValue("subtasks", form.subtasks.filter((item) => item.id !== id));
  }

  async function save(withAI = false) {
    if (!form.title.trim()) return setError("Judul tugas wajib diisi.");
    if (!form.deadlineDate) return setError("Deadline wajib diisi.");
    if (Number(form.estimatedDurationMinutes) <= 0) return setError("Estimasi durasi harus angka positif.");

    setError("");
    const course = courses.find((item) => item.id === form.courseId) ?? courses[0];
    const task = {
      id: createId("task"),
      title: form.title,
      courseId: course.id,
      courseName: course.name,
      categoryId: form.categoryId,
      description: form.description,
      deadlineDate: form.deadlineDate,
      deadlineTime: form.deadlineTime,
      priority: form.priority,
      difficulty: form.difficulty,
      estimatedDurationMinutes: Number(form.estimatedDurationMinutes),
      priorityScore: 0,
      status: "Belum Mulai" as const,
      tags: [],
      subtasks: form.subtasks,
      notes: form.notes,
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    task.priorityScore = calculatePriorityScore(task);
    addTask(task);

    if (withAI) {
      try {
        setLoadingAI(true);
        const analysis = await analyzeTask(task);
        updateTask(task.id, { aiAnalysis: analysis });
      } catch {
        setError("Analisis AI gagal. Task tetap berhasil disimpan.");
      } finally {
        setLoadingAI(false);
      }
    }

    router.push(withAI ? `/tasks/${task.id}` : "/tasks");
  }

  return (
    <Card>
      <h2 className="text-lg font-black text-slate-900">Tambah Tugas Baru</h2>
      <p className="mt-1 text-sm text-slate-500">Isi cepat dari HP. Semua rekomendasi AI bisa diedit kembali.</p>

      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
      {loadingAI ? <p className="mt-4 rounded-2xl bg-primary-50 p-3 text-sm font-bold text-primary-700">AI sedang menganalisis tugas...</p> : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Judul aktivitas/tugas"><Input value={form.title} onChange={(e) => setValue("title", e.target.value)} placeholder="Contoh: Laporan Praktikum Basis Data" /></Field>
        <Field label="Mata kuliah"><Select value={form.courseId} onChange={(e) => setValue("courseId", e.target.value)}>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</Select></Field>
        <Field label="Kategori"><Select value={form.categoryId} onChange={(e) => setValue("categoryId", e.target.value)}>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}</Select></Field>
        <Field label="Deadline tanggal"><Input type="date" value={form.deadlineDate} onChange={(e) => setValue("deadlineDate", e.target.value)} /></Field>
        <Field label="Deadline jam"><Input type="time" value={form.deadlineTime} onChange={(e) => setValue("deadlineTime", e.target.value)} /></Field>
        <Field label="Estimasi durasi (menit)"><Input type="number" min={15} value={form.estimatedDurationMinutes} onChange={(e) => setValue("estimatedDurationMinutes", Number(e.target.value))} /></Field>
        <Field label="Priority"><Select value={form.priority} onChange={(e) => setValue("priority", e.target.value as Priority)}>{(["Low", "Medium", "High", "Urgent"] as const).map((item) => <option key={item}>{item}</option>)}</Select></Field>
        <Field label="Difficulty"><Select value={form.difficulty} onChange={(e) => setValue("difficulty", e.target.value as Difficulty)}>{(["Easy", "Medium", "Hard"] as const).map((item) => <option key={item}>{item}</option>)}</Select></Field>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Deskripsi"><Textarea value={form.description} onChange={(e) => setValue("description", e.target.value)} placeholder="Paste instruksi tugas dari LMS..." /></Field>
        <Field label="Catatan tambahan"><Textarea value={form.notes} onChange={(e) => setValue("notes", e.target.value)} placeholder="Catatan pribadi atau referensi..." /></Field>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-900">Subtask checklist</p>
        <div className="mt-3 flex gap-2">
          <Input value={subtask} onChange={(e) => setSubtask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }} placeholder="Contoh: Buat outline laporan" />
          <Button type="button" variant="secondary" onClick={addSubtask}>Tambah</Button>
        </div>
        <div className="mt-3 space-y-2">
          {form.subtasks.length ? form.subtasks.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(e) => updateSubtask(item.id, { completed: e.target.checked })}
                className="focus-ring h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600"
                aria-label={`Tandai "${item.title}" selesai`}
              />
              <input
                value={item.title}
                onChange={(e) => updateSubtask(item.id, { title: e.target.value })}
                className={`focus-ring min-w-0 flex-1 rounded-lg border-none bg-transparent px-1 text-sm ${item.completed ? "text-slate-400 line-through" : "text-slate-600"}`}
              />
              <button type="button" onClick={() => removeSubtask(item.id)} className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50" aria-label={`Hapus "${item.title}"`}>Hapus</button>
            </div>
          )) : <p className="text-sm text-slate-500">Belum ada subtask.</p>}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button onClick={() => save(false)}>Simpan Tugas</Button>
        <Button variant="secondary" onClick={() => save(true)}>Simpan & Analisis AI</Button>
      </div>
    </Card>
  );
}
