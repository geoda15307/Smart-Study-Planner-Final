"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Field, Input } from "@/components/common/Form";
import { register } from "@/services/auth/authService";
import { useAppStore } from "@/store/useAppStore";

export default function RegisterPage() {
  const router = useRouter();
  const logoutUser = useAppStore((state) => state.logoutUser);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (form.password !== form.confirmPassword) return setError("Konfirmasi password harus sama.");
    setLoading(true);
    try {
      await register(form);
      logoutUser();
      router.replace("/auth/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-soft px-4 py-8">
      <Card className="w-full max-w-2xl">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Buat Akun Mahasiswa</h1>
            <p className="mt-1 text-sm text-slate-500">Buat akun untuk mulai menggunakan aplikasi.</p>
          </div>
        </div>
        {error ? <p className="mt-5 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Nama lengkap"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Password"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Konfirmasi password"><Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></Field>
        </div>
        <Button className="mt-6 w-full" disabled={loading} onClick={submit}>{loading ? "Membuat akun..." : "Daftar"}</Button>
        <p className="mt-6 text-center text-sm text-slate-500">Sudah punya akun? <Link href="/auth/login" className="font-bold text-primary-600">Login</Link></p>
      </Card>
    </main>
  );
}
