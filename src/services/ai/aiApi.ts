// Jembatan network tipis dari Service AI (client) ke route /api/ai/* miliknya sendiri.
// Pola identik services/ai/aiService.ts → /api/ai/{analyze,chat}. Cookie sesi Supabase ikut
// terkirim otomatis (sama origin) untuk auth check di server (§13). Tidak ada logika AI di sini.
export async function postAI<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    // Pesan dari route sudah ramah + Bahasa Indonesia (§17.5); teruskan apa adanya ke UI.
    throw new Error(data.message || "Terjadi kesalahan saat menghubungi layanan AI.");
  }

  return response.json() as Promise<T>;
}
