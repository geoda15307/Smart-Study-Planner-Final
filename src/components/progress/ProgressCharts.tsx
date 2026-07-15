"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Task } from "@/types";
import { Card } from "@/components/common/Card";

export function ProgressCharts({ tasks }: { tasks: Task[] }) {
  const statusData = ["Belum Mulai", "Selesai", "Terlambat"].map((status) => ({
    name: status,
    value: tasks.filter((task) => task.status === status).length
  }));

  const weeklyData = [
    { day: "Sen", selesai: 1, belajar: 2 },
    { day: "Sel", selesai: 2, belajar: 3 },
    { day: "Rab", selesai: 1, belajar: 1.5 },
    { day: "Kam", selesai: 3, belajar: 2.5 },
    { day: "Jum", selesai: 2, belajar: 2 },
    { day: "Sab", selesai: 0, belajar: 1 },
    { day: "Min", selesai: 1, belajar: 1.5 }
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h3 className="text-lg font-black text-slate-900">Pie Chart Status Task</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                {statusData.map((entry, index) => <Cell key={entry.name} fill={["#94a3b8", "#22c55e", "#ef4444"][index]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-black text-slate-900">Bar Chart Aktivitas Mingguan</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="selesai" name="Task selesai" fill="#2563eb" radius={[8, 8, 0, 0]} />
              <Bar dataKey="belajar" name="Jam belajar" fill="#93c5fd" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
