// Pemecah teks dokumen panjang (AI_ARCHITECTURE_FREEZE §6) — operasi lokal murni: tanpa AI,
// tanpa network, tanpa secret. Karena itu boleh (dan memang didesain untuk) berjalan di
// client — dipanggil documentSummaryService saat orkestrasi chunking (Milestone D).

// Batas tier §6.1 — diukur dalam KARAKTER, bukan token (cukup akurat untuk keputusan tingkat,
// tanpa dependency tokenizer; konsisten dengan cara content.text diukur di codebase).
export const SUMMARY_DIRECT_MAX_CHARS = 15_000;
export const SUMMARY_HIERARCHICAL_THRESHOLD_CHARS = 80_000;

// Target ukuran per chunk (§6.2) — satu konstanta, bisa disetel tanpa mengubah struktur apa pun.
export const TARGET_CHUNK_CHARS = 8_000;

// Kalimat tunggal yang lebih panjang dari target — potong di batas kata; hard-cut hanya
// untuk "kata" tunggal tanpa spasi yang melebihi target (kasus patologis, mis. base64).
function splitLongSentence(sentence: string, target: number): string[] {
  const parts: string[] = [];
  let current = "";

  for (const word of sentence.split(/\s+/)) {
    if (word.length > target) {
      if (current) {
        parts.push(current);
        current = "";
      }
      for (let start = 0; start < word.length; start += target) {
        parts.push(word.slice(start, start + target));
      }
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > target && current) {
      parts.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) parts.push(current);
  return parts;
}

// Paragraf tunggal yang lebih panjang dari target — turun ke batas kalimat (§6.2), supaya
// tidak pernah memotong di tengah kalimat kalau masih bisa dihindari.
function splitLongParagraph(paragraph: string, target: number): string[] {
  const sentences = paragraph.split(/(?<=[.!?])\s+/);
  const parts: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (sentence.length > target) {
      if (current) {
        parts.push(current);
        current = "";
      }
      parts.push(...splitLongSentence(sentence, target));
      continue;
    }
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > target && current) {
      parts.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }

  if (current) parts.push(current);
  return parts;
}

// Pecah teks jadi chunk ≤ ~targetChunkChars, mengutamakan batas paragraf (baris kosong),
// lalu batas kalimat, lalu batas kata (§6.2). Teks kosong/whitespace → array kosong.
export function splitIntoChunks(text: string, targetChunkChars: number = TARGET_CHUNK_CHARS): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const target = Math.max(1, Math.floor(targetChunkChars));
  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const pieces = paragraph.length > target ? splitLongParagraph(paragraph, target) : [paragraph];
    for (const piece of pieces) {
      const candidate = current ? `${current}\n\n${piece}` : piece;
      if (candidate.length > target && current) {
        chunks.push(current);
        current = piece;
      } else {
        current = candidate;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
