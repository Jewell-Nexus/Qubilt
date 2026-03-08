import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/cn';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { ContactAvatar } from './ContactAvatar';
import { formatCurrency, isOverdue, formatShortDate, contactName } from '../lib/format';
import type { CrmDeal } from '../types/crm.types';

interface DealCardProps {
  deal: CrmDeal;
  onClick: () => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, data: { deal } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(deal.expectedCloseDate);
  const value = Number(deal.value);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-surface-raised rounded-lg p-3 shadow-[var(--shadow-1)] cursor-grab',
        'hover:shadow-[var(--shadow-2)] transition-shadow duration-[var(--duration-base)]',
        isDragging && 'opacity-50 shadow-[var(--shadow-3)]',
      )}
    >
      <p className="text-sm font-medium text-text-primary line-clamp-2 mb-2">{deal.name}</p>

      {deal.contact && (
        <div className="flex items-center gap-1.5 mb-2">
          <ContactAvatar contact={deal.contact} size="sm" />
          <span className="text-xs text-text-secondary truncate">{contactName(deal.contact)}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{formatCurrency(value, deal.currency)}</span>
        {deal.expectedCloseDate && (
          <span className={cn('flex items-center gap-1 text-xs', overdue ? 'text-red-500' : 'text-text-tertiary')}>
            <LucideIcon name="Calendar" size={10} />
            {formatShortDate(deal.expectedCloseDate)}
          </span>
        )}
      </div>
    </div>
  );
}
