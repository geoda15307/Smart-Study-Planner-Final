import type { Category } from "@/types";

const FALLBACK_ICON = "❔";
const FALLBACK_COLOR = "#94a3b8";

export function CategoryIcon({ category, className = "h-9 w-9 text-lg" }: { category?: Category; className?: string }) {
  const icon = category?.icon || FALLBACK_ICON;
  const color = category?.color || FALLBACK_COLOR;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl ${className}`}
      style={{ backgroundColor: `${color}20`, color }}
      title={category?.name ?? "Kategori tidak ditemukan"}
    >
      {icon}
    </div>
  );
}
