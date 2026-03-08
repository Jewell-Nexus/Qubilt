import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';
import { useActivities, useCompleteActivity, useUpcomingActivities } from '../hooks/use-crm-queries';
import { ActivityItem } from '../components/ActivityItem';
import { isOverdue, formatDate } from '../lib/format';
const WORKSPACE_ID = 'default';
const TYPES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All' },
  { value: 'CALL', label: 'Calls' },
  { value: 'EMAIL', label: 'Emails' },
  { value: 'MEETING', label: 'Meetings' },
  { value: 'TASK', label: 'Tasks' },
  { value: 'NOTE', label: 'Notes' },
  { value: 'DEADLINE', label: 'Deadlines' },
];

export default function ActivityList() {
  const [typeFilter, setTypeFilter] = useState('');
  const [myOnly, setMyOnly] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [page, setPage] = useState(1);

  const params: Record<string, unknown> = {
    workspaceId: WORKSPACE_ID,
    page,
    limit: 30,
  };
  if (typeFilter) params['type'] = typeFilter;
  if (!showCompleted) params['completed'] = 'false';

  const { data, isPending } = useActivities(params);
  const { data: overdue } = useUpcomingActivities(0);
  const completeMut = useCompleteActivity();

  const activities = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / 30);

  const overdueItems = (overdue ?? []).filter((a) => !a.completedAt && isOverdue(a.dueDate));

  const handleComplete = (id: string) => {
    completeMut.mutate(id, {
      onSuccess: () => toast.success('Activity completed'),
    });
  };

  // Group activities by date
  const grouped = new Map<string, typeof activities>();
  for (const a of activities) {
    const key = formatDate(a.createdAt);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Activities</h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 border border-border-default rounded-md">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => { setTypeFilter(t.value); setPage(1); }}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded transition-colors',
                typeFilter === t.value ? 'bg-[#EC4899]/10 text-[#EC4899]' : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button
          variant={myOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMyOnly(!myOnly)}
        >
          <LucideIcon name="User" size={14} className="mr-1" />
          My activities
        </Button>
        <Button
          variant={showCompleted ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setShowCompleted(!showCompleted); setPage(1); }}
        >
          {showCompleted ? 'Hide completed' : 'Show completed'}
        </Button>
      </div>

      {/* Overdue section */}
      {overdueItems.length > 0 && (
        <div className="mb-6 p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1.5">
            <LucideIcon name="AlertCircle" size={14} />
            Overdue ({overdueItems.length})
          </h3>
          <div className="space-y-1 divide-y divide-red-100">
            {overdueItems.map((a) => (
              <ActivityItem
                key={a.id}
                activity={a}
                showCheckbox
                onComplete={handleComplete}
              />
            ))}
          </div>
        </div>
      )}

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-medium text-text-tertiary mb-2 uppercase tracking-wider">{date}</h3>
              <div className="space-y-1 divide-y divide-border-default border border-border-default rounded-lg px-4">
                {items.map((a) => (
                  <ActivityItem
                    key={a.id}
                    activity={a}
                    showCheckbox
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center py-8 text-text-tertiary">No activities found</div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
