import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

export function formatCurrency(value: number | string, currency = 'USD'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatCurrencyFull(value: number | string, currency = 'USD'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatShortDate(date: string | Date): string {
  return format(new Date(date), 'MMM d');
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(date: string | Date | null): boolean {
  if (!date) return false;
  return isPast(new Date(date)) && !isToday(new Date(date));
}

export function dueDateLabel(date: string | Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isOverdue(date)) return format(d, 'MMM d') + ' (overdue)';
  return format(d, 'MMM d');
}

export function contactName(contact: { firstName?: string | null; lastName?: string | null; company?: string | null } | null | undefined): string {
  if (!contact) return 'Unknown';
  const parts = [contact.firstName, contact.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : contact.company ?? 'Unknown';
}

export function contactInitials(contact: { firstName?: string | null; lastName?: string | null } | null | undefined): string {
  if (!contact) return '?';
  const f = contact.firstName?.[0] ?? '';
  const l = contact.lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

export function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
}

export const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  CALL: { icon: 'Phone', color: '#10B981' },
  EMAIL: { icon: 'Mail', color: '#3B82F6' },
  MEETING: { icon: 'Users', color: '#8B5CF6' },
  TASK: { icon: 'CheckSquare', color: '#F59E0B' },
  NOTE: { icon: 'StickyNote', color: '#6B7280' },
  DEADLINE: { icon: 'Clock', color: '#EF4444' },
};
