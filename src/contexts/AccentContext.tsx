"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ACCENT_PALETTES,
  AccentName,
  AccentPalette,
  DEFAULT_ACCENT,
  applyAccent,
} from "@/lib/accent-palettes";

interface AccentContextType {
  accent: AccentName;
  palette: AccentPalette;
  setAccent: (accent: AccentName) => void;
  mounted: boolean;
}

const AccentContext = createContext<AccentContextType | undefined>(undefined);

const STORAGE_KEY = "accent";

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentName>(DEFAULT_ACCENT);
  const [mounted, setMounted] = useState(false);

  // Lectura inicial desde localStorage (funciona en navegador y Capacitor WebView).
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AccentName | null;
      if (saved && saved in ACCENT_PALETTES) {
        setAccentState(saved);
      }
    } catch {
      /* localStorage puede fallar en algunos modos privados */
    }
  }, []);

  // Inyectar CSS variables cada vez que cambia el accent.
  useEffect(() => {
    if (!mounted) return;
    applyAccent(document.documentElement, ACCENT_PALETTES[accent]);
  }, [accent, mounted]);

  const setAccent = useCallback((next: AccentName) => {
    setAccentState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignora errores de quota */
    }
  }, []);

  return (
    <AccentContext.Provider
      value={{
        accent,
        palette: ACCENT_PALETTES[accent],
        setAccent,
        mounted,
      }}
    >
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error("useAccent must be used within an AccentProvider");
  return ctx;
}
