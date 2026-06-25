import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  ACCENT_KEY,
  THEME_KEY,
  type ThemeMode,
  applyTheme,
  getInitialAccent,
  getInitialTheme,
} from './accent';

interface ThemeContextValue {
  mode: ThemeMode;
  accent: string;
  toggleMode: () => void;
  setAccent: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialTheme);
  const [accent, setAccentState] = useState<string>(getInitialAccent);

  // Aplica tema + acento al <html> en cada cambio (el anti-FOUC ya aplicó el inicial).
  useEffect(() => {
    applyTheme(mode, accent);
  }, [mode, accent]);

  const toggleMode = useCallback(() => {
    setMode((m) => {
      const next: ThemeMode = m === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  const setAccent = useCallback((hex: string) => {
    localStorage.setItem(ACCENT_KEY, hex);
    setAccentState(hex);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, accent, toggleMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  return ctx;
}
