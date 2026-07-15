import type { Category } from "@/types";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

const FALLBACK_ICON = "❔";
const FALLBACK_COLOR = "#94a3b8";

type LucideIconComponent = React.ComponentType<LucideProps>;

function getLucideComponent(iconName: string): LucideIconComponent | null {
  const componentName = iconName
    .split(/[-_ ]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  const icons = LucideIcons as unknown as Record<string, LucideIconComponent>;
  return icons[componentName] ?? null;
}

export function CategoryIcon({ category, className = "h-9 w-9 text-lg" }: { category?: Category; className?: string }) {
  const iconValue = category?.icon || FALLBACK_ICON;
  const color = category?.color || FALLBACK_COLOR;
  const IconComponent = typeof iconValue === "string" ? getLucideComponent(iconValue) : null;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl ${className}`}
      style={{ backgroundColor: `${color}20`, color }}
      title={category?.name ?? "Kategori tidak ditemukan"}
    >
      {IconComponent ? <IconComponent className={className} /> : iconValue}
    </div>
  );
}
