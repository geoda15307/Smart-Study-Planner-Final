"use client";

import Link from "next/link";
import type { Task } from "@/types";
import { deadlineLabel } from "@/utils/date";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { PriorityBadge, StatusBadge } from "@/components/common/Badge";
import { CategoryIcon } from "@/components/category/CategoryIcon";

const border: Record<Task["priority"], string> = {
  Low: "border-l-emerald-400",
  Medium: "border-l-yellow-400",
  High: "border-l-orange-400",
  Urgent: "border-l-red-500"
};

export function TaskCard({ task, onComplete, onDelete }: { task: Task; onComplete?: () => void; onDelete?: () => void }) {
  const category = useAppStore((state) => state.categories.find((item) => item.id === task.categoryId));
  const done = task.subtasks.filter((item) => item.completed).length;
  const progress = task.subtasks.length ? Math.round((done / task.subtasks.length) * 100) : task.status === "Selesai" ? 100 : 0;

  return (
    <Card className={`border-l-4 p-4 ${border[task.priority]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase leading-none text-slate-400">Score</p>
            <p className="text-lg font-black leading-tight text-slate-900">{task.priorityScore}</p>
          </div>
          <CategoryIcon category={category} className="h-9 w-9 text-lg" />
        </div>
      </div>
      <Link href={`/tasks/${task.id}`} className="mt-3 block text-base font-black text-slate-900 hover:text-primary-700">{task.title}</Link>

      <p className="mt-4 text-sm text-slate-500">Deadline: <b className="text-slate-700">{deadlineLabel(task)}, {task.deadlineTime}</b></p>

      {task.subtasks.length ? (
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
            <span>Progress subtask</span>
            <span>{done}/{task.subtasks.length} ({progress}%)</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-primary-600" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/tasks/${task.id}`} className="inline-flex min-h-10 items-center rounded-xl bg-primary-50 px-3 text-sm font-bold text-primary-700">Detail</Link>
        {task.status !== "Selesai" ? <Button variant="secondary" className="min-h-10 rounded-xl px-3" onClick={onComplete}>Selesai</Button> : null}
        {onDelete ? <Button variant="danger" className="min-h-10 rounded-xl px-3" onClick={onDelete}>Hapus</Button> : null}
      </div>
    </Card>
  );
}
