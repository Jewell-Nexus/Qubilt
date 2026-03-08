import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/shell/ThemeProvider';

const themeOrder = ['system', 'light', 'dark'] as const;
const themeIcons = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const idx = themeOrder.indexOf(theme);
    const next = themeOrder[(idx + 1) % themeOrder.length]!;
    setTheme(next);
  };

  const Icon = themeIcons[theme];

  return (
    <button
      onClick={cycle}
      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-secondary
                 hover:bg-surface-sunken hover:text-text-primary transition-colors duration-[var(--duration-fast)]"
      aria-label={`Theme: ${theme}`}
    >
      <Icon size={16} />
    </button>
  );
}
