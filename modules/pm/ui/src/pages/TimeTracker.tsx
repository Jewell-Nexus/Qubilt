import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';
import {
  useTimeEntries,
  useTimeActivities,
  useLogTime,
  useDeleteTimeEntry,
  useWorkPackages,
} from '../hooks/use-pm-queries';
import type { LogTimeDto, TimeEntry } from '../types/pm.types';

const HOURS_SHORTCUTS = [0.5, 1, 2, 4, 8];

function getWeekDates(refDate: Date): Date[] {
  const d = new Date(refDate);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isTodayDate(d: Date) {
  return dateKey(d) === dateKey(new Date());
}

export default function TimeTracker() {
  const { projectId } = useParams<{ projectId: string }>();

  const [weekRef, setWeekRef] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<LogTimeDto>>({
    projectId,
    hours: 1,
    spentOn: dateKey(new Date()),
    billable: false,
  });

  const weekDates = useMemo(() => getWeekDates(weekRef), [weekRef]);
  const weekStart = dateKey(weekDates[0]!);
  const weekEnd = dateKey(weekDates[6]!);

  const { data: entries, isPending } = useTimeEntries({ projectId, dateFrom: weekStart, dateTo: weekEnd, limit: 500 });
  const { data: activities } = useTimeActivities(projectId!);
  const { data: wpData } = useWorkPackages(projectId!, { limit: 200 });
  const logTime = useLogTime();
  const deleteEntry = useDeleteTimeEntry();

  const entriesByDate = useMemo(() => {
    const m = new Map<string, TimeEntry[]>();
    entries?.data.forEach((e) => {
      const key = e.spentOn.slice(0, 10);
      const list = m.get(key) ?? [];
      list.push(e);
      m.set(key, list);
    });
    return m;
  }, [entries]);

  const summary = useMemo(() => {
    if (!entries?.data) return { total: 0, billable: 0 };
    let total = 0;
    let billable = 0;
    entries.data.forEach((e) => {
      total += e.hours;
      if (e.billable) billable += e.hours;
    });
    return { total, billable };
  }, [entries]);

  const handlePrevWeek = useCallback(() => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() - 7);
    setWeekRef(d);
  }, [weekRef]);

  const handleNextWeek = useCallback(() => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + 7);
    setWeekRef(d);
  }, [weekRef]);

  const handleThisWeek = useCallback(() => setWeekRef(new Date()), []);

  const handleSubmitTime = useCallback(async () => {
    if (!formData.hours || !formData.spentOn || !formData.projectId) return;
    try {
      await logTime.mutateAsync(formData as LogTimeDto);
      toast.success('Time logged');
      setFormOpen(false);
      setFormData({ projectId, hours: 1, spentOn: dateKey(new Date()), billable: false });
    } catch {
      toast.error('Failed to log time');
    }
  }, [formData, logTime, projectId]);

  const handleDeleteEntry = useCallback(
    async (id: string) => {
      try {
        await deleteEntry.mutateAsync(id);
        toast.success('Time entry deleted');
      } catch {
        toast.error('Failed to delete entry');
      }
    },
    [deleteEntry],
  );

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
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            <LucideIcon name="ChevronLeft" size={14} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleThisWeek}>This Week</Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <LucideIcon name="ChevronRight" size={14} />
          </Button>
          <span className="text-sm font-medium text-text-primary ml-2">
            {weekDates[0]!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {weekDates[6]!.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span>Total: <strong className="text-text-primary">{summary.total.toFixed(1)}h</strong></span>
          <span>
            Billable: <strong className="text-text-primary">
              {summary.total > 0 ? Math.round((summary.billable / summary.total) * 100) : 0}%
            </strong>
          </span>
        </div>
      </div>

      {/* Week grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 gap-px bg-border-subtle min-h-full">
          {weekDates.map((date) => {
            const key = dateKey(date);
            const dayEntries = entriesByDate.get(key) ?? [];
            const dayTotal = dayEntries.reduce((sum, e) => sum + e.hours, 0);
            const today = isTodayDate(date);

            return (
              <div key={key} className={cn('bg-surface-default flex flex-col', today && 'bg-accent-subtle/10')}>
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-border-subtle">
                  <span className={cn('text-xs font-medium', today ? 'text-accent-default' : 'text-text-secondary')}>
                    {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                  </span>
                  {dayTotal > 0 && <span className="text-[10px] text-text-tertiary">{dayTotal.toFixed(1)}h</span>}
                </div>

                <div className="flex-1 p-1.5 space-y-1">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="group relative rounded px-2 py-1.5 bg-accent-subtle/20 border border-accent-default/20">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-text-primary">{entry.hours}h</span>
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-fast)]"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <LucideIcon name="X" size={10} />
                        </button>
                      </div>
                      {entry.comment && <p className="text-[10px] text-text-secondary truncate mt-0.5">{entry.comment}</p>}
                      {entry.billable && <span className="text-[9px] text-green-600">billable</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAB */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger render={<button type="button" />}>
          <span className={cn(
            'fixed bottom-6 right-6 w-12 h-12 rounded-full bg-accent-default text-white',
            'flex items-center justify-center shadow-lg',
            'hover:bg-accent-emphasis transition-colors duration-[var(--duration-base)]',
          )}>
            <LucideIcon name="Plus" size={20} />
          </span>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Log Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Work Package (optional)</label>
              <select
                className="w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-text-primary"
                value={formData.workPackageId ?? ''}
                onChange={(e) => setFormData((f) => ({ ...f, workPackageId: e.target.value || undefined }))}
              >
                <option value="">None</option>
                {wpData?.data.map((wp) => (
                  <option key={wp.id} value={wp.id}>#{wp.id.slice(-6)} {wp.subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Hours</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={formData.hours ?? ''}
                  onChange={(e) => setFormData((f) => ({ ...f, hours: parseFloat(e.target.value) || 0 }))}
                  className="w-24"
                />
                <div className="flex gap-1">
                  {HOURS_SHORTCUTS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={cn(
                        'px-2 py-1 text-xs rounded border border-border-default transition-colors duration-[var(--duration-fast)]',
                        formData.hours === h ? 'bg-accent-subtle text-accent-subtle-text' : 'hover:bg-surface-sunken text-text-secondary',
                      )}
                      onClick={() => setFormData((f) => ({ ...f, hours: h }))}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Date</label>
              <Input type="date" value={formData.spentOn ?? ''} onChange={(e) => setFormData((f) => ({ ...f, spentOn: e.target.value }))} />
            </div>

            {activities && activities.length > 0 && (
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Activity</label>
                <select
                  className="w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-text-primary"
                  value={formData.activityId ?? ''}
                  onChange={(e) => setFormData((f) => ({ ...f, activityId: e.target.value || undefined }))}
                >
                  <option value="">Select activity</option>
                  {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Comment</label>
              <Input
                value={formData.comment ?? ''}
                onChange={(e) => setFormData((f) => ({ ...f, comment: e.target.value }))}
                placeholder="What did you work on?"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.billable ?? false}
                onChange={(e) => setFormData((f) => ({ ...f, billable: e.target.checked }))}
                className="rounded border-border-default"
              />
              <span className="text-sm text-text-primary">Billable</span>
            </label>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitTime} disabled={logTime.isPending}>Log Time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
