import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import {
  useWorkPackages,
  useTypes,
  useStatuses,
} from '../hooks/use-pm-queries';
import type { WorkPackage, FilterWorkPackagesParams } from '../types/pm.types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), isCurrentMonth: false });
  }

  for (let i = 1; i <= totalDays; i++) {
    cells.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
  }

  return cells;
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isTodayDate(d: Date) {
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

export default function CalendarView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const workspaceId = 'default';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<FilterWorkPackagesParams>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: wpData, isPending } = useWorkPackages(projectId!, { ...filters, limit: 500 });
  const { data: types } = useTypes(workspaceId);
  const { data: statuses } = useStatuses(workspaceId);

  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);

  const wpByDate = useMemo(() => {
    const m = new Map<string, WorkPackage[]>();
    wpData?.data.forEach((wp) => {
      if (wp.dueDate) {
        const key = wp.dueDate.slice(0, 10);
        const list = m.get(key) ?? [];
        list.push(wp);
        m.set(key, list);
      }
    });
    return m;
  }, [wpData]);

  const typeMap = useMemo(() => {
    const m = new Map<string, string>();
    types?.forEach((t) => m.set(t.id, t.color));
    return m;
  }, [types]);

  const goPrev = useCallback(() => setCurrentDate(new Date(year, month - 1, 1)), [year, month]);
  const goNext = useCallback(() => setCurrentDate(new Date(year, month + 1, 1)), [year, month]);
  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const handleQuickCreate = useCallback(
    (date: Date) => {
      const dueDate = dateKey(date);
      navigate(`/projects/${projectId}/work-packages?newDueDate=${dueDate}`);
    },
    [navigate, projectId],
  );

  const handleWpClick = useCallback(
    (wpId: string) => navigate(`/projects/${projectId}/work-packages/${wpId}`),
    [navigate, projectId],
  );

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (isPending) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-default bg-surface-default">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrev}>
            <LucideIcon name="ChevronLeft" size={14} />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={goNext}>
            <LucideIcon name="ChevronRight" size={14} />
          </Button>
          <span className="text-sm font-medium text-text-primary ml-2">{monthLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          {types && types.length > 0 && (
            <select
              className="rounded-md border border-border-default bg-surface-default px-2 py-1 text-xs text-text-primary"
              value={filters.typeId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, typeId: e.target.value || undefined }))}
            >
              <option value="">All types</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          {statuses && statuses.length > 0 && (
            <select
              className="rounded-md border border-border-default bg-surface-default px-2 py-1 text-xs text-text-primary"
              value={filters.statusId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, statusId: e.target.value || undefined }))}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-px mb-px">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-xs font-medium text-text-secondary text-center py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-border-subtle rounded-lg overflow-hidden">
          {cells.map((cell, i) => {
            const key = dateKey(cell.date);
            const wps = wpByDate.get(key) ?? [];
            const maxShow = 3;
            const extra = wps.length - maxShow;
            const today = isTodayDate(cell.date);

            return (
              <div
                key={i}
                className={cn(
                  'bg-surface-default min-h-[100px] p-1.5 flex flex-col cursor-pointer hover:bg-surface-sunken/50 transition-colors duration-[var(--duration-fast)]',
                  !cell.isCurrentMonth && 'bg-surface-sunken/50',
                )}
                onClick={() => handleQuickCreate(cell.date)}
              >
                <span
                  className={cn(
                    'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                    today ? 'bg-red-500 text-white' : cell.isCurrentMonth ? 'text-text-primary' : 'text-text-tertiary',
                  )}
                >
                  {cell.date.getDate()}
                </span>

                <div className="space-y-0.5 flex-1">
                  {wps.slice(0, maxShow).map((wp) => {
                    const color = typeMap.get(wp.typeId) ?? '#6B7280';
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        className="w-full text-left px-1.5 py-0.5 rounded text-[10px] truncate font-medium hover:opacity-80 transition-opacity duration-[var(--duration-fast)]"
                        style={{ backgroundColor: color + '20', color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWpClick(wp.id);
                        }}
                      >
                        {wp.subject}
                      </button>
                    );
                  })}
                  {extra > 0 && <span className="text-[10px] text-text-tertiary px-1.5">+{extra} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
