import {
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PmPriority } from '../types/pm.types';

interface PriorityBadgeProps {
  priority: PmPriority;
  compact?: boolean;
}

const PRIORITY_ICONS: Record<string, typeof ChevronUp> = {
  Immediate: ChevronsUp,
  Urgent: ChevronsUp,
  High: ChevronUp,
  Normal: Minus,
  Low: ChevronDown,
  'Very Low': ChevronsDown,
};

export function PriorityBadge({ priority, compact = false }: PriorityBadgeProps) {
  const Icon = PRIORITY_ICONS[priority.name] ?? Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap',
        compact ? 'text-xs' : 'text-sm',
      )}
    >
      <Icon size={compact ? 12 : 14} style={{ color: priority.color }} />
      {!compact && (
        <span className="text-text-secondary">{priority.name}</span>
      )}
    </span>
  );
}
