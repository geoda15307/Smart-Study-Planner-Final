"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { askAI } from "@/services/ai/aiService";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Form";
import { createId } from "@/utils/id";
import { nowISO } from "@/utils/date";

const quickPrompts = [
  "Tugas mana yang harus saya kerjakan dulu?",
  "Buatkan jadwal belajar hari ini",
  "Ringkas instruksi tugas ini",
  "Buat langkah pengerjaan",
  "Beri tips agar deadline tidak terlambat",
  "Buat rencana belajar untuk ujian"
];

export function ChatWindow() {
  const tasks = useAppStore((state) => state.tasks);
  const messages = useAppStore((state) => state.chatMessages);
  const addMessage = useAppStore((state) => state.addChatMessage);
  const clear = useAppStore((state) => state.clearChatMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send(text = input) {
    if (!text.trim()) return;
    setError("");
    const userMessage = { id: createId("chat"), role: "user" as const, content: text.trim(), createdAt: nowISO() };
    addMessage(userMessage);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await askAI(userMessage.content, tasks, messages);
      addMessage({ id: createId("chat"), role: "assistant", content: reply, createdAt: nowISO() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI sedang tidak aktif. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex min-h-[70vh] flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">AI Assistant</h2>
          <p className="mt-1 text-sm text-slate-500">Tanyakan prioritas, jadwal belajar, ringkasan tugas, atau tips akademik.</p>
        </div>
        <Button variant="ghost" onClick={clear}>Clear</Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button key={prompt} onClick={() => send(prompt)} className="rounded-full bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 hover:bg-primary-100">{prompt}</button>
        ))}
      </div>

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-3">
        {messages.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">Belum ada percakapan.</p> : null}
        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "ml-auto max-w-[85%] rounded-2xl bg-primary-600 p-3 text-sm text-white" : "mr-auto max-w-[85%] whitespace-pre-line rounded-2xl bg-surface p-3 text-sm leading-6 text-slate-700 shadow-sm"}>
            {message.content}
          </div>
        ))}
        {loading ? <div className="mr-auto max-w-[85%] rounded-2xl bg-surface p-3 text-sm text-slate-500 shadow-sm">AI sedang mengetik...</div> : null}
      </div>

      {error ? <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}

      <div className="mt-4 flex gap-2">
        <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tulis pertanyaan akademik..." onKeyDown={(event) => event.key === "Enter" && send()} />
        <Button onClick={() => send()} disabled={loading}>Kirim</Button>
      </div>
      <p className="mt-3 text-xs text-slate-400">Rekomendasi AI dapat disesuaikan kembali oleh pengguna.</p>
    </Card>
  );
}
