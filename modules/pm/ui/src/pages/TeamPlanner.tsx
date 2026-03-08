import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import {
  useWorkPackages,
  useWorkspaceMembers,
  useTypes,
} from '../hooks/use-pm-queries';
import type { WorkPackage } from '../types/pm.types';

const DAYS_IN_VIEW = 14;

function getViewDates(refDate: Date): Date[] {
  const start = new Date(refDate);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return Array.from({ length: DAYS_IN_VIEW }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isTodayDate(d: Date) {
  return dateKey(d) === dateKey(new Date());
}

function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function TeamPlanner() {
  const { projectId } = useParams<{ projectId: string }>();
  const workspaceId = 'default';

  const [viewRef, setViewRef] = useState(new Date());

  const { data: wpData, isPending } = useWorkPackages(projectId!, { limit: 500 });
  const { data: members } = useWorkspaceMembers(workspaceId);
  const { data: types } = useTypes(workspaceId);

  const viewDates = useMemo(() => getViewDates(viewRef), [viewRef]);

  const typeMap = useMemo(() => {
    const m = new Map<string, string>();
    types?.forEach((t) => m.set(t.id, t.color));
    return m;
  }, [types]);

  // Group WPs by assignee and date
  const assigneeGrid = useMemo(() => {
    if (!wpData?.data || !members) return new Map<string, Map<string, WorkPackage[]>>();

    const grid = new Map<string, Map<string, WorkPackage[]>>();
    members.forEach((m) => grid.set(m.id, new Map()));

    const viewStart = viewDates[0]!;
    const viewEnd = viewDates[viewDates.length - 1]!;

    wpData.data.forEach((wp) => {
      if (!wp.assigneeId) return;
      const memberGrid = grid.get(wp.assigneeId);
      if (!memberGrid) return;

      const start = wp.startDate ? new Date(wp.startDate) : wp.dueDate ? new Date(wp.dueDate) : null;
      const end = wp.dueDate ? new Date(wp.dueDate) : wp.startDate ? new Date(wp.startDate) : null;
      if (!start || !end) return;

      for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d < viewStart || d > viewEnd) continue;
        const key = dateKey(d);
        const list = memberGrid.get(key) ?? [];
        list.push(wp);
        memberGrid.set(key, list);
      }
    });

    return grid;
  }, [wpData, members, viewDates]);

  const getHoursForCell = useCallback(
    (memberId: string, date: string): number => {
      const memberGrid = assigneeGrid.get(memberId);
      if (!memberGrid) return 0;
      const wps = memberGrid.get(date) ?? [];
      return wps.reduce((sum, wp) => {
        if (!wp.estimatedHours) return sum + 4;
        const start = wp.startDate ? new Date(wp.startDate) : new Date(wp.dueDate!);
        const end = wp.dueDate ? new Date(wp.dueDate) : new Date(wp.startDate!);
        const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
        return sum + wp.estimatedHours / duration;
      }, 0);
    },
    [assigneeGrid],
  );

  const handlePrev = useCallback(() => {
    const d = new Date(viewRef);
    d.setDate(d.getDate() - 14);
    setViewRef(d);
  }, [viewRef]);

  const handleNext = useCallback(() => {
    const d = new Date(viewRef);
    d.setDate(d.getDate() + 14);
    setViewRef(d);
  }, [viewRef]);

  const handleToday = useCallback(() => setViewRef(new Date()), []);

  const displayMembers = members ?? [];

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
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-default bg-surface-default">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev}>
            <LucideIcon name="ChevronLeft" size={14} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <LucideIcon name="ChevronRight" size={14} />
          </Button>
          <span className="text-sm font-medium text-text-primary ml-2">
            {viewDates[0]!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {viewDates[DAYS_IN_VIEW - 1]!.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <span className="text-xs text-text-tertiary">{displayMembers.length} team members</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead className="sticky top-0 z-10 bg-surface-default">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary border-b border-r border-border-default w-[180px]">
                Team Member
              </th>
              {viewDates.map((date) => (
                <th
                  key={dateKey(date)}
                  className={cn(
                    'text-center px-1 py-2 text-[10px] font-medium border-b border-border-default min-w-[60px]',
                    isTodayDate(date) ? 'text-accent-default bg-accent-subtle/20' : isWeekend(date) ? 'text-text-tertiary bg-surface-sunken/50' : 'text-text-secondary',
                  )}
                >
                  <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="text-xs">{date.getDate()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayMembers.map((member) => (
              <tr key={member.id} className="border-b border-border-subtle">
                <td className="px-3 py-2 border-r border-border-default">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent-subtle flex items-center justify-center text-[9px] font-medium text-accent-subtle-text flex-shrink-0">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.displayName} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        getInitials(member.displayName)
                      )}
                    </div>
                    <span className="text-xs text-text-primary truncate">{member.displayName}</span>
                  </div>
                </td>
                {viewDates.map((date) => {
                  const key = dateKey(date);
                  const memberGrid = assigneeGrid.get(member.id);
                  const cellWps = memberGrid?.get(key) ?? [];
                  const hours = getHoursForCell(member.id, key);
                  const overloaded = hours > 8;

                  return (
                    <td
                      key={key}
                      className={cn(
                        'p-0.5 border-r border-border-subtle align-top',
                        overloaded && 'bg-amber-50 dark:bg-amber-950/20',
                        cellWps.length === 0 && !overloaded && 'bg-surface-sunken/30',
                        isWeekend(date) && !overloaded && 'bg-surface-sunken/50',
                        isTodayDate(date) && !overloaded && 'bg-accent-subtle/10',
                      )}
                    >
                      <div className="space-y-0.5 min-h-[36px]">
                        {cellWps.slice(0, 3).map((wp) => {
                          const color = typeMap.get(wp.typeId) ?? '#6B7280';
                          return (
                            <Tooltip key={wp.id}>
                              <TooltipTrigger render={<div />}>
                                <div className="h-3 rounded-sm mx-0.5 cursor-default" style={{ backgroundColor: color }} />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs font-medium">{wp.subject}</p>
                                {wp.estimatedHours && (
                                  <p className="text-[10px] text-text-tertiary">{wp.estimatedHours}h estimated</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                        {cellWps.length > 3 && <span className="text-[9px] text-text-tertiary px-1">+{cellWps.length - 3}</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {displayMembers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <LucideIcon name="Users" size={40} />
            <p className="text-sm text-text-secondary">No team members to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}
