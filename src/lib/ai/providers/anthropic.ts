import type { AIProvider } from "../types";
import { AIProviderError } from "../errors";

function notConfigured(): never {
  throw new AIProviderError("AI_PROVIDER=anthropic dipilih tapi ANTHROPIC_API_KEY belum diisi di .env.local, atau implementasi providernya belum ditulis.", "NOT_CONFIGURED");
}

export const anthropicProvider: AIProvider = {
  name: "anthropic",
  analyzeTask: notConfigured,
  chat: notConfigured,
  summarize: notConfigured,
  generateFlashcards: notConfigured,
  generateQuiz: notConfigured,
  recommend: notConfigured
};
