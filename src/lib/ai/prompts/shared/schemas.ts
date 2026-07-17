import type { JSONSchema } from "../types";

// Fragmen JSON Schema bersama (AI_ARCHITECTURE_FREEZE §17.3) — satu sumber untuk bentuk
// yang dipakai lintas prompt builder.

export const NON_EMPTY_STRING: JSONSchema = { type: "string", minLength: 1 };

export const STRING_ARRAY: JSONSchema = { type: "array", items: { type: "string" } };

export const NON_EMPTY_STRING_ARRAY: JSONSchema = {
  type: "array",
  items: { type: "string" },
  minItems: 1
};

// Reuse union Difficulty/Priority yang sudah ada di src/types/index.ts (§17.2) — bukan enum baru.
export const DIFFICULTY_SCHEMA: JSONSchema = { type: "string", enum: ["Easy", "Medium", "Hard"] };

export const PRIORITY_SCHEMA: JSONSchema = { type: "string", enum: ["Low", "Medium", "High", "Urgent"] };
