import { NextResponse } from "next/server";
import type { ChatMessage, Task } from "@/types";
import { requireAIAuth, aiError } from "@/lib/ai/guard";
import { getAIProvider } from "@/lib/ai/getAIProvider";
import { AIProviderError } from "@/lib/ai/errors";

// POST /api/ai/chat — AI Assistant. Milestone E: disambungkan ke provider sungguhan lewat
// getAIProvider().chat(). Logika rule-based lama dipindah ke mock.chat() (dipakai saat
// AI_PROVIDER=mock), jadi default tetap membantu tanpa biaya. Gerbang auth wajib (route bisa
// memanggil provider berbayar) — tanpa rate-limit harian: chat murah & sering (§16 E).
export async function POST(request: Request) {
  const guard = await requireAIAuth();
  if (!guard.ok) return guard.response;

  let body: { message?: string; tasks?: Task[]; history?: ChatMessage[] };
  try {
    body = (await request.json()) as { message?: string; tasks?: Task[]; history?: ChatMessage[] };
  } catch {
    return aiError(400, "BAD_REQUEST", "Body request tidak valid.");
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return aiError(400, "BAD_REQUEST", "Pesan tidak boleh kosong.");
  const tasks = Array.isArray(body.tasks) ? body.tasks : [];
  const history = Array.isArray(body.history) ? body.history : [];

  try {
    const reply = await getAIProvider().chat(message, tasks, history);
    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof AIProviderError && error.code === "RATE_LIMIT") {
      return aiError(429, "PROVIDER_RATE_LIMIT", "Provider AI sedang sibuk. Coba lagi sebentar.");
    }
    return aiError(502, "AI_CHAT_FAILED", "AI sedang tidak bisa menjawab. Coba lagi.");
  }
}
