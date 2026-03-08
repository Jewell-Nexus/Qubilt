import type { DealStatus } from '../types/crm.types';

const STATUS_STYLES: Record<DealStatus, { bg: string; text: string; label: string }> = {
  OPEN: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
  WON: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Won' },
  LOST: { bg: 'bg-red-100', text: 'text-red-700', label: 'Lost' },
};

export function DealStatusBadge({ status }: { status: DealStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
