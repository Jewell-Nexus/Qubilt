import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Check, Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  module: string;
  moduleIcon: string;
  moduleAccentColor: string;
  resourceUrl?: string;
  read: boolean;
  createdAt: string;
}

type Filter = 'all' | 'unread';

function timeAgo(date: string): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationCenter() {
  const [filter, setFilter] = useState<Filter>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => get<Notification[]>('/notifications'),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => patch(`/notifications/${id}`, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => patch('/notifications/mark-all-read', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const filtered = notifications.filter((n) => {
    if (filter === 'unread' && n.read) return false;
    if (moduleFilter !== 'all' && n.module !== moduleFilter) return false;
    return true;
  });

  const modules = [...new Set(notifications.map((n) => n.module))];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Notifications</h1>
          <p className="text-sm text-text-secondary">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <Check size={14} />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread
        </Button>
        {modules.map((mod) => (
          <Button
            key={mod}
            variant={moduleFilter === mod ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setModuleFilter(moduleFilter === mod ? 'all' : mod)}
          >
            {mod}
          </Button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
            <Bell size={32} className="mb-3" />
            <p className="text-sm">No notifications to show.</p>
          </div>
        ) : (
          filtered.map((notification) => (
            <button
              key={notification.id}
              onClick={() => {
                if (!notification.read) markRead.mutate(notification.id);
                if (notification.resourceUrl) {
                  window.location.href = notification.resourceUrl;
                }
              }}
              className={cn(
                'w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                notification.read
                  ? 'hover:bg-surface-sunken'
                  : 'bg-accent-subtle/30 hover:bg-accent-subtle/50',
              )}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: notification.moduleAccentColor + '20',
                  color: notification.moduleAccentColor,
                }}
              >
                <LucideIcon name={notification.moduleIcon || 'Bell'} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">{notification.title}</span>
                  {!notification.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-default flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{notification.body}</p>
                <span className="text-xs text-text-tertiary mt-1 block">{timeAgo(notification.createdAt)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
