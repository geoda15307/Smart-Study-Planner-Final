"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Input, Select } from "@/components/common/Form";
import { TaskCard } from "@/components/tasks/TaskCard";
import { useTaskFilters } from "@/hooks/useTaskFilters";
import { useAppStore } from "@/store/useAppStore";

export default function TasksPage() {
  const tasks = useAppStore((state) => state.tasks);
  const completeTask = useAppStore((state) => state.completeTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const filter = useTaskFilters(tasks);

  return (
    <AppShell title="Task Manager" subtitle="Kelola tugas akademik, deadline, priority score, dan analisis AI.">
      <div className="space-y-5">
        <div className="flex justify-end"><Link href="/tasks/new"><Button>Tambah Tugas</Button></Link></div>
        <div className="grid gap-3 rounded-card border border-slate-100 bg-surface p-4 shadow-soft md:grid-cols-4">
          <Input placeholder="Cari tugas..." value={filter.search} onChange={(e) => filter.setSearch(e.target.value)} />
          <Select value={filter.range} onChange={(e) => filter.setRange(e.target.value as typeof filter.range)}>
            {["Semua", "Hari ini", "Minggu ini", "Bulan ini"].map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select value={filter.priority} onChange={(e) => filter.setPriority(e.target.value as typeof filter.priority)}>
            {["Semua", "Low", "Medium", "High", "Urgent"].map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select value={filter.status} onChange={(e) => filter.setStatus(e.target.value as typeof filter.status)}>
            {["Semua", "Belum Mulai", "Selesai", "Terlambat"].map((item) => <option key={item}>{item}</option>)}
          </Select>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {filter.filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onComplete={() => completeTask(task.id)} onDelete={() => confirm("Hapus task ini?") && deleteTask(task.id)} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
