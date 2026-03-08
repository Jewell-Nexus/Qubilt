import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Shortcut {
  keys: string;
  description: string;
}

interface ShortcutGroup {
  category: string;
  shortcuts: Shortcut[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: '⌘K', description: 'Command palette' },
      { keys: 'G then D', description: 'Go to dashboard' },
      { keys: 'G then P', description: 'Go to projects' },
    ],
  },
  {
    category: 'Global',
    shortcuts: [
      { keys: '⌘/', description: 'Toggle sidebar' },
      { keys: '⌘.', description: 'Toggle theme' },
      { keys: '?', description: 'Keyboard shortcuts' },
    ],
  },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          {shortcutGroups.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.keys} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">{shortcut.description}</span>
                    <kbd className="inline-flex items-center gap-1 rounded bg-surface-sunken px-2 py-1 text-xs font-mono text-text-secondary border border-border-default">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
