import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { usePipelines } from '../hooks/use-crm-queries';
import { StageBadge } from '../components/StageBadge';
import { formatCurrency } from '../lib/format';

const WORKSPACE_ID = 'default';

const COLORS = ['#6366F1', '#3B82F6', '#F59E0B', '#F97316', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

export default function PipelineSummaryWidget() {
  const { data: pipelines, isPending } = usePipelines(WORKSPACE_ID);
  const pipeline = pipelines?.[0];

  if (isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!pipeline) {
    return <div className="text-sm text-text-tertiary p-4">No pipeline data</div>;
  }

  const stages = pipeline.stages.filter((s) => (s.dealCount ?? 0) > 0);
  const chartData = stages.map((s) => ({
    name: s.name,
    value: s.dealCount ?? 0,
    color: s.color ?? '#6B7280',
  }));

  const totalDeals = pipeline.stages.reduce((s, st) => s + (st.dealCount ?? 0), 0);
  const totalValue = pipeline.stages.reduce((s, st) => s + (st.totalValue ?? 0), 0);

  // Top 3 by value (need deals from board data, show stages instead)
  const topStages = [...pipeline.stages]
    .filter((s) => (s.totalValue ?? 0) > 0)
    .sort((a, b) => (b.totalValue ?? 0) - (a.totalValue ?? 0))
    .slice(0, 3);

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-text-primary mb-3">{pipeline.name}</h3>

      {chartData.length > 0 ? (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={2}
              >
                {chartData.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.color || COLORS[i % COLORS.length]!} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1">
            <p className="text-lg font-semibold text-text-primary">{formatCurrency(totalValue)}</p>
            <p className="text-xs text-text-tertiary">{totalDeals} open deals</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-tertiary py-4">No deals in pipeline</p>
      )}

      {topStages.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {topStages.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <StageBadge name={s.name} color={s.color} />
              <span className="font-medium text-text-primary">{formatCurrency(s.totalValue ?? 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
