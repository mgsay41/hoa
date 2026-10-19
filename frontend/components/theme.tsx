"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "theme";

/**
 * Runs before paint (inlined in <head>) so the page never flashes the wrong theme.
 * Uses the saved choice, otherwise the OS preference.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}})();`;

/** Chart colours per theme — Recharts needs concrete values, not CSS variables. */
export const chartColors = {
  dark: {
    grid: "#1C3230",
    tick: "#6BA9A4",
    tooltipBg: "#0E1A19",
    tooltipBorder: "#1C3230",
    tooltipText: "#E0F7F5",
    income: "#34D399",
    expense: "#FB7185",
    primary: "#2DDAC4",
    fallback: "#4F7F7A",
    cursor: "rgba(45,218,196,0.06)",
  },
  light: {
    grid: "#DCE7E5",
    tick: "#3A6964",
    tooltipBg: "#FFFFFF",
    tooltipBorder: "#DCE7E5",
    tooltipText: "#0B2724",
    income: "#059669",
    expense: "#E11D48",
    primary: "#0F9D8A",
    fallback: "#5F807C",
    cursor: "rgba(15,157,138,0.06)",
  },
} as const;

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  colors: (typeof chartColors)[Theme];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getSnapshot = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
const getServerSnapshot = (): Theme => "dark";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The <html data-theme> attribute (set by themeInitScript) is the source of truth
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    const next: Theme = getSnapshot() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode) — the toggle still works for this visit
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: chartColors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
      title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
      className={`w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary hover:text-primary hover:bg-surface-elevated transition-colors ${className}`}
    >
      {isDark ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
