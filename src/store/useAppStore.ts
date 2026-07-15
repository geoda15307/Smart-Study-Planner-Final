"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Achievement, Category, ChatMessage, ClassSchedule, Course, Preference, StudySession, Task, User, WidgetPreference } from "@/types";
import { achievements, categories, courses, demoUser, preference, schedules, tasks, widgets } from "@/lib/data";
import { calculatePriorityScore } from "@/utils/priorityScore";
import { nowISO } from "@/utils/date";

type AppState = {
  isAuthenticated: boolean;
  token: string | null;
  user: User;
  courses: Course[];
  categories: Category[];
  tasks: Task[];
  schedules: ClassSchedule[];
  studySessions: StudySession[];
  preference: Preference;
  widgets: WidgetPreference[];
  achievements: Achievement[];
  chatMessages: ChatMessage[];
  authenticate: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logoutUser: () => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  completeTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  setStudySessions: (sessions: StudySession[]) => void;
  updatePreference: (updates: Partial<Preference>) => void;
  updateWidget: (widgetId: string, updates: Partial<WidgetPreference>) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  resetDemoData: () => void;
};

function score(task: Task): Task {
  return {
    ...task,
    priorityScore: calculatePriorityScore(task),
    updatedAt: nowISO()
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: demoUser,
      courses,
      categories,
      tasks,
      schedules,
      studySessions: [],
      preference,
      widgets,
      achievements,
      chatMessages: [],
      authenticate: (user, token) => set({ user, token, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logoutUser: () => set({ isAuthenticated: false, token: null, user: demoUser, studySessions: [], chatMessages: [] }),
      addTask: (task) => set((state) => ({ tasks: [score(task), ...state.tasks] })),
      updateTask: (taskId, updates) => set((state) => ({
        tasks: state.tasks.map((task) => task.id === taskId ? score({ ...task, ...updates }) : task)
      })),
      completeTask: (taskId) => set((state) => ({
        tasks: state.tasks.map((task) => task.id === taskId ? score({ ...task, status: "Selesai", completedAt: nowISO() }) : task)
      })),
      deleteTask: (taskId) => set((state) => ({ tasks: state.tasks.filter((task) => task.id !== taskId) })),
      addCategory: (category) => set((state) => ({ categories: [category, ...state.categories] })),
      updateCategory: (category) => set((state) => ({ categories: state.categories.map((item) => item.id === category.id ? category : item) })),
      deleteCategory: (categoryId) => set((state) => {
        const categories = state.categories.filter((category) => category.id !== categoryId);
        const fallback = categories.find((category) => category.id === "lainnya") ?? categories[0];
        return {
          categories,
          tasks: fallback
            ? state.tasks.map((task) => task.categoryId === categoryId ? { ...task, categoryId: fallback.id } : task)
            : state.tasks
        };
      }),
      setStudySessions: (sessions) => set({ studySessions: sessions }),
      updatePreference: (updates) => set((state) => ({ preference: { ...state.preference, ...updates } })),
      updateWidget: (widgetId, updates) => set((state) => ({
        widgets: state.widgets.map((widget) => widget.id === widgetId ? { ...widget, ...updates } : widget)
      })),
      addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
      clearChatMessages: () => set({ chatMessages: [] }),
      resetDemoData: () => set((state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        courses,
        categories,
        tasks,
        schedules,
        studySessions: [],
        preference,
        widgets,
        achievements,
        chatMessages: []
      }))
    }),
    { name: "smart-study-planner-store" }
  )
);
