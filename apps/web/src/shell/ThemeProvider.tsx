import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useUIStore } from '@/stores/ui.store';

type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  resolvedTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
  workspaceId?: string;
}

export function ThemeProvider({ children, workspaceId }: ThemeProviderProps) {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const [workspaceOverrides, setWorkspaceOverrides] = useState<string | null>(null);

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mq.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  // Apply data-theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  // Fetch workspace theme overrides
  useEffect(() => {
    if (!workspaceId) {
      setWorkspaceOverrides(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { get } = await import('@/lib/api');
        const overrides = await get<Record<string, string>>(
          `/workspaces/${workspaceId}/theme`,
        );
        if (cancelled) return;

        const css = Object.entries(overrides)
          .map(([key, value]) => `${key}: ${value};`)
          .join('\n    ');
        setWorkspaceOverrides(css ? `[data-theme] {\n    ${css}\n  }` : null);
      } catch {
        if (!cancelled) setWorkspaceOverrides(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  // Inject workspace CSS overrides
  useEffect(() => {
    const styleId = 'workspace-theme';
    let el = document.getElementById(styleId) as HTMLStyleElement | null;

    if (workspaceOverrides) {
      if (!el) {
        el = document.createElement('style');
        el.id = styleId;
        document.head.appendChild(el);
      }
      el.textContent = workspaceOverrides;
    } else if (el) {
      el.remove();
    }
  }, [workspaceOverrides]);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
