// FRAGMEN untuk recommendationPrompt.ts (AI_ARCHITECTURE_FREEZE §4.3/§5.3) — bukan
// PromptSpec utuh, tidak pernah dipakai langsung oleh Service manapun. Berbentuk konstanta
// (bukan fungsi) sejak resolusi output polymorphic — Riwayat Revisi #10.

export const CALENDAR_SUGGESTION_FRAGMENT = [
  'Untuk saran bertipe "Calendar" (slot belajar terjadwal):',
  '- Sertakan "suggestedDate" (format YYYY-MM-DD) dan, kalau relevan, "suggestedStartTime"/"suggestedEndTime" (format HH:mm) — hanya kalau ada dasarnya dari materi (mis. deadline yang disebut). Kalau tidak ada dasar, jangan mengarang tanggal — cukup tanpa field tanggal/jam.',
  '- "estimatedDurationMinutes" konsisten dengan rentang waktu yang disarankan.',
  '- "reason" menjelaskan kenapa slot ini disarankan.'
].join("\n");
