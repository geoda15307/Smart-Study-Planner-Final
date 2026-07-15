"use client";

import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { useMemo, useState } from "react";
import type { Task } from "@/types";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

const dot: Record<Task["priority"], string> = {
  Low: "bg-emerald-500",
  Medium: "bg-yellow-500",
  High: "bg-orange-500",
  Urgent: "bg-red-500"
};

export function CalendarView({ tasks }: { tasks: Task[] }) {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedTasks = tasks.filter((task) => isSameDay(new Date(task.deadlineDate), selected));

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">{format(month, "MMMM yyyy", { locale: id })}</h2>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setMonth(subMonths(month, 1))}>←</Button>
            <Button variant="ghost" onClick={() => setMonth(addMonths(month, 1))}>→</Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-400">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => <div key={day} className="py-2">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const items = tasks.filter((task) => isSameDay(new Date(task.deadlineDate), day));
            const active = isSameDay(day, selected);
            return (
              <button key={day.toISOString()} onClick={() => setSelected(day)} className={`min-h-20 rounded-2xl border p-2 text-left transition ${active ? "border-primary-500 bg-primary-50" : "border-slate-100 bg-surface"} ${!isSameMonth(day, month) ? "opacity-40" : ""}`}>
                <span className="text-sm font-black text-slate-700">{day.getDate()}</span>
                <div className="mt-2 flex flex-wrap gap-1">
                  {items.slice(0, 4).map((task) => <span key={task.id} className={`h-2 w-2 rounded-full ${dot[task.priority]}`} />)}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
      <Card>
        <h3 className="text-lg font-black text-slate-900">Agenda Harian</h3>
        <p className="mt-1 text-sm text-slate-500">Klik tanggal untuk melihat deadline.</p>
        <div className="mt-5 space-y-3">
          {selectedTasks.length ? selectedTasks.map((task) => (
            <div key={task.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-900">{task.title}</p>
              <p className="mt-1 text-xs text-slate-500">{task.courseName} • {task.deadlineTime}</p>
            </div>
          )) : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Tidak ada agenda.</p>}
        </div>
      </Card>
    </div>
  );
}
