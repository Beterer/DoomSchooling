import { create } from 'zustand';

export type Theme = 'light' | 'dark';

// Keep in sync with the pre-render script in index.html.
const STORAGE_KEY = 'doomschooling:theme';
const DEFAULT_THEME: Theme = 'dark';
const THEME_COLORS: Record<Theme, string> = {
  light: '#f5f7fb',
  dark: '#0b1020',
};

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
}

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: readStoredTheme() ?? DEFAULT_THEME,
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this visit.
    }

    applyTheme(next);
    set({ theme: next });
  },
}));

export function initTheme() {
  applyTheme(useThemeStore.getState().theme);
}
