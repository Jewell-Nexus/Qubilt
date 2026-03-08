import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeal } from '../hooks/use-crm-queries';
import { DealStatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { formatCurrency, formatDate } from '../lib/format';

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: deal, isPending } = useDeal(id ?? null);

  if (isPending) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!deal) {
    return <div className="p-6 text-center text-text-tertiary">Deal not found</div>;
  }

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/crm/pipelines')} className="mb-4">
        <LucideIcon name="ArrowLeft" size={14} className="mr-1" />
        Back to Pipelines
      </Button>
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{deal.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <DealStatusBadge status={deal.status} />
            <StageBadge name={deal.stage.name} color={deal.stage.color} />
            <span className="text-lg font-semibold">{formatCurrency(deal.value, deal.currency)}</span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">Created {formatDate(deal.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
