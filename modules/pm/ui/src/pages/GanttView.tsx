import { useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useWorkPackages,
  useTypes,
  useBaselines,
  useBaselineComparison,
  useUpdateWorkPackage,
} from '../hooks/use-pm-queries';
import type { WorkPackage, BaselineComparisonItem } from '../types/pm.types';

type ZoomLevel = 'week' | 'month' | 'quarter';

const COL_WIDTHS: Record<ZoomLevel, number> = { week: 60, month: 30, quarter: 10 };
const ROW_HEIGHT = 36;
const BAR_HEIGHT = 20;
const LEFT_PANEL_WIDTH = 300;
const HEADER_HEIGHT_FULL = 50;
const HEADER_HEIGHT_COMPACT = 25;

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatMonth(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function getDateRange(zoom: ZoomLevel): [Date, Date] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  switch (zoom) {
    case 'week':
      return [addDays(today, -7), addDays(today, 21)];
    case 'month':
      return [addDays(today, -14), addDays(today, 42)];
    case 'quarter':
      return [addDays(today, -30), addDays(today, 90)];
  }
}

export default function GanttView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const workspaceId = 'default';

  const [zoom, setZoom] = useState<ZoomLevel>('month');
  const [showBaseline, setShowBaseline] = useState(false);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    wpId: string;
    mode: 'move' | 'resize';
    startX: number;
    origStart: string;
    origDue: string;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const { data: wpData, isPending } = useWorkPackages(projectId!, { limit: 500 });
  const { data: types } = useTypes(workspaceId);
  const { data: baselines } = useBaselines(projectId!);
  const { data: comparison } = useBaselineComparison(selectedBaselineId ?? '');
  const updateWp = useUpdateWorkPackage();

  const colWidth = COL_WIDTHS[zoom];
  const [rangeStart, rangeEnd] = useMemo(() => getDateRange(zoom), [zoom]);
  const totalDays = daysBetween(rangeStart, rangeEnd);
  const svgWidth = totalDays * colWidth;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = daysBetween(rangeStart, today);
  const headerHeight = zoom === 'quarter' ? HEADER_HEIGHT_COMPACT : HEADER_HEIGHT_FULL;

  const workPackages = useMemo(() => {
    if (!wpData?.data) return [];
    return wpData.data.filter((wp) => wp.startDate || wp.dueDate);
  }, [wpData]);

  const svgHeight = workPackages.length * ROW_HEIGHT + headerHeight + 10;

  const typeMap = useMemo(() => {
    const m = new Map<string, { color: string; name: string }>();
    types?.forEach((t) => m.set(t.id, { color: t.color, name: t.name }));
    return m;
  }, [types]);

  const baselineMap = useMemo(() => {
    if (!comparison) return new Map<string, BaselineComparisonItem>();
    const m = new Map<string, BaselineComparisonItem>();
    comparison.changed.forEach((c) => m.set(c.workPackageId, c));
    return m;
  }, [comparison]);

  const monthHeaders = useMemo(() => {
    const headers: { label: string; x: number; width: number }[] = [];
    let current = new Date(rangeStart);
    while (current < rangeEnd) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const visibleStart = monthStart < rangeStart ? rangeStart : monthStart;
      const visibleEnd = monthEnd > rangeEnd ? rangeEnd : monthEnd;
      const x = daysBetween(rangeStart, visibleStart) * colWidth;
      const width = (daysBetween(visibleStart, visibleEnd) + 1) * colWidth;
      headers.push({ label: formatMonth(visibleStart), x, width });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return headers;
  }, [rangeStart, rangeEnd, colWidth]);

  const dayHeaders = useMemo(() => {
    if (zoom === 'quarter') return [];
    const days: { label: string; x: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(rangeStart, i);
      days.push({ label: String(d.getDate()), x: i * colWidth + colWidth / 2 });
    }
    return days;
  }, [rangeStart, totalDays, colWidth, zoom]);

  const getBarProps = useCallback(
    (wp: WorkPackage) => {
      const start = wp.startDate ? new Date(wp.startDate) : wp.dueDate ? new Date(wp.dueDate) : null;
      const due = wp.dueDate ? new Date(wp.dueDate) : wp.startDate ? new Date(wp.startDate) : null;
      if (!start || !due) return null;
      const startDay = daysBetween(rangeStart, start);
      const duration = Math.max(1, daysBetween(start, due) + 1);
      return { x: startDay * colWidth, width: duration * colWidth };
    },
    [rangeStart, colWidth],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, wp: WorkPackage, mode: 'move' | 'resize') => {
      e.stopPropagation();
      if (!wp.startDate || !wp.dueDate) return;
      setDragState({ wpId: wp.id, mode, startX: e.clientX, origStart: wp.startDate, origDue: wp.dueDate });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState) return;
      const dx = e.clientX - dragState.startX;
      const dayDelta = Math.round(dx / colWidth);
      if (dayDelta === 0) return;

      const origStart = new Date(dragState.origStart);
      const origDue = new Date(dragState.origDue);

      let newStart: string;
      let newDue: string;

      if (dragState.mode === 'move') {
        newStart = addDays(origStart, dayDelta).toISOString().slice(0, 10);
        newDue = addDays(origDue, dayDelta).toISOString().slice(0, 10);
      } else {
        newStart = dragState.origStart;
        newDue = addDays(origDue, dayDelta).toISOString().slice(0, 10);
      }

      updateWp.mutate({ id: dragState.wpId, dto: { startDate: newStart, dueDate: newDue } });
    },
    [dragState, colWidth, updateWp],
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handleExport = useCallback(() => {
    if (!projectId) return;
    const apiBase = import.meta.env.VITE_API_URL || '/api/v1';
    window.open(`${apiBase}/pm/projects/${projectId}/gantt/export.pdf`, '_blank');
  }, [projectId]);

  if (isPending) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border-default bg-surface-default">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">Gantt Chart</span>
          <div className="flex items-center rounded-md border border-border-default overflow-hidden ml-3">
            {(['week', 'month', 'quarter'] as ZoomLevel[]).map((z) => (
              <button
                key={z}
                type="button"
                className={cn(
                  'px-3 py-1 text-xs font-medium capitalize transition-colors duration-[var(--duration-fast)]',
                  zoom === z
                    ? 'bg-accent-subtle text-accent-subtle-text'
                    : 'text-text-secondary hover:bg-surface-sunken',
                )}
                onClick={() => setZoom(z)}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {baselines && baselines.length > 0 && (
            <Button
              variant={showBaseline ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setShowBaseline(!showBaseline);
                if (!showBaseline && baselines.length > 0 && !selectedBaselineId && baselines[0]) {
                  setSelectedBaselineId(baselines[0].id);
                }
              }}
            >
              <span className="flex items-center gap-1.5">
                <LucideIcon name="GitCompareArrows" size={14} />
                Baseline
              </span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <span className="flex items-center gap-1.5">
              <LucideIcon name="Download" size={14} />
              Export PDF
            </span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: WP tree */}
        <div
          className="border-r border-border-default overflow-y-auto flex-shrink-0"
          style={{ width: LEFT_PANEL_WIDTH }}
        >
          <div
            className="sticky top-0 bg-surface-default border-b border-border-default px-3 flex items-center text-xs font-medium text-text-secondary"
            style={{ height: headerHeight }}
          >
            Work Package
          </div>
          {workPackages.map((wp) => {
            const typeInfo = typeMap.get(wp.typeId);
            return (
              <div
                key={wp.id}
                className="flex items-center gap-2 px-3 border-b border-border-subtle hover:bg-surface-sunken cursor-pointer transition-colors duration-[var(--duration-fast)]"
                style={{ height: ROW_HEIGHT }}
                onClick={() => navigate(`/projects/${projectId}/work-packages/${wp.id}`)}
              >
                <span className="flex-shrink-0">
                  <LucideIcon name={wp.type?.isMilestone ? 'Diamond' : 'FileText'} size={14} />
                </span>
                <span className="text-xs text-text-primary truncate flex-1">{wp.subject}</span>
                {typeInfo && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: typeInfo.color }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Right panel: SVG timeline */}
        <div className="flex-1 overflow-auto">
          <svg
            ref={svgRef}
            width={svgWidth}
            height={svgHeight}
            className="select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Month headers */}
            {monthHeaders.map((h, i) => (
              <g key={i}>
                <rect x={h.x} y={0} width={h.width} height={20} className="fill-surface-default stroke-border-subtle" strokeWidth={0.5} />
                <text x={h.x + h.width / 2} y={14} textAnchor="middle" className="fill-text-secondary" style={{ fontSize: 10 }}>
                  {h.label}
                </text>
              </g>
            ))}

            {/* Day numbers */}
            {dayHeaders.map((d, i) => (
              <text key={i} x={d.x} y={38} textAnchor="middle" className="fill-text-tertiary" style={{ fontSize: 9 }}>
                {d.label}
              </text>
            ))}

            {/* Grid lines */}
            {Array.from({ length: totalDays + 1 }).map((_, i) => (
              <line key={i} x1={i * colWidth} y1={headerHeight} x2={i * colWidth} y2={svgHeight} className="stroke-border-subtle" strokeWidth={0.5} />
            ))}

            {/* Row lines */}
            {workPackages.map((_, i) => (
              <line key={i} x1={0} y1={headerHeight + (i + 1) * ROW_HEIGHT} x2={svgWidth} y2={headerHeight + (i + 1) * ROW_HEIGHT} className="stroke-border-subtle" strokeWidth={0.5} />
            ))}

            {/* Today line */}
            {todayOffset >= 0 && todayOffset <= totalDays && (
              <line x1={todayOffset * colWidth} y1={0} x2={todayOffset * colWidth} y2={svgHeight} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 3" />
            )}

            {/* Baseline bars */}
            {showBaseline &&
              workPackages.map((wp, i) => {
                const bl = baselineMap.get(wp.id);
                if (!bl?.baselineStartDate || !bl?.baselineDueDate) return null;
                const startDay = daysBetween(rangeStart, new Date(bl.baselineStartDate));
                const duration = Math.max(1, daysBetween(new Date(bl.baselineStartDate), new Date(bl.baselineDueDate)) + 1);
                const yOff = headerHeight + i * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
                return (
                  <rect
                    key={`bl-${wp.id}`}
                    x={startDay * colWidth}
                    y={yOff + 2}
                    width={duration * colWidth}
                    height={BAR_HEIGHT - 4}
                    rx={3}
                    className="fill-text-tertiary/20 stroke-text-tertiary"
                    strokeWidth={1}
                    strokeDasharray="3 2"
                  />
                );
              })}

            {/* WP bars */}
            {workPackages.map((wp, i) => {
              const bar = getBarProps(wp);
              if (!bar) return null;
              const typeInfo = typeMap.get(wp.typeId);
              const color = typeInfo?.color ?? '#6B7280';
              const yOff = headerHeight + i * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;

              const bl = baselineMap.get(wp.id);
              let diffColor: string | null = null;
              if (showBaseline && bl) {
                const currentDue = wp.dueDate ? new Date(wp.dueDate) : null;
                const baseDue = bl.baselineDueDate ? new Date(bl.baselineDueDate) : null;
                if (currentDue && baseDue) {
                  diffColor = currentDue > baseDue ? '#F59E0B' : currentDue < baseDue ? '#3B82F6' : null;
                }
              }

              return (
                <g key={wp.id}>
                  <rect
                    x={bar.x}
                    y={yOff}
                    width={Math.max(bar.width, colWidth / 2)}
                    height={BAR_HEIGHT}
                    rx={4}
                    fill={color}
                    fillOpacity={0.7}
                    stroke={diffColor ?? color}
                    strokeWidth={2}
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleMouseDown(e, wp, 'move')}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${projectId}/work-packages/${wp.id}`);
                    }}
                  />
                  <rect
                    x={bar.x + Math.max(bar.width, colWidth / 2) - 6}
                    y={yOff}
                    width={6}
                    height={BAR_HEIGHT}
                    rx={2}
                    fill="transparent"
                    className="cursor-ew-resize"
                    onMouseDown={(e) => handleMouseDown(e, wp, 'resize')}
                  />
                  {bar.width > 80 && (
                    <text
                      x={bar.x + 6}
                      y={yOff + BAR_HEIGHT / 2 + 3.5}
                      className="fill-white pointer-events-none"
                      style={{ fontSize: 10, fontWeight: 500 }}
                    >
                      {wp.subject.slice(0, Math.floor(bar.width / 6))}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {workPackages.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 py-16">
          <LucideIcon name="GanttChart" size={40} />
          <p className="text-sm text-text-secondary">No work packages with dates to display.</p>
          <p className="text-xs text-text-tertiary">Set start and due dates on work packages to see them here.</p>
        </div>
      )}
    </div>
  );
}
