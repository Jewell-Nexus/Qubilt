import { Search } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { NotificationBell } from '@/shell/NotificationBell';
import { ThemeToggle } from '@/shell/ThemeToggle';
import { UserMenu } from '@/shell/UserMenu';

export function TopBar() {
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);

  return (
    <header className="h-12 border-b border-border-default bg-surface-raised flex items-center px-4 gap-3 flex-shrink-0">
      {/* Search trigger */}
      <button
        onClick={openCommandPalette}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-sunken
                   text-text-tertiary text-sm hover:bg-surface-raised border border-border-default
                   transition-colors duration-[var(--duration-fast)] flex-1 max-w-xs"
      >
        <Search size={14} />
        <span>Search...</span>
        <kbd className="ml-auto text-xs bg-surface-overlay px-1.5 py-0.5 rounded border border-border-default">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1 ml-auto">
        <NotificationBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
