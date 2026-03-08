import { LucideIcon } from '@/components/ui/LucideIcon';
import { cn } from '@/lib/cn';
import { formatRelative, isOverdue, ACTIVITY_ICONS } from '../lib/format';
import type { CrmActivity } from '../types/crm.types';

interface ActivityItemProps {
  activity: CrmActivity;
  onComplete?: (id: string) => void;
  showCheckbox?: boolean;
}

export function ActivityItem({ activity, onComplete, showCheckbox }: ActivityItemProps) {
  const config = ACTIVITY_ICONS[activity.type] ?? ACTIVITY_ICONS['NOTE']!;
  const completed = !!activity.completedAt;
  const overdue = !completed && isOverdue(activity.dueDate);

  return (
    <div className="flex items-start gap-3 py-2">
      {showCheckbox && (
        <button
          onClick={() => !completed && onComplete?.(activity.id)}
          className={cn(
            'mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
            completed
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-border-default hover:border-accent-default',
          )}
        >
          {completed && (
            <LucideIcon name="Check" size={10} className="text-white" />
          )}
        </button>
      )}
      <div
        className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.color + '20' }}
      >
        <span style={{ color: config.color }}><LucideIcon name={config.icon} size={14} /></span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm text-text-primary', completed && 'line-through text-text-tertiary')}>
          {activity.subject}
        </p>
        {activity.description && (
          <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">{activity.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
          <span>{formatRelative(activity.createdAt)}</span>
          {activity.dueDate && (
            <span className={cn(overdue && 'text-red-500 font-medium')}>
              Due {formatRelative(activity.dueDate)}
            </span>
          )}
          {activity.contact && (
            <span>{activity.contact.firstName} {activity.contact.lastName}</span>
          )}
          {activity.deal && (
            <span>{activity.deal.name}</span>
          )}
        </div>
      </div>
    </div>
  );
}
