"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Field, Input, Select } from "@/components/common/Form";
import { useAppStore } from "@/store/useAppStore";
import { createId } from "@/utils/id";
import { downloadCSV, downloadJSON } from "@/services/storage/storageService";
import { logout as clearAuthToken } from "@/services/auth/authService";
import { CategoryIcon } from "@/components/category/CategoryIcon";

const ICON_CHOICES = [
  { name: "book-open", label: "Book Open" },
  { name: "graduation-cap", label: "Graduation Cap" },
  { name: "file-text", label: "File Text" },
  { name: "clipboard-list", label: "Clipboard List" },
  { name: "users", label: "Users" },
  { name: "activity", label: "Activity" },
  { name: "sport-shoe", label: "Running" },
  { name: "gift", label: "Gift" },
  { name: "sparkles", label: "Sparkles" },
  { name: "coffee", label: "Coffee" },
  { name: "calendar", label: "Calendar" },
  { name: "clock", label: "Clock" },
  { name: "star", label: "Star" },
  { name: "pencil", label: "Pencil" },
  { name: "monitor", label: "Monitor" },
  { name: "inbox", label: "Inbox" },
  { name: "music", label: "Music" },
  { name: "heart", label: "Heart" },
  { name: "rocket", label: "Rocket" },
  { name: "shield", label: "Shield" }
];

