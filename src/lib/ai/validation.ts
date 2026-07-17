import type { JSONSchema } from "./prompts/types";

// Validation Pipeline (AI_ARCHITECTURE_FREEZE §17.3/§17.4). Server-only, dipakai route
// sebelum meneruskan hasil AI ke client. Tanpa dependency (mis. ajv) — validator subset
// yang cukup untuk schema §17.3, konsisten dengan kebijakan dependency minimal project.

// Lepas pembungkus code-fence umum (```json ... ```) sebelum JSON.parse (§17.7 — pertahanan
// kedua kalau model tidak patuh instruksi JSON-only). Return undefined kalau tetap gagal.
export function tryParseJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

// Validator JSON Schema subset: type (object/array/string/integer/number/boolean), required,
// properties, additionalProperties:false, items, enum, minItems/maxItems, minLength/maxLength,
// minimum/maximum. Return daftar pesan error (kosong = valid).
export function validateAgainstSchema(data: unknown, schema: JSONSchema, path = "root"): string[] {
  const errors: string[] = [];
  const s = schema as Record<string, unknown>;
  const type = s.type as string | undefined;

  if (type === "object") {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      errors.push(`${path}: harus object`);
      return errors;
    }
    const obj = data as Record<string, unknown>;
    for (const req of (s.required as string[] | undefined) ?? []) {
      if (!(req in obj)) errors.push(`${path}.${req}: field wajib hilang`);
    }
    const props = (s.properties as Record<string, JSONSchema> | undefined) ?? {};
    if (s.additionalProperties === false) {
      for (const key of Object.keys(obj)) {
        if (!(key in props)) errors.push(`${path}.${key}: properti tak dikenal`);
      }
    }
    for (const [key, sub] of Object.entries(props)) {
      if (key in obj) errors.push(...validateAgainstSchema(obj[key], sub, `${path}.${key}`));
    }
  } else if (type === "array") {
    if (!Array.isArray(data)) {
      errors.push(`${path}: harus array`);
      return errors;
    }
    if (typeof s.minItems === "number" && data.length < s.minItems) errors.push(`${path}: minItems ${s.minItems}, dapat ${data.length}`);
    if (typeof s.maxItems === "number" && data.length > s.maxItems) errors.push(`${path}: maxItems ${s.maxItems}, dapat ${data.length}`);
    if (s.items) data.forEach((item, i) => errors.push(...validateAgainstSchema(item, s.items as JSONSchema, `${path}[${i}]`)));
  } else if (type === "string") {
    if (typeof data !== "string") {
      errors.push(`${path}: harus string`);
      return errors;
    }
    if (typeof s.minLength === "number" && data.length < s.minLength) errors.push(`${path}: minLength ${s.minLength}`);
    if (typeof s.maxLength === "number" && data.length > s.maxLength) errors.push(`${path}: maxLength ${s.maxLength}`);
    if (Array.isArray(s.enum) && !s.enum.includes(data)) errors.push(`${path}: "${data}" tidak ada di enum`);
  } else if (type === "integer" || type === "number") {
    if (typeof data !== "number" || Number.isNaN(data)) {
      errors.push(`${path}: harus ${type}`);
      return errors;
    }
    if (type === "integer" && !Number.isInteger(data)) errors.push(`${path}: harus bilangan bulat`);
    if (typeof s.minimum === "number" && data < s.minimum) errors.push(`${path}: di bawah minimum ${s.minimum}`);
    if (typeof s.maximum === "number" && data > s.maximum) errors.push(`${path}: di atas maximum ${s.maximum}`);
  } else if (type === "boolean") {
    if (typeof data !== "boolean") errors.push(`${path}: harus boolean`);
  }

  return errors;
}

// --- Business Validation (§17.4): aturan lintas-field / sanity check yang tidak bisa
// diekspresikan JSON Schema. Menangkap "Hallucinated Structure" (§17.5) — bentuk benar tapi
// isi tidak masuk akal. Return daftar error (kosong = lolos). ---

function nonEmptyStrings(arr: unknown): boolean {
  return Array.isArray(arr) && arr.length > 0 && arr.every((x) => typeof x === "string" && x.trim().length > 0);
}

export function businessValidateSummary(data: unknown): string[] {
  const errors: string[] = [];
  const d = data as Record<string, unknown>;
  if (typeof d.summary !== "string" || d.summary.trim().length === 0) errors.push("summary kosong setelah trim");
  if (typeof d.title !== "string" || d.title.trim().length === 0) errors.push("title kosong setelah trim");
  if (!nonEmptyStrings(d.keyPoints)) errors.push("keyPoints kosong/berisi string kosong");
  if (!nonEmptyStrings(d.keywords)) errors.push("keywords kosong/berisi string kosong");
  return errors;
}

export function businessValidateChunkSummary(data: unknown): string[] {
  const d = data as Record<string, unknown>;
  return typeof d.summary === "string" && d.summary.trim().length > 0 ? [] : ["ringkasan chunk kosong"];
}

export function businessValidateFlashcards(data: unknown): string[] {
  const errors: string[] = [];
  const cards = (data as Record<string, unknown>).cards;
  if (!Array.isArray(cards) || cards.length === 0) return ["cards kosong"];
  const seen = new Set<string>();
  cards.forEach((card, i) => {
    const c = card as Record<string, unknown>;
    if (typeof c.question !== "string" || c.question.trim().length === 0) errors.push(`cards[${i}].question kosong`);
    if (typeof c.answer !== "string" || c.answer.trim().length === 0) errors.push(`cards[${i}].answer kosong`);
    const key = typeof c.question === "string" ? c.question.trim().toLowerCase() : "";
    if (key && seen.has(key)) errors.push(`cards[${i}].question duplikat persis`);
    seen.add(key);
  });
  return errors;
}

export function businessValidateQuiz(data: unknown): string[] {
  const errors: string[] = [];
  const questions = (data as Record<string, unknown>).questions;
  if (!Array.isArray(questions) || questions.length === 0) return ["questions kosong"];
  questions.forEach((q, i) => {
    const question = q as Record<string, unknown>;
    const options = question.options;
    if (!Array.isArray(options) || options.length < 2) {
      errors.push(`questions[${i}].options minimal 2`);
      return;
    }
    // Aturan lintas-field yang tidak bisa diekspresikan JSON Schema (§17.3 catatan).
    const correctIndex = question.correctIndex;
    if (typeof correctIndex !== "number" || correctIndex < 0 || correctIndex >= options.length) {
      errors.push(`questions[${i}].correctIndex di luar rentang options`);
    }
    // Opsi tidak boleh semua identik (Hallucinated Structure, §17.5).
    const distinct = new Set(options.map((o) => (typeof o === "string" ? o.trim().toLowerCase() : String(o))));
    if (distinct.size < 2) errors.push(`questions[${i}].options semua identik`);
  });
  return errors;
}

export function businessValidateRecommendation(data: unknown): string[] {
  const recs = (data as Record<string, unknown>).recommendations;
  if (!Array.isArray(recs) || recs.length === 0) return ["recommendations kosong"];
  return [];
}
