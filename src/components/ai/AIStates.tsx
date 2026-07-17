// Potongan UI kecil yang dipakai bersama panel AI (loading/error/stale). Konsisten dengan
// gaya app (rounded, warna slate/primary/amber/red).

export function AILoading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-2 text-sm font-bold text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      {label}
    </div>
  );
}

export function AIError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl bg-red-50 p-2.5 text-xs font-bold text-red-700">
      {message}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="ml-2 underline hover:no-underline">
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}

export function AIStaleNote() {
  return (
    <p className="rounded-xl bg-amber-50 p-2.5 text-xs font-bold text-amber-700">
      Ringkasan sumber sudah diperbarui — hasil ini dari versi sebelumnya. Generate ulang untuk versi terbaru.
    </p>
  );
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
