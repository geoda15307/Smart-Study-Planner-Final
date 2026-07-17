"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Achievement, Category, ChatMessage, ClassSchedule, Course, DocumentRecord, Preference, StudySession, Task, UploadedFileMeta, User, WidgetPreference } from "@/types";
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
  uploadedFiles: UploadedFileMeta[];
  // Mirror UI-only dari IndexedDB `documents` (Single Source of Truth) — sengaja
  // dikecualikan dari persist (lihat partialize di bawah), lihat SPRINT_1_ARCHITECTURE_FREEZE.md §7.
  documents: Record<string, DocumentRecord>;
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
  addStudySession: (session: StudySession) => void;
  updatePreference: (updates: Partial<Preference>) => void;
  updateWidget: (widgetId: string, updates: Partial<WidgetPreference>) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  addUploadedFile: (file: UploadedFileMeta) => void;
  updateUploadedFile: (id: string, updates: Partial<UploadedFileMeta>) => void;
  removeUploadedFile: (id: string) => void;
  setDocument: (record: DocumentRecord) => void;
  removeDocument: (id: string) => void;
  resetDemoData: () => void;
};

function score(task: Task): Task {
  return {
    ...task,
    priorityScore: calculatePriorityScore(task),
    updatedAt: nowISO()
  };
}

const STORE_NAME = "smart-study-planner-store";

// Migrasi v0->v1: UploadCategory lama (3 nilai) -> DocumentCategory (5 nilai).
// "document" lama selalu berarti PDF (ALLOWED_FILE_TYPES sebelum diperluas hanya
// menerima .pdf di bawah kategori itu) — remap ini aman dan tidak ambigu.
// Lihat docs/SPRINT_1_ARCHITECTURE_FREEZE.md §8.
function migrateUploadedFilesCategory(persistedState: unknown): unknown {
  if (typeof persistedState !== "object" || persistedState === null) return persistedState;
  const state = persistedState as { uploadedFiles?: unknown };
  if (!Array.isArray(state.uploadedFiles)) return persistedState;

  const uploadedFiles = state.uploadedFiles.map((file) => {
    if (typeof file !== "object" || file === null) return file;
    const record = file as Record<string, unknown>;
    return record.category === "document" ? { ...record, category: "pdf" } : record;
  });

  return { ...state, uploadedFiles };
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
      uploadedFiles: [],
      documents: {},
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
      addStudySession: (session) => set((state) => ({ studySessions: [...state.studySessions, session] })),
      updatePreference: (updates) => set((state) => ({ preference: { ...state.preference, ...updates } })),
      updateWidget: (widgetId, updates) => set((state) => ({
        widgets: state.widgets.map((widget) => widget.id === widgetId ? { ...widget, ...updates } : widget)
      })),
      addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
      clearChatMessages: () => set({ chatMessages: [] }),
      addUploadedFile: (file) => set((state) => ({ uploadedFiles: [file, ...state.uploadedFiles] })),
      updateUploadedFile: (id, updates) => set((state) => ({
        uploadedFiles: state.uploadedFiles.map((file) => file.id === id ? { ...file, ...updates } : file)
      })),
      removeUploadedFile: (id) => set((state) => ({ uploadedFiles: state.uploadedFiles.filter((file) => file.id !== id) })),
      setDocument: (record) => set((state) => ({ documents: { ...state.documents, [record.id]: record } })),
      removeDocument: (id) => set((state) => {
        const { [id]: _removed, ...rest } = state.documents;
        return { documents: rest };
      }),
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
        chatMessages: [],
        uploadedFiles: [],
        documents: {}
      }))
    }),
    {
      name: STORE_NAME,
      version: 1,
      migrate: (persistedState, version) => {
        if (version >= 1) return persistedState as AppState;
        try {
          if (typeof window !== "undefined") {
            const raw = window.localStorage.getItem(STORE_NAME);
            if (raw) window.localStorage.setItem(`${STORE_NAME}__backup_v0`, raw);
          }
          return migrateUploadedFilesCategory(persistedState) as AppState;
        } catch (error) {
          console.error("Migrasi store v0->v1 gagal, memakai state seadanya tanpa migrasi kategori:", error);
          return persistedState as AppState;
        }
      },
      // documents (extracted text, hasil OCR/AI nanti) TIDAK BOLEH masuk localStorage —
      // IndexedDB adalah Single Source of Truth. Lihat SPRINT_1_ARCHITECTURE_FREEZE.md §7.
      partialize: (state) => {
        const { documents: _documents, ...rest } = state;
        return rest;
      }
    }
  )
);
