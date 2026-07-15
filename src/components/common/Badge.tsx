import type { Priority, TaskStatus } from "@/types";

const priorityClass: Record<Priority, string> = {
  Low: "bg-emerald-50 text-emerald-700",
  Medium: "bg-yellow-50 text-yellow-700",
  High: "bg-orange-50 text-orange-700",
  Urgent: "bg-red-50 text-red-700"
};

const statusClass: Record<TaskStatus, string> = {
  "Belum Mulai": "bg-slate-100 text-slate-700",
  "Selesai": "bg-emerald-50 text-emerald-700",
  "Terlambat": "bg-red-50 text-red-700"
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${priorityClass[priority]}`}>{priority}</span>;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass[status]}`}>{status}</span>;
}
