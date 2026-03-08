import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import type { PmBoardCard, BoardType } from '../types/pm.types';

interface BoardCardProps {
  card: PmBoardCard;
  boardType: BoardType;
  onClick: () => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function isOverdue(dueDate?: string, isClosed?: boolean) {
  if (!dueDate || isClosed) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function BoardCard({ card, boardType, onClick }: BoardCardProps) {
  const wp = card.workPackage;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!wp) return null;

  const overdue = isOverdue(wp.dueDate, wp.status?.isClosed);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-surface-raised rounded-lg border border-border-default p-3 cursor-pointer',
        'shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)]',
        'transition-shadow duration-[var(--duration-base)]',
        isDragging && 'opacity-50 shadow-[var(--shadow-3)]',
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-mono text-text-tertiary">
          #{wp.id.slice(-6)}
        </span>
        {wp.priority && <PriorityBadge priority={wp.priority} compact />}
      </div>

      <p className="text-sm font-medium text-text-primary line-clamp-2 mb-2">
        {wp.subject}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {boardType !== 'STATUS' && wp.status && (
            <StatusBadge status={wp.status} size="sm" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {wp.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[11px]',
                overdue ? 'text-red-500' : 'text-text-tertiary',
              )}
            >
              <Calendar size={10} />
              {formatDate(wp.dueDate)}
            </span>
          )}

          {wp.assignee && (
            <div
              className="w-5 h-5 rounded-full bg-accent-subtle flex items-center justify-center text-[9px] font-medium text-accent-subtle-text flex-shrink-0"
              title={wp.assignee.displayName}
            >
              {wp.assignee.avatarUrl ? (
                <img
                  src={wp.assignee.avatarUrl}
                  alt={wp.assignee.displayName}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                getInitials(wp.assignee.displayName)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
