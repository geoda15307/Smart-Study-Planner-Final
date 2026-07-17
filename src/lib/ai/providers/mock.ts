import type {
  AIFlashcardSetOutput,
  AIQuizSetOutput,
  AIRecommendationOutput,
  AISummaryOutput,
  ChatMessage,
  Task
} from "@/types";
import type { AIGenerationResult, AIProvider } from "../types";
import { sortTasks } from "@/utils/date";

// Provider default (AI_PROVIDER=mock). Satu-satunya provider yang berfungsi tanpa API key.
// Keempat method dokumen mengembalikan JSON VALID sesuai schema §17.3 supaya Milestone D
// (Service + Validation Pipeline) bisa dibangun & diuji end-to-end tanpa biaya/network.
function mockResult(payload: unknown): AIGenerationResult {
  return {
    raw: JSON.stringify(payload),
    parsed: payload,
    tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    provider: "mock",
    model: "mock"
  };
}

const MOCK_SUMMARY: AISummaryOutput = {
  title: "Ringkasan Contoh (Mock)",
  summary:
    "Ini ringkasan contoh dari mock provider, dipakai untuk menguji pipeline AI tanpa memanggil model sungguhan. Semua field mengikuti kontrak AISummaryOutput.",
  keyPoints: ["Poin penting pertama dari materi", "Poin penting kedua dari materi"],
  keywords: ["contoh", "mock", "pengujian"],
  difficulty: "Medium",
  estimatedReadingTime: 5,
  language: "id",
  confidence: 0.5
};

const MOCK_FLASHCARDS: AIFlashcardSetOutput = {
  title: "Flashcard Contoh (Mock)",
  cards: [
    { question: "Apa fungsi mock provider?", answer: "Menghasilkan JSON valid untuk pengujian tanpa API key.", difficulty: "Easy" },
    { question: "Kapan mock dipakai?", answer: "Saat menguji Service/route AI tanpa biaya model sungguhan.", difficulty: "Medium" }
  ]
};

const MOCK_QUIZ: AIQuizSetOutput = {
  title: "Quiz Contoh (Mock)",
  questions: [
    {
      question: "Apa yang selalu dikembalikan mock provider?",
      options: ["JSON valid sesuai schema", "Teks acak", "Selalu error"],
      correctIndex: 0,
      explanation: "Mock sengaja mengembalikan JSON yang lolos validasi schema §17.3.",
      difficulty: "Easy"
    }
  ]
};

const MOCK_RECOMMENDATION: AIRecommendationOutput = {
  recommendations: [
    {
      type: "Task",
      title: "Kerjakan latihan dari materi ini",
      description: "Selesaikan soal latihan untuk menguji pemahaman bab.",
      priority: "High",
      estimatedDurationMinutes: 60,
      reason: "Latihan memperkuat pemahaman konsep inti materi."
    },
    {
      type: "Study",
      title: "Review konsep inti",
      description: "Baca ulang poin penting dan buat catatan ringkas.",
      priority: "Medium",
      estimatedDurationMinutes: 45,
      reason: "Review terjadwal membantu retensi jangka panjang."
    },
    {
      type: "Calendar",
      title: "Sesi belajar terjadwal",
      description: "Alokasikan slot fokus untuk mendalami materi.",
      priority: "Medium",
      estimatedDurationMinutes: 90,
      reason: "Slot terjadwal menjaga konsistensi belajar.",
      suggestedDate: "2026-07-20",
      suggestedStartTime: "19:00",
      suggestedEndTime: "20:30"
    }
  ]
};

export const mockAIProvider: AIProvider = {
  name: "mock",
  async analyzeTask(task) {
    return {
      id: `ai_mock_${Date.now()}`,
      taskId: task.id,
      summary: `Tugas "${task.title}" (provider AI belum dikonfigurasi).`,
      recommendedPriority: task.priority,
      reason: "Provider AI belum dikonfigurasi — atur AI_PROVIDER di .env.local.",
      steps: [],
      tips: [],
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      riskLevel: "low",
      createdAt: new Date().toISOString()
    };
  },
  // Rule-based keyword matching — dipindah dari route /api/ai/chat (Milestone E) supaya
  // AI_PROVIDER=mock tetap memberi jawaban membantu tanpa biaya (bukan sekadar placeholder).
  // Provider sungguhan (gemini.chat) menggantikan ini saat AI_PROVIDER=gemini.
  async chat(message: string, tasks: Task[]) {
    const query = message.toLowerCase();
    const active = sortTasks(tasks).filter((task) => task.status !== "Selesai");
    const topTask = active[0];

    if (query.includes("mana") || query.includes("prioritas") || query.includes("dulu")) {
      return topTask
        ? `Prioritas utama saat ini adalah "${topTask.title}".\n\nAlasannya:\n- Priority score: ${topTask.priorityScore}/100\n- Deadline: ${topTask.deadlineDate} ${topTask.deadlineTime}\n- Difficulty: ${topTask.difficulty}\n\nSaran: mulai dengan membaca instruksi, pecah menjadi subtask, lalu kerjakan bagian tersulit terlebih dahulu.`
        : "Tidak ada task aktif. Kamu bisa review materi atau menyusun rencana minggu depan.";
    }
    if (query.includes("jadwal")) {
      return topTask
        ? `Rencana belajar hari ini:\n\n1. 19.00-19.15: Review instruksi "${topTask.title}"\n2. 19.15-20.15: Kerjakan bagian utama\n3. 20.15-20.30: Istirahat\n4. 20.30-21.00: Rapikan hasil dan catat bagian yang belum selesai`
        : "Belum ada task aktif untuk dibuatkan jadwal.";
    }
    if (query.includes("ringkas")) {
      return topTask
        ? `Ringkasan task terdekat:\n\n${topTask.title}: ${topTask.description || "Belum ada deskripsi detail."}\n\nChecklist:\n- Pahami output tugas\n- Siapkan referensi\n- Kerjakan draft\n- Review dan submit`
        : "Tidak ada task aktif yang bisa diringkas.";
    }
    if (query.includes("tips")) {
      return "Tips agar deadline tidak terlambat:\n\n- Kerjakan task dengan deadline terdekat dulu.\n- Pecah task besar menjadi sesi 45-90 menit.\n- Sisakan minimal 1 sesi untuk review.\n- Mulai dari bagian paling kecil selama 10 menit.";
    }
    return "Aku bisa bantu menyusun prioritas, jadwal belajar, ringkasan tugas, dan tips akademik.";
  },
  async summarize() {
    return mockResult(MOCK_SUMMARY);
  },
  async generateFlashcards() {
    return mockResult(MOCK_FLASHCARDS);
  },
  async generateQuiz() {
    return mockResult(MOCK_QUIZ);
  },
  async recommend() {
    return mockResult(MOCK_RECOMMENDATION);
  }
};
