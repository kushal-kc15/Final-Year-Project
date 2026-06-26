import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'vm.theme';
const THEMES = new Set(['light', 'dark', 'system']);

const normalizeTheme = (value) => (THEMES.has(value) ? value : 'system');

const readStoredTheme = () => {
  try {
    return normalizeTheme(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'system';
  }
};

const systemPrefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const resolveTheme = (theme) =>
  theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;

const applyResolvedTheme = (resolvedTheme) => {
  const root = document.documentElement;
  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.style.colorScheme = resolvedTheme;
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  const resolvedTheme =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  const setTheme = useCallback((nextTheme) => {
    const normalized = normalizeTheme(nextTheme);
    applyResolvedTheme(resolveTheme(normalized));
    setThemeState(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // Theme still applies for this session when storage is unavailable.
    }
  }, []);

  useLayoutEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== 'system') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = (event) => setSystemDark(event.matches);
    setSystemDark(media.matches);
    media.addEventListener('change', updateSystemTheme);

    return () => media.removeEventListener('change', updateSystemTheme);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
