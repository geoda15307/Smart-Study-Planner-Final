// Error bertipe untuk domain AI (AI_ARCHITECTURE_FREEZE §17.5/§17.6). Dipakai route untuk
// membedakan kegagalan yang boleh di-retry dari yang tidak (khususnya provider rate-limit,
// yang TIDAK boleh di-retry — §17.6).

export type AIProviderErrorCode =
  | "RATE_LIMIT" // 429 dari vendor — JANGAN retry (§17.6)
  | "TIMEOUT"
  | "BLOCKED" // konten diblokir provider
  | "EMPTY" // respons kosong
  | "HTTP_ERROR"
  | "NETWORK"
  | "MISSING_API_KEY"
  | "NOT_CONFIGURED"
  | "PROVIDER_ERROR";

export class AIProviderError extends Error {
  code: AIProviderErrorCode;
  constructor(message: string, code: AIProviderErrorCode) {
    super(message);
    this.name = "AIProviderError";
    this.code = code;
  }
}

// Dilempar generate-orchestrator kalau hasil AI gagal Validation Pipeline (§17.4) setelah
// seluruh percobaan retry habis. `errors` = daftar pelanggaran schema/business (untuk log
// internal, bukan ditampilkan ke user).
export class AIValidationError extends Error {
  errors: string[];
  constructor(message: string, errors: string[]) {
    super(message);
    this.name = "AIValidationError";
    this.errors = errors;
  }
}
