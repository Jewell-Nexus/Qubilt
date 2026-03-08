import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { useForecast, useFunnel, useRevenueTrend, useLeaderboard, usePipelines } from '../hooks/use-crm-queries';
import { formatCurrency } from '../lib/format';

const WORKSPACE_ID = 'default';

export default function CrmReports() {
  const [forecastPeriod, setForecastPeriod] = useState<'month' | 'quarter' | 'year'>('quarter');

  const { data: pipelines } = usePipelines(WORKSPACE_ID);
  const defaultPipelineId = pipelines?.[0]?.id ?? '';

  const { data: forecast, isPending: forecastLoading } = useForecast(WORKSPACE_ID, forecastPeriod);
  const { data: funnel, isPending: funnelLoading } = useFunnel(defaultPipelineId);
  const { data: trend, isPending: trendLoading } = useRevenueTrend(WORKSPACE_ID);
  const { data: leaderboard, isPending: lbLoading } = useLeaderboard(WORKSPACE_ID);

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold text-text-primary">Reports</h1>

      {/* Revenue Forecast */}
      <section className="border border-border-default rounded-lg p-6 bg-surface-default">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-text-primary">Revenue Forecast</h2>
          <div className="flex items-center gap-1 border border-border-default rounded-md">
            {(['month', 'quarter', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setForecastPeriod(p)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded transition-colors capitalize',
                  forecastPeriod === p ? 'bg-[#EC4899]/10 text-[#EC4899]' : 'text-text-secondary',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {forecastLoading ? <Skeleton className="h-64 w-full" /> : forecast ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-surface-sunken">
                <p className="text-xs text-text-tertiary">Expected Revenue</p>
                <p className="text-xl font-semibold text-text-primary">{formatCurrency(forecast.expectedRevenue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-sunken">
                <p className="text-xs text-text-tertiary">Weighted Revenue</p>
                <p className="text-xl font-semibold text-[#EC4899]">{formatCurrency(forecast.weightedRevenue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-sunken">
                <p className="text-xs text-text-tertiary">Open Deals</p>
                <p className="text-xl font-semibold text-text-primary">{forecast.dealCount}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={forecast.byPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="period" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="expectedRevenue" name="Expected" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="weightedRevenue" name="Weighted" fill="#EC4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : null}
      </section>

      {/* Funnel */}
      <section className="border border-border-default rounded-lg p-6 bg-surface-default">
        <h2 className="text-base font-medium text-text-primary mb-4">Sales Funnel</h2>
        {funnelLoading ? <Skeleton className="h-48 w-full" /> : funnel && funnel.length > 0 ? (
          <div className="space-y-2">
            {funnel.map((stage, i) => {
              const maxCount = Math.max(...funnel.map((s) => s.dealCount), 1);
              const width = Math.max((stage.dealCount / maxCount) * 100, 10);
              return (
                <div key={stage.stageId} className="flex items-center gap-3">
                  <span className="text-sm w-28 text-text-secondary truncate">{stage.stageName}</span>
                  <div className="flex-1 h-8 rounded overflow-hidden bg-surface-sunken relative">
                    <div
                      className="h-full rounded flex items-center justify-end px-2 transition-all duration-300"
                      style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, #EC4899${Math.round(40 + i * 15).toString(16).padStart(2, '0')}, #EC4899)`,
                      }}
                    >
                      <span className="text-xs font-medium text-white">{stage.dealCount}</span>
                    </div>
                  </div>
                  <div className="text-right w-24">
                    <p className="text-sm font-medium text-text-primary">{formatCurrency(stage.totalValue)}</p>
                    <p className="text-xs text-text-tertiary">{stage.conversionRate}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-text-tertiary text-sm">No funnel data</p>
        )}
      </section>

      {/* Revenue Trend */}
      <section className="border border-border-default rounded-lg p-6 bg-surface-default">
        <h2 className="text-base font-medium text-text-primary mb-4">Revenue Trend (12 months)</h2>
        {trendLoading ? <Skeleton className="h-64 w-full" /> : trend && trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="wonValue" name="Won Revenue" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="lostValue" name="Lost Value" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-text-tertiary text-sm">No trend data</p>
        )}
      </section>

      {/* Leaderboard */}
      <section className="border border-border-default rounded-lg p-6 bg-surface-default">
        <h2 className="text-base font-medium text-text-primary mb-4">Leaderboard</h2>
        {lbLoading ? <Skeleton className="h-48 w-full" /> : leaderboard && leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-text-secondary">
                  <th className="text-left py-2 px-3 font-medium">#</th>
                  <th className="text-left py-2 px-3 font-medium">Owner</th>
                  <th className="text-right py-2 px-3 font-medium">Won Deals</th>
                  <th className="text-right py-2 px-3 font-medium">Won Value</th>
                  <th className="text-right py-2 px-3 font-medium">Open Pipeline</th>
                  <th className="text-right py-2 px-3 font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {leaderboard.map((owner, i) => (
                  <tr key={owner.ownerId} className="hover:bg-surface-hover">
                    <td className="py-2 px-3 text-text-tertiary">{i + 1}</td>
                    <td className="py-2 px-3 text-text-primary font-medium">{owner.ownerId.slice(0, 8)}...</td>
                    <td className="py-2 px-3 text-right">{owner.wonDeals}</td>
                    <td className="py-2 px-3 text-right font-medium text-emerald-600">{formatCurrency(owner.wonValue)}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(owner.openValue)}</td>
                    <td className="py-2 px-3 text-right">{owner.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-tertiary text-sm">No data</p>
        )}
      </section>
    </div>
  );
}
