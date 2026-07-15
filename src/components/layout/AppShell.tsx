"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

const appRoutes = [
  ["Dashboard", "/dashboard", "🏠"],
  ["Tasks", "/tasks", "📌"],
  ["Calendar", "/calendar", "📅"],
  ["AI Assistant", "/ai-assistant", "🤖"],
  ["Progress", "/progress", "📊"],
  ["Category", "/category", "🏷️"],
  ["Widget", "/widget", "🧩"],
  ["Themes", "/themes", "🎨"],
  ["Achievement", "/achievement", "🏆"],
  ["Premium", "/premium", "✨"],
  ["Account", "/account", "👤"],
  ["Settings", "/settings", "⚙️"]
] as const;

const mobileQuickRoutes = [
  ["Home", "/dashboard", "🏠"],
  ["Tasks", "/tasks", "📌"],
  ["Add", "/tasks/new", "➕"],
  ["AI", "/ai-assistant", "🤖"],
  ["Menu", "#menu", "☰"]
] as const;

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const showBackButton = pathname !== "/dashboard";

  useEffect(() => {
    setHydrated(useAppStore.persist.hasHydrated());
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (!hydrated || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-soft px-4">
        <div className="rounded-card bg-white p-6 text-center shadow-soft">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
          <p className="mt-4 text-sm font-bold text-slate-600">Memeriksa sesi login...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-soft">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-slate-100 bg-white px-5 py-6 lg:block">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-xl font-black text-white">S</div>
          <div>
            <p className="text-lg font-black text-slate-900">Smart Study</p>
            <p className="text-xs font-bold text-slate-400">Academic AI Planner</p>
          </div>
        </Link>

        <nav className="mt-8 space-y-1">
          {appRoutes.map(([label, href, icon]) => {
            const active = isRouteActive(pathname, href);
            return (
              <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${active ? "bg-primary-600 text-white shadow-lg shadow-primary-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
                <span>{icon}</span>{label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-h-screen pb-24 lg:ml-72 lg:pb-8">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-soft/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8 lg:py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {showBackButton ? (
                <button type="button" onClick={() => router.back()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-black text-slate-700 shadow-sm lg:hidden" aria-label="Kembali">
                  ←
                </button>
              ) : null}
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wide text-primary-600 sm:text-xs">Smart Study Planner</p>
                <h1 className="truncate text-xl font-black text-slate-900 sm:text-2xl">{title}</h1>
                {subtitle ? <p className="mt-1 hidden text-sm text-slate-500 sm:block">{subtitle}</p> : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/account" className="hidden items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 font-black text-primary-700">{user.name.slice(0, 1)}</div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </Link>
              <button type="button" onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-xl font-black text-slate-700 shadow-sm lg:hidden" aria-label="Buka menu">
                ☰
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white/95 px-3 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {mobileQuickRoutes.map(([label, href, icon]) => {
            if (href === "#menu") {
              return (
                <button key={label} type="button" onClick={() => setMenuOpen(true)} className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-black text-slate-400 transition hover:bg-slate-50 hover:text-slate-900">
                  <span className="text-lg">{icon}</span>{label}
                </button>
              );
            }
            const active = isRouteActive(pathname, href);
            return (
              <Link key={href} href={href} className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-black transition ${label === "Add" ? "bg-primary-600 text-white" : active ? "bg-primary-50 text-primary-700" : "text-slate-400"}`}>
                <span className="text-lg">{icon}</span>{label}
              </Link>
            );
          })}
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Tutup menu" className="absolute inset-0 bg-slate-950/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto rounded-l-[2rem] bg-white px-5 py-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 text-lg font-black text-white">S</div>
                <div>
                  <p className="font-black text-slate-900">Smart Study</p>
                  <p className="text-xs font-bold text-slate-400">Menu lengkap</p>
                </div>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-lg font-black text-slate-600" aria-label="Tutup menu">×</button>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-900">{user.name}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{user.email}</p>
            </div>

            <nav className="mt-5 grid gap-2">
              {appRoutes.map(([label, href, icon]) => {
                const active = isRouteActive(pathname, href);
                return (
                  <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${active ? "bg-primary-600 text-white shadow-lg shadow-primary-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                    <span className="text-lg">{icon}</span>{label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
