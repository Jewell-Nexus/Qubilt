import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => get<{ count: number }>('/notifications/unread-count').then((r) => r.count),
    refetchInterval: 30_000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => get<Notification[]>('/notifications?limit=5'),
    enabled: open,
  });

  const markAllRead = useMutation({
    mutationFn: () => post('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.setQueryData(['notifications', 'unread-count'], { count: 0 });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative inline-flex items-center justify-center w-8 h-8 rounded-md text-text-secondary
                   hover:bg-surface-sunken hover:text-text-primary transition-colors duration-[var(--duration-fast)]"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center
                           min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-error)] text-white text-[10px] font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-3">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-default">
          <span className="text-sm font-medium text-text-primary">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-accent-default hover:text-accent-hover transition-colors duration-[var(--duration-fast)]"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-sm text-text-tertiary text-center">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-3 py-2 border-b border-border-default last:border-0 ${
                  !n.read ? 'bg-accent-subtle/30' : ''
                }`}
              >
                <p className="text-sm font-medium text-text-primary">{n.title}</p>
                <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.body}</p>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-border-default px-3 py-2">
          <a
            href="/notifications"
            className="text-xs text-accent-default hover:text-accent-hover transition-colors duration-[var(--duration-fast)]"
          >
            View all notifications
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
