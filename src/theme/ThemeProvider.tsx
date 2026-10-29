import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type ColorMode = "light" | "dark";
export type Accent = "indigo" | "emerald" | "amber" | "rose" | "violet" | "ocean";
export type DashboardDesign = "studio" | "compact" | "analytics";

export interface ThemeValue {
  colorMode: ColorMode;
  accent: Accent;
  design: DashboardDesign;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  setAccent: (accent: Accent) => void;
  setDesign: (design: DashboardDesign) => void;
  resetTheme: () => void;
}

export const ACCENTS: Array<{ id: Accent; label: string; color: string }> = [
  { id: "indigo", label: "Indigo", color: "#4f46e5" },
  { id: "emerald", label: "Emerald", color: "#059669" },
  { id: "amber", label: "Amber", color: "#d97706" },
  { id: "rose", label: "Rose", color: "#e11d48" },
  { id: "violet", label: "Violet", color: "#7c3aed" },
  { id: "ocean", label: "Ocean", color: "#0284c7" },
];

export const DESIGNS: Array<{ id: DashboardDesign; labelKey: string; textKey: string }> = [
  { id: "studio", labelKey: "dashboard.design.studio", textKey: "settings.designHelp" },
  { id: "compact", labelKey: "dashboard.design.compact", textKey: "settings.designHelp" },
  { id: "analytics", labelKey: "dashboard.design.analytics", textKey: "settings.designHelp" },
];

const STORAGE_KEY = "kura-crm.theme";

interface StoredTheme {
  colorMode: ColorMode;
  accent: Accent;
  design: DashboardDesign;
}

const DEFAULT_THEME: StoredTheme = { colorMode: "light", accent: "indigo", design: "studio" };

const readStoredTheme = (): StoredTheme => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredTheme>;
      return {
        colorMode: parsed.colorMode === "dark" ? "dark" : "light",
        accent: ACCENTS.some((item) => item.id === parsed.accent)
          ? (parsed.accent as Accent)
          : "indigo",
        design: DESIGNS.some((item) => item.id === parsed.design)
          ? (parsed.design as DashboardDesign)
          : "studio",
      };
    }
  } catch {
    // Corrupt or unavailable storage — fall back to defaults.
  }
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return { ...DEFAULT_THEME, colorMode: prefersDark ? "dark" : "light" };
};

const applyTheme = (theme: StoredTheme) => {
  const root = document.documentElement;
  root.dataset.colorMode = theme.colorMode;
  root.dataset.accent = theme.accent;
  root.dataset.design = theme.design;
  root.style.colorScheme = theme.colorMode;
};

const ThemeContext = createContext<ThemeValue>({
  ...DEFAULT_THEME,
  setColorMode: () => undefined,
  toggleColorMode: () => undefined,
  setAccent: () => undefined,
  setDesign: () => undefined,
  resetTheme: () => undefined,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<StoredTheme>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // Ignore storage failures; the theme still applies for this session.
    }
  }, [theme]);

  const setColorMode = useCallback((colorMode: ColorMode) => {
    setTheme((current) => ({ ...current, colorMode }));
  }, []);

  const toggleColorMode = useCallback(() => {
    setTheme((current) => ({
      ...current,
      colorMode: current.colorMode === "dark" ? "light" : "dark",
    }));
  }, []);

  const setAccent = useCallback((accent: Accent) => {
    setTheme((current) => ({ ...current, accent }));
  }, []);

  const setDesign = useCallback((design: DashboardDesign) => {
    setTheme((current) => ({ ...current, design }));
  }, []);

  const resetTheme = useCallback(() => setTheme(DEFAULT_THEME), []);

  const value = useMemo<ThemeValue>(
    () => ({
      ...theme,
      setColorMode,
      toggleColorMode,
      setAccent,
      setDesign,
      resetTheme,
    }),
    [theme, setColorMode, toggleColorMode, setAccent, setDesign, resetTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeValue => useContext(ThemeContext);
