// FRAGMEN untuk recommendationPrompt.ts (AI_ARCHITECTURE_FREEZE §4.3/§5.3) — bukan
// PromptSpec utuh, tidak pernah dipakai langsung oleh Service manapun. Berbentuk konstanta
// (bukan fungsi) sejak resolusi output polymorphic — Riwayat Revisi #10.

export const TASK_SUGGESTION_FRAGMENT = [
  'Untuk saran bertipe "Task" (tugas konkret dari materi, mis. mengerjakan latihan, membuat catatan) dan "Study" (sesi belajar bertema, mis. mendalami satu bab):',
  '- "title" singkat dan actionable.',
  '- "description" menjelaskan apa persisnya yang dikerjakan.',
  '- "priority" ("Low"/"Medium"/"High"/"Urgent") dan "estimatedDurationMinutes" yang realistis untuk mahasiswa.',
  '- "reason" menjelaskan kenapa saran ini penting berdasarkan isi materi.'
].join("\n");
