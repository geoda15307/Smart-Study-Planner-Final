// Versi prompt per fitur (AI_ARCHITECTURE_FREEZE §9.1/§17.9). Dipisah dari file builder supaya
// Service client (services/ai/*) bisa mengimpor HANYA versi ini untuk cek validitas cache —
// tanpa ikut menarik isi Prompt Builder (teks prompt + schema) ke bundle client, menjaga
// boundary §7.2 (Service tidak tahu isi Prompt Builder). Naikkan nilai kalau isi prompt fitur
// terkait berubah signifikan — ini membatalkan cache fitur itu (§9.1).
export const SUMMARY_PROMPT_VERSION = "summary-v1";
export const FLASHCARD_PROMPT_VERSION = "flashcard-v1";
export const QUIZ_PROMPT_VERSION = "quiz-v1";
export const RECOMMENDATION_PROMPT_VERSION = "recommendation-v1";
