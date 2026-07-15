"use client";

import { useEffect } from "react";
import type { Preference } from "@/types";
import { useAppStore } from "@/store/useAppStore";

const themeSlugs: Record<Preference["theme"], string> = {
  "Biru Akademik": "biru-akademik",
  "Ungu Modern": "ungu-modern",
  "Hijau Produktif": "hijau-produktif",
  "Orange Energetic": "orange-energetic"
};

export function useTheme() {
  const theme = useAppStore((state) => state.preference.theme);
  const darkMode = useAppStore((state) => state.preference.darkMode);

  useEffect(() => {
    document.documentElement.dataset.theme = themeSlugs[theme];
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
}
