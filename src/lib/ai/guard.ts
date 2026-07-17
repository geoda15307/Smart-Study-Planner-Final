import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/utils/date";

// Gerbang WAJIB untuk semua route /api/ai/* (AI_ARCHITECTURE_FREEZE §7.3). Server-only.
// Urutan: Auth (401) → Rate-limit (429/503 fail-closed). Keduanya HARUS lolos sebelum route
// menyentuh Prompt Builder / provider. Counter dinaikkan SEBELUM provider dipanggil, sekali
// per permintaan user — supaya request yang gagal di tengah jalan tidak bisa dipakai mengelak
// dari batas lewat retry cepat berulang (§17.3).

const DEFAULT_DAILY_LIMIT = 50;

export interface AIRouteError {
  error: true;
  errorCode: string;
  message: string;
}

export function aiError(status: number, errorCode: string, message: string) {
  return NextResponse.json({ error: true, errorCode, message } satisfies AIRouteError, { status });
}

export type AIGuardResult = { ok: true; userId: string } | { ok: false; response: NextResponse };

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Gerbang 1 (Auth) dipakai bersama. Route dokumen memakai guardAIRoute (auth + rate-limit);
// route chat memakai requireAIAuth (auth saja — chat murah & sering, tidak dibebani kuota
// harian dokumen; tetap ditutup dari akses anonim karena bisa memanggil provider berbayar).
async function getAuthedUser(): Promise<{ userId: string; supabase: SupabaseServerClient } | { response: NextResponse }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { response: aiError(401, "UNAUTHORIZED", "Kamu harus login untuk memakai fitur AI.") };
  }
  return { userId: data.user.id, supabase };
}

// Auth-only — untuk /api/ai/chat (Milestone E).
export async function requireAIAuth(): Promise<AIGuardResult> {
  const result = await getAuthedUser();
  if ("response" in result) return { ok: false, response: result.response };
  return { ok: true, userId: result.userId };
}

export async function guardAIRoute(): Promise<AIGuardResult> {
  const result = await getAuthedUser();
  if ("response" in result) return { ok: false, response: result.response };
  const { userId, supabase } = result;

  // Rate-limit (Cost Control) — fail-closed: kalau pengecekan ini SENDIRI gagal (Supabase
  // bermasalah), tolak (503), jangan diloloskan. Justru saat pengaman tak bisa diverifikasi
  // itulah perlindungan biaya paling dibutuhkan (§7.3).
  try {
    const usageDate = todayISO();
    const limit = Number(process.env.AI_DAILY_REQUEST_LIMIT ?? DEFAULT_DAILY_LIMIT);

    const { data: existing, error: readError } = await supabase
      .from("ai_usage_log")
      .select("request_count")
      .eq("user_id", userId)
      .eq("usage_date", usageDate)
      .maybeSingle();
    if (readError) throw readError;

    const current = existing?.request_count ?? 0;
    if (current >= limit) {
      return { ok: false, response: aiError(429, "DAILY_LIMIT", "Kuota AI harian kamu sudah habis. Coba lagi besok.") };
    }

    const { error: writeError } = await supabase
      .from("ai_usage_log")
      .upsert({ user_id: userId, usage_date: usageDate, request_count: current + 1 }, { onConflict: "user_id,usage_date" });
    if (writeError) throw writeError;
  } catch {
    return { ok: false, response: aiError(503, "RATE_LIMIT_UNAVAILABLE", "Layanan AI sedang tidak tersedia. Coba lagi sebentar.") };
  }

  return { ok: true, userId };
}
