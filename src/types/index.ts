export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type TaskStatus = "Belum Mulai" | "Selesai" | "Terlambat";
export type ProductiveTime = "Pagi" | "Siang" | "Sore" | "Malam";

export interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  major: string;
  semester: number;
  isPremium: boolean;
}

export interface Course {
  id: string;
  name: string;
  color: string;
  lecturerName?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface AIAnalysis {
  id: string;
  taskId: string;
  summary: string;
  recommendedPriority: Priority;
  reason: string;
  steps: string[];
  tips: string[];
  estimatedDurationMinutes: number;
  riskLevel: "low" | "medium" | "high";
  warning?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  categoryId: string;
  description: string;
  deadlineDate: string;
  deadlineTime: string;
  priority: Priority;
  difficulty: Difficulty;
  estimatedDurationMinutes: number;
  priorityScore: number;
  status: TaskStatus;
  tags: string[];
  subtasks: Subtask[];
  notes?: string;
  aiAnalysis?: AIAnalysis;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ClassSchedule {
  id: string;
  courseName: string;
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
  color: string;
}

export interface StudySession {
  id: string;
  taskId?: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "Terjadwal" | "Selesai" | "Dilewati";
  source: "manual" | "ai" | "rule-based";
}

export interface Preference {
  theme: "Biru Akademik" | "Ungu Modern" | "Hijau Produktif" | "Orange Energetic";
  language: "id" | "en";
  productiveTime: ProductiveTime;
  maxStudyHoursPerDay: number;
  defaultReminder: number;
  aiEnabled: boolean;
  notificationEnabled: boolean;
  darkMode: boolean;
}

export interface WidgetPreference {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  size: "small" | "medium" | "large";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  unlocked: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface TaskInput {
  title: string;
  description: string;
  courseId: string;
  categoryId: string;
  deadlineDate: string;
  deadlineTime: string;
  priority: Priority;
  difficulty: Difficulty;
  estimatedDurationMinutes: number;
  notes?: string;
  subtasks: Subtask[];
}
