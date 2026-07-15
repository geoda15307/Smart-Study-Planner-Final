import type { Difficulty, Priority, TaskStatus } from "@/types";
import { daysUntilDeadline } from "./date";

const priorityMap: Record<Priority, number> = { Low: 20, Medium: 50, High: 75, Urgent: 100 };
const difficultyMap: Record<Difficulty, number> = { Easy: 25, Medium: 60, Hard: 100 };
const statusMap: Record<TaskStatus, number> = {
  "Belum Mulai": 90,
  "Selesai": 0,
  "Terlambat": 100
};

export function deadlineScore(deadlineDate: string) {
  const days = daysUntilDeadline({ deadlineDate });
  if (days < 0) return 100;
  if (days === 0) return 95;
  if (days === 1) return 85;
  if (days <= 3) return 75;
  if (days <= 7) return 55;
  if (days <= 14) return 35;
  return 15;
}

export function durationScore(minutes: number) {
  if (minutes >= 240) return 100;
  if (minutes >= 180) return 80;
  if (minutes >= 120) return 65;
  if (minutes >= 60) return 40;
  return 20;
}

export function calculatePriorityScore(input: {
  deadlineDate: string;
  priority: Priority;
  difficulty: Difficulty;
  estimatedDurationMinutes: number;
  status: TaskStatus;
}) {
  if (input.status === "Selesai") return 0;

  const score =
    deadlineScore(input.deadlineDate) * 0.4 +
    priorityMap[input.priority] * 0.25 +
    difficultyMap[input.difficulty] * 0.15 +
    durationScore(input.estimatedDurationMinutes) * 0.1 +
    statusMap[input.status] * 0.1;

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function scoreToPriority(score: number): Priority {
  if (score >= 80) return "Urgent";
  if (score >= 60) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

export function riskLevel(score: number): "low" | "medium" | "high" {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}
