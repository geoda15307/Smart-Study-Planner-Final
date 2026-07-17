import type { AISummary } from "@/types";

// Kunci & validasi cache AI (AI_ARCHITECTURE_FREEZE §9). Pure + tanpa network — hashing
// memakai Web Crypto (`crypto.subtle`) yang tersedia native di browser maupun runtime server,
// tanpa dependency baru. Dihitung di client (documentSummaryService, Milestone D) supaya
// cache-hit tidak butuh round-trip network sama sekali.

// normalize(): rapikan whitespace berlebih sebelum hash, supaya teks yang isinya sama tapi
// beda spasi/baris tidak menghasilkan hash berbeda (§9.1).
export function normalizeForHash(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// SHA-256(normalize(text)) — komponen kunci cache untuk AISummary (§9.1).
export function computeSourceTextHash(text: string): Promise<string> {
  return sha256Hex(normalizeForHash(text));
}

// AISummary valid HANYA kalau documentId (implisit — key store), sourceTextHash, dan
// promptVersion cocok ketiganya (§9.1). documentId sudah tercakup lewat getSummary(documentId),
// jadi di sini cukup membandingkan dua sisanya. Type guard supaya pemanggil langsung dapat
// AISummary yang menyempit tipenya saat valid.
export function isSummaryCacheValid(
  cached: AISummary | undefined,
  sourceTextHash: string,
  promptVersion: string
): cached is AISummary {
  return cached !== undefined && cached.sourceTextHash === sourceTextHash && cached.promptVersion === promptVersion;
}

// Fitur turunan (Flashcard/Quiz/Recommendation) tidak menyimpan sourceTextHash sendiri —
// validitasnya transitif lewat summaryId: cocok dengan AISummary aktif yang SUDAH tervalidasi
// terhadap hash+promptVersion lebih dulu (§9.1). Kalau AISummary aktif belum ada
// (activeSummaryId undefined), turunannya otomatis dianggap tidak valid. Type guard generik
// supaya pemanggil langsung dapat record yang menyempit tipenya (bukan `| undefined`) saat valid.
export function isDerivedCacheValid<T extends { summaryId: string }>(
  cached: T | undefined,
  activeSummaryId: string | undefined
): cached is T {
  return cached !== undefined && activeSummaryId !== undefined && cached.summaryId === activeSummaryId;
}
