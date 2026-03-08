import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useModulesStore } from '@/stores/modules.store';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { cn } from '@/lib/cn';

interface Command {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const close = useUIStore((s) => s.closeCommandPalette);
  const openPalette = useUIStore((s) => s.openCommandPalette);
  const enabledModules = useModulesStore((s) => s.enabledModules);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          close();
        } else {
          openPalette();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, close, openPalette]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const go = useCallback(
    (path: string) => {
      navigate(path);
      close();
    },
    [navigate, close],
  );

  const commands: Command[] = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: 'LayoutDashboard', action: () => go('/dashboard') },
    { id: 'settings', label: 'Open Settings', icon: 'Settings', action: () => go('/settings') },
    ...enabledModules.map((mod) => ({
      id: `module-${mod.id}`,
      label: `Go to ${mod.name}`,
      icon: mod.icon,
      action: () => go(mod.navigation[0]?.path || `/modules/${mod.id}`),
    })),
  ];

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={close} />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl bg-surface-overlay rounded-xl shadow-4 border border-border-default overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-default">
          <Search size={16} className="text-text-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary
                       outline-none border-none"
          />
          <kbd className="text-xs text-text-tertiary bg-surface-sunken px-1.5 py-0.5 rounded border border-border-default">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-sm text-text-tertiary text-center">No results found</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-2 text-sm text-left',
                  'transition-colors duration-[var(--duration-fast)]',
                  i === selectedIndex
                    ? 'bg-accent-subtle text-accent-subtle-text'
                    : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
                )}
              >
                <LucideIcon name={cmd.icon} size={16} />
                <span>{cmd.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
