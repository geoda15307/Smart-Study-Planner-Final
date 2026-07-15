"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProductiveTime } from "@/types";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Field, Input, Select } from "@/components/common/Form";
import { useAppStore } from "@/store/useAppStore";

export default function OnboardingPage() {
  const router = useRouter();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const preference = useAppStore((state) => state.preference);
  const updatePreference = useAppStore((state) => state.updatePreference);
  const [step, setStep] = useState(1);
  const [productiveTime, setProductiveTime] = useState<ProductiveTime>(preference.productiveTime);
  const [maxHours, setMaxHours] = useState(preference.maxStudyHoursPerDay);
  const [aiEnabled, setAiEnabled] = useState(preference.aiEnabled);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(useAppStore.persist.hasHydrated());
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace("/auth/login");
  }, [hydrated, isAuthenticated, router]);

  function finish() {
    updatePreference({ productiveTime, maxStudyHoursPerDay: maxHours, aiEnabled });
    router.push("/dashboard");
  }

  if (!hydrated || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-soft px-4">
        <p className="rounded-2xl bg-surface px-5 py-4 text-sm font-bold text-slate-600 shadow-soft">Memeriksa sesi login...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-soft px-4 py-8">
      <Card className="w-full max-w-xl">
        <p className="text-sm font-black text-primary-600">Langkah {step} dari 4</p>
        <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary-600" style={{ width: `${step * 25}%` }} /></div>

        <div className="mt-6">
          {step === 1 && <><h1 className="text-2xl font-black text-slate-900">Target akademikmu</h1><p className="mt-2 text-sm text-slate-500">Aplikasi akan membantu menyusun prioritas berdasarkan deadline dan target belajar.</p><Field label="Target semester ini"><Input className="mt-4" placeholder="Contoh: semua tugas tepat waktu" /></Field></>}
          {step === 2 && <><h1 className="text-2xl font-black text-slate-900">Jam belajar favorit</h1><p className="mt-2 text-sm text-slate-500">Pilih waktu saat kamu paling produktif.</p><Field label="Waktu produktif"><Select className="mt-4" value={productiveTime} onChange={(e) => setProductiveTime(e.target.value as ProductiveTime)}>{["Pagi", "Siang", "Sore", "Malam"].map((item) => <option key={item}>{item}</option>)}</Select></Field></>}
          {step === 3 && <><h1 className="text-2xl font-black text-slate-900">Batas belajar harian</h1><p className="mt-2 text-sm text-slate-500">Agar jadwal otomatis tetap realistis.</p><Field label="Maksimal jam belajar per hari"><Input className="mt-4" type="number" min={1} max={8} value={maxHours} onChange={(e) => setMaxHours(Number(e.target.value))} /></Field></>}
          {step === 4 && <><h1 className="text-2xl font-black text-slate-900">Mode AI otomatis</h1><p className="mt-2 text-sm text-slate-500">AI membantu memberi ringkasan, langkah, dan rekomendasi jadwal. Semua hasil tetap bisa diedit.</p><button onClick={() => setAiEnabled(!aiEnabled)} className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left font-bold text-slate-900">{aiEnabled ? "✅ AI Recommendation aktif" : "⬜ AI Recommendation nonaktif"}</button></>}
        </div>

        <div className="mt-8 flex justify-between gap-3">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep((value) => value - 1)}>Kembali</Button>
          {step < 4 ? <Button onClick={() => setStep((value) => value + 1)}>Lanjut</Button> : <Button onClick={finish}>Masuk Dashboard</Button>}
        </div>
      </Card>
    </main>
  );
}
