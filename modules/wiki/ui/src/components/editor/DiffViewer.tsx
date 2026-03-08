import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import DiffMatchPatch from 'diff-match-patch';

interface DiffViewerProps {
  contentA: unknown;
  contentB: unknown;
  labelA: string;
  labelB: string;
}

function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as Record<string, unknown>;
  if (typeof n.text === 'string') return n.text;
  if (Array.isArray(n.content)) {
    return n.content.map((child: unknown) => extractText(child)).join('\n');
  }
  return '';
}

export default function DiffViewer({ contentA, contentB, labelA, labelB }: DiffViewerProps) {
  const [mode, setMode] = useState<'unified' | 'side-by-side'>('unified');

  const dmp = useMemo(() => new DiffMatchPatch(), []);

  const textA = useMemo(() => extractText(contentA), [contentA]);
  const textB = useMemo(() => extractText(contentB), [contentB]);

  const diffs = useMemo(() => {
    const d = dmp.diff_main(textA, textB);
    dmp.diff_cleanupSemantic(d);
    return d;
  }, [dmp, textA, textB]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const [op, text] of diffs) {
      const lines = text.split('\n').length - 1 || 1;
      if (op === 1) added += lines;
      if (op === -1) removed += lines;
    }
    return { added, removed };
  }, [diffs]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-text-secondary">{labelA}</span>
          <span className="text-text-tertiary">→</span>
          <span className="text-text-secondary">{labelB}</span>
          <span className="text-green-600 text-xs">+{stats.added}</span>
          <span className="text-red-500 text-xs">-{stats.removed}</span>
        </div>
        <div className="flex items-center gap-1 bg-surface-sunken rounded-md p-0.5">
          <button
            onClick={() => setMode('unified')}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              mode === 'unified'
                ? 'bg-surface-overlay shadow-1 text-text-primary'
                : 'text-text-tertiary hover:text-text-primary',
            )}
          >
            Unified
          </button>
          <button
            onClick={() => setMode('side-by-side')}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              mode === 'side-by-side'
                ? 'bg-surface-overlay shadow-1 text-text-primary'
                : 'text-text-tertiary hover:text-text-primary',
            )}
          >
            Side by side
          </button>
        </div>
      </div>

      {/* Diff content */}
      {mode === 'unified' ? (
        <UnifiedDiff diffs={diffs} />
      ) : (
        <SideBySideDiff textA={textA} textB={textB} diffs={diffs} />
      )}
    </div>
  );
}

function UnifiedDiff({ diffs }: { diffs: [number, string][] }) {
  return (
    <div className="bg-surface-default border border-border-default rounded-lg overflow-hidden font-mono text-sm">
      {diffs.map(([op, text], i) => {
        if (op === 0) {
          return (
            <div key={i} className="px-4 py-0.5 text-text-primary whitespace-pre-wrap">
              {text}
            </div>
          );
        }
        if (op === 1) {
          return (
            <div key={i} className="px-4 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 whitespace-pre-wrap">
              {text}
            </div>
          );
        }
        return (
          <div key={i} className="px-4 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 line-through whitespace-pre-wrap">
            {text}
          </div>
        );
      })}
    </div>
  );
}

function SideBySideDiff({ textA, textB }: { textA: string; textB: string; diffs: [number, string][] }) {
  const linesA = textA.split('\n');
  const linesB = textB.split('\n');
  const maxLines = Math.max(linesA.length, linesB.length);

  return (
    <div className="flex gap-2">
      <div className="flex-1 bg-surface-default border border-border-default rounded-lg overflow-hidden font-mono text-sm">
        {Array.from({ length: maxLines }, (_, i) => {
          const lineA = linesA[i] ?? '';
          const lineB = linesB[i] ?? '';
          const changed = lineA !== lineB;
          return (
            <div
              key={i}
              className={cn(
                'px-4 py-0.5 whitespace-pre-wrap',
                changed ? 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300' : 'text-text-primary',
              )}
            >
              {lineA || '\u00A0'}
            </div>
          );
        })}
      </div>
      <div className="flex-1 bg-surface-default border border-border-default rounded-lg overflow-hidden font-mono text-sm">
        {Array.from({ length: maxLines }, (_, i) => {
          const lineA = linesA[i] ?? '';
          const lineB = linesB[i] ?? '';
          const changed = lineA !== lineB;
          return (
            <div
              key={i}
              className={cn(
                'px-4 py-0.5 whitespace-pre-wrap',
                changed ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300' : 'text-text-primary',
              )}
            >
              {lineB || '\u00A0'}
            </div>
          );
        })}
      </div>
    </div>
  );
}
