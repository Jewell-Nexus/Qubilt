import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Search, X, FileText } from 'lucide-react';
import { useSearchPages } from '../hooks/use-wiki-queries';

interface WikiSearchProps {
  workspaceId: string;
  onClose: () => void;
}

export default function WikiSearch({ workspaceId, onClose }: WikiSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results } = useSearchPages(workspaceId, query);
  const items = (results as unknown as { data: Array<{ id: string; title: string; slug: string; currentVersion?: { textContent?: string } | null }> })?.data ?? [];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback((pageId: string) => {
    navigate(`/wiki/${pageId}`);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && items[selectedIndex]) {
      handleSelect(items[selectedIndex].id);
    }
  }, [items, selectedIndex, handleSelect, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Search panel */}
      <div className="relative w-full max-w-lg bg-surface-overlay rounded-lg shadow-3 border border-border-default overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-default">
          <Search size={16} className="text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search wiki pages..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        {query.length >= 2 && (
          <div className="max-h-72 overflow-y-auto py-1">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-sm text-text-tertiary text-center">
                No pages found
              </div>
            ) : (
              items.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => handleSelect(page.id)}
                  className={cn(
                    'flex items-start gap-3 w-full px-4 py-2.5 text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-surface-sunken'
                      : 'hover:bg-surface-sunken',
                  )}
                >
                  <FileText size={14} className="text-text-tertiary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {page.title}
                    </div>
                    {page.currentVersion?.textContent && (
                      <div className="text-xs text-text-tertiary truncate mt-0.5">
                        {highlightMatch(page.currentVersion.textContent.slice(0, 100), query)}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text;
}