export function CategoryPage() {
  const categories = useAppStore((state) => state.categories);
  const addCategory = useAppStore((state) => state.addCategory);
  const updateCategory = useAppStore((state) => state.updateCategory);
  const deleteCategory = useAppStore((state) => state.deleteCategory);
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("book-open");
  const [color, setColor] = useState("#2563eb");
  const [activityInput, setActivityInput] = useState("");
  const [activitiesList, setActivitiesList] = useState<string[]>([]);
  const [iconSearch, setIconSearch] = useState("");

  function addActivity() {
    const next = activityInput.trim();
    if (!next) return;
    setActivitiesList((current) => Array.from(new Set([...current, next])));
    setActivityInput("");
  }

  function removeActivity(activity: string) {
    setActivitiesList((current) => current.filter((item) => item !== activity));
  }

  return (
    <AppShell title="Category" subtitle="Kelompokkan aktivitas dengan warna dan icon.">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        <Card>
          <h2 className="text-lg font-black text-slate-900">Tambah Kategori</h2>
          <div className="mt-4 space-y-4">
            <Field label="Nama kategori"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Project Kelompok" /></Field>
            <Field label="Aktivitas"><div className="grid gap-3">
              <div className="flex gap-2">
                <Input value={activityInput} onChange={(e) => setActivityInput(e.target.value)} placeholder="Contoh: renang" />
                <Button type="button" variant="secondary" className="min-w-[3rem]" onClick={addActivity}>+</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activitiesList.length
                  ? activitiesList.map((activity) => (
                    <span key={activity} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                      {activity}
                      <button type="button" onClick={() => removeActivity(activity)} className="rounded-full px-1 text-slate-400 transition hover:text-slate-700">×</button>
                    </span>
                  ))
                  : <p className="text-sm text-slate-500">Belum ada aktivitas ditambahkan.</p>
                }
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="secondary" className="h-10 w-10 rounded-full p-0" onClick={addActivity}>+</Button>
              </div>
            </div></Field>
            <Field label="Icon">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm shadow-slate-200/10">
                  <input
                    className="h-10 flex-1 rounded-2xl border-none bg-transparent px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Cari icon..."
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                    <CategoryIcon category={{ id: "preview", name: "Preview", color, icon: selectedIcon, activities: [] }} className="h-6 w-6" />
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
                  {ICON_CHOICES.filter((item) => item.label.toLowerCase().includes(iconSearch.toLowerCase()) || item.name.includes(iconSearch.toLowerCase())).map((item) => {
                    const selected = selectedIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelectedIcon(item.name)}
                        className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-white transition ${selected ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}
                      >
                        <CategoryIcon category={{ id: `pick-${item.name}`, name: item.label, color: "#0f172a", icon: item.name, activities: [] }} className="h-6 w-6" />
                        {selected ? (
                          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">✓</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Field>
            <Field label="Warna"><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></Field>
            <Button className="w-full" onClick={() => {
              if (!name.trim()) return;
              addCategory({ id: createId("cat"), name, icon: selectedIcon, color, activities: activitiesList });
              setName("");
              setActivityInput("");
              setActivitiesList([]);
            }}>Simpan Kategori</Button>
          </div>
        </Card>
        <div className="grid gap-3 md:grid-cols-2">
          {categories.map((category) => (
            <Card key={category.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CategoryIcon category={category} className="h-12 w-12" />
                  <div>
                    <p className="font-black text-slate-900">{category.name}</p>
                    <p className="text-xs text-slate-400">{category.color}</p>
                  </div>
                </div>
                <Button variant="danger" onClick={() => deleteCategory(category.id)}>Hapus</Button>
              </div>
              <div className="mt-4 text-sm text-slate-600">
                <p className="font-black text-slate-900">Aktivitas</p>
                <p className="mt-1 text-sm text-slate-500">{Array.isArray(category.activities) && category.activities.length ? category.activities.join(", ") : "-"}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export function WidgetPage() {
  const widgets = useAppStore((state) => state.widgets);
  const updateWidget = useAppStore((state) => state.updateWidget);
  return (
    <AppShell title="Widget" subtitle="Atur komponen yang tampil di dashboard.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {widgets.map((widget) => (
          <Card key={widget.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900">{widget.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{widget.description}</p>
                <p className="mt-3 text-xs font-black uppercase text-slate-400">Ukuran: {widget.size}</p>
              </div>
              <button onClick={() => updateWidget(widget.id, { enabled: !widget.enabled })} className={`rounded-full px-3 py-1 text-xs font-black ${widget.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {widget.enabled ? "Aktif" : "Nonaktif"}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

const themes = [
  ["Biru Akademik", "from-blue-500 to-indigo-600"],
  ["Ungu Modern", "from-violet-500 to-purple-600"],
  ["Hijau Produktif", "from-emerald-500 to-teal-600"],
  ["Orange Energetic", "from-orange-500 to-amber-500"]
] as const;

export function ThemesPage() {
  const preference = useAppStore((state) => state.preference);
  const updatePreference = useAppStore((state) => state.updatePreference);
  return (
    <AppShell title="Themes" subtitle="Pilih warna utama, background, dan mode tampilan.">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {themes.map(([theme, color]) => (
          <Card key={theme} className="overflow-hidden p-0">
            <div className={`h-32 bg-gradient-to-br ${color}`} />
            <div className="p-5">
              <h3 className="font-black text-slate-900">{theme}</h3>
              <p className="mt-2 text-sm text-slate-500">Preview tema modern dan nyaman dibaca.</p>
              <Button className="mt-4 w-full" variant={preference.theme === theme ? "primary" : "secondary"} onClick={() => updatePreference({ theme })}>
                {preference.theme === theme ? "Tema Aktif" : "Pilih Tema"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export function AccountPage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const logoutUser = useAppStore((state) => state.logoutUser);

  function handleLogout() {
    clearAuthToken();
    logoutUser();
    router.replace("/auth/login");
  }

  return (
    <AppShell title="Account" subtitle="Kelola profil, status premium, dan integrasi akun.">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        <Card className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary-100 text-4xl font-black text-primary-700">{user.name.slice(0, 1)}</div>
          <h2 className="mt-4 text-2xl font-black text-slate-900">{user.name}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
          <span className="mt-4 inline-flex rounded-full bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700">{user.isPremium ? "Premium" : "Free Plan"}</span>
        </Card>
        <Card>
          <h3 className="text-lg font-black text-slate-900">Informasi Akademik</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Info label="Universitas" value={user.university} />
            <Info label="Jurusan" value={user.major} />
            <Info label="Semester" value={String(user.semester)} />
            <Info label="Google Drive" value="Belum terhubung" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary">Edit Profil</Button>
            <Button variant="secondary">Connect Google Drive</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
            <Button variant="danger">Delete Account</Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-900">{value}</p></div>;
}

export function AchievementPage() {
  const achievements = useAppStore((state) => state.achievements);
  return (
    <AppShell title="Achievement" subtitle="Gamification ringan untuk menjaga konsistensi belajar.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement) => {
          const percent = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));
          return (
            <Card key={achievement.id}>
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h3 className="font-black text-slate-900">{achievement.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{achievement.description}</p>
                  <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary-600" style={{ width: `${percent}%` }} /></div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{achievement.progress}/{achievement.target}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}

export function PremiumPage() {
  const free = ["Task manager dasar", "Calendar dasar", "Progress tracking dasar", "Reminder dasar", "AI request terbatas"];
  const premium = ["AI Task Prioritization", "Smart Schedule Generator", "AI Task Summarizer", "Unlimited AI Assistant", "Advanced Progress Analytics", "Google Drive Backup", "Custom Themes", "No Ads"];
  return (
    <AppShell title="Premium Plan" subtitle="Model freemium yang jelas dan ramah mahasiswa.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Plan title="Free" price="Rp0" features={free} />
        <Plan title="Premium" price="Rp29.000/bulan" features={premium} highlighted />
      </div>
    </AppShell>
  );
}

function Plan({ title, price, features, highlighted }: { title: string; price: string; features: string[]; highlighted?: boolean }) {
  return (
    <Card className={highlighted ? "border-primary-200 bg-gradient-to-br from-surface to-primary-50" : ""}>
      <h2 className="text-2xl font-black text-slate-900">{title}</h2>
      <p className="mt-3 text-3xl font-black text-primary-700">{price}</p>
      <ul className="mt-5 space-y-3 text-sm text-slate-600">{features.map((feature) => <li key={feature}>✅ {feature}</li>)}</ul>
      <Button className="mt-6 w-full" variant={highlighted ? "primary" : "secondary"}>{highlighted ? "Upgrade Premium" : "Paket Aktif"}</Button>
    </Card>
  );
}

export function SettingsPage() {
  const preference = useAppStore((state) => state.preference);
  const tasks = useAppStore((state) => state.tasks);
  const updatePreference = useAppStore((state) => state.updatePreference);
  const reset = useAppStore((state) => state.resetDemoData);

  return (
    <AppShell title="Settings" subtitle="Atur bahasa, reminder, notifikasi, data, dan preferensi AI.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-black text-slate-900">Preferensi Belajar</h2>
          <div className="mt-4 space-y-4">
            <Field label="Bahasa aplikasi"><Select value={preference.language} onChange={(e) => updatePreference({ language: e.target.value as "id" | "en" })}><option value="id">Bahasa Indonesia</option><option value="en">English</option></Select></Field>
            <Field label="Jam produktif"><Select value={preference.productiveTime} onChange={(e) => updatePreference({ productiveTime: e.target.value as typeof preference.productiveTime })}>{["Pagi", "Siang", "Sore", "Malam"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
            <Field label="Maksimal jam belajar per hari"><Input type="number" value={preference.maxStudyHoursPerDay} onChange={(e) => updatePreference({ maxStudyHoursPerDay: Number(e.target.value) })} /></Field>
            <button type="button" onClick={() => updatePreference({ darkMode: !preference.darkMode })} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left text-sm font-bold text-slate-900">
              <span>Mode gelap</span><span>{preference.darkMode ? "Aktif" : "Nonaktif"}</span>
            </button>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-black text-slate-900">Backup & AI</h2>
          <div className="mt-4 space-y-3">
            <button onClick={() => updatePreference({ aiEnabled: !preference.aiEnabled })} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left text-sm font-bold text-slate-900">
              <span>Aktifkan AI recommendation</span><span>{preference.aiEnabled ? "Aktif" : "Nonaktif"}</span>
            </button>
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Data tugas Anda hanya digunakan untuk menghasilkan rekomendasi belajar dan tidak akan dibagikan tanpa izin.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => downloadJSON("smart-study-planner-data.json", { tasks, preference })}>Export JSON</Button>
              <Button variant="secondary" onClick={() => downloadCSV("smart-study-planner-tasks.csv", tasks)}>Export CSV</Button>
              <Button variant="danger" onClick={() => confirm("Reset semua data ke demo?") && reset()}>Reset Data</Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
