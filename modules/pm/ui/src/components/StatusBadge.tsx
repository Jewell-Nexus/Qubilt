import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import type { PmStatus } from '../types/pm.types';

interface StatusBadgeProps {
  status: PmStatus;
  size?: 'sm' | 'md';
  allStatuses?: PmStatus[];
  onStatusChange?: (statusId: string) => void;
  interactive?: boolean;
}

export function StatusBadge({
  status,
  size = 'md',
  allStatuses,
  onStatusChange,
  interactive = false,
}: StatusBadgeProps) {
  const [open, setOpen] = useState(false);

  const badge = (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        interactive && 'cursor-pointer hover:opacity-80 transition-opacity duration-[var(--duration-fast)]',
      )}
      style={{
        backgroundColor: status.color + '26',
        color: status.color,
      }}
    >
      {status.name}
    </span>
  );

  if (!interactive || !allStatuses || !onStatusChange) {
    return badge;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button type="button" />}>
        {badge}
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="space-y-0.5">
          {allStatuses.map((s) => (
            <button
              key={s.id}
              type="button"
              className={cn(
                'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors duration-[var(--duration-fast)]',
                s.id === status.id
                  ? 'bg-accent-subtle text-accent-subtle-text'
                  : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
              )}
              onClick={() => {
                onStatusChange(s.id);
                setOpen(false);
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
