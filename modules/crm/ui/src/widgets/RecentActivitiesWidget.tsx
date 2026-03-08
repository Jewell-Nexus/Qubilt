import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useUpcomingActivities, useCompleteActivity } from '../hooks/use-crm-queries';
import { ActivityItem } from '../components/ActivityItem';

export default function RecentActivitiesWidget() {
  const { data: activities, isPending } = useUpcomingActivities(14);
  const completeMut = useCompleteActivity();

  const handleComplete = (id: string) => {
    completeMut.mutate(id, {
      onSuccess: () => toast.success('Activity completed'),
    });
  };

  if (isPending) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const items = (activities ?? []).slice(0, 5);

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-text-primary mb-3">Upcoming Activities</h3>
      {items.length > 0 ? (
        <div className="space-y-1 divide-y divide-border-default">
          {items.map((a) => (
            <ActivityItem
              key={a.id}
              activity={a}
              showCheckbox
              onComplete={handleComplete}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-tertiary py-3">No upcoming activities</p>
      )}
    </div>
  );
}
