import type { AIProvider } from "../types";
import { AIProviderError } from "../errors";

function notConfigured(): never {
  throw new AIProviderError("AI_PROVIDER=openrouter dipilih tapi OPENROUTER_API_KEY belum diisi di .env.local, atau implementasi providernya belum ditulis.", "NOT_CONFIGURED");
}

export const openrouterProvider: AIProvider = {
  name: "openrouter",
  analyzeTask: notConfigured,
  chat: notConfigured,
  summarize: notConfigured,
  generateFlashcards: notConfigured,
  generateQuiz: notConfigured,
  recommend: notConfigured
};
