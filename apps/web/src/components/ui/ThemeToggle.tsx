import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/lib/theme';

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-feed-border bg-feed-card text-feed-text-secondary shadow-sm transition-colors hover:border-feed-text-muted hover:text-feed-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-feed-accent"
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? (
        <Sun aria-hidden="true" size={17} strokeWidth={2} />
      ) : (
        <Moon aria-hidden="true" size={17} strokeWidth={2} />
      )}
    </button>
  );
}
