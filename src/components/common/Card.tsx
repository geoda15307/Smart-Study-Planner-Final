import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-slate-100 bg-surface p-5 shadow-soft ${className}`}>{children}</div>;
}
