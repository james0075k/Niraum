import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** next-themes-style provider: 'light' | 'dark' | 'system', persisted, SSR-safe. */
export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const media = '(prefers-color-scheme: dark)';

function readStored(key: string, fallback: Theme): Theme {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v === 'light' || v === 'dark' || v === 'system' ? v : fallback;
  } catch {
    return fallback;
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(() => readStored(storageKey, defaultTheme));
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(media).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(media);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        /* storage unavailable — keep in memory */
      }
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
