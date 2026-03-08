import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';
import {
  useWorkPackages,
  useSprints,
  useUpdateWorkPackage,
  useCreateSprint,
  useCompleteSprint,
} from '../hooks/use-pm-queries';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import type { WorkPackage, PmSprint } from '../types/pm.types';

function SortableWPRow({ wp, onClick }: { wp: WorkPackage; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: wp.id,
    data: { wp },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-3 px-3 py-2 border-b border-border-subtle',
        'hover:bg-surface-sunken cursor-pointer transition-colors duration-[var(--duration-fast)]',
        isDragging && 'opacity-50',
      )}
      onClick={onClick}
    >
      <span className="flex-shrink-0 text-text-tertiary">
        <LucideIcon name="GripVertical" size={14} />
      </span>
      <span className="text-[11px] font-mono text-text-tertiary w-16">#{wp.id.slice(-6)}</span>
      <span className="text-sm text-text-primary flex-1 truncate">{wp.subject}</span>
      {wp.status && <StatusBadge status={wp.status} size="sm" />}
      {wp.priority && <PriorityBadge priority={wp.priority} compact />}
      {wp.storyPoints != null && (
        <span className="text-xs text-text-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">{wp.storyPoints}sp</span>
      )}
    </div>
  );
}

function SprintSection({
  sprint,
  workPackages,
  onComplete,
  onCardClick,
  completePending,
}: {
  sprint: PmSprint;
  workPackages: WorkPackage[];
  onComplete: () => void;
  onCardClick: (wpId: string) => void;
  completePending: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `sprint-${sprint.id}` });
  const closedCount = workPackages.filter((wp) => wp.status?.isClosed).length;
  const total = workPackages.length;
  const progress = total > 0 ? Math.round((closedCount / total) * 100) : 0;
  const totalPoints = workPackages.reduce((sum, wp) => sum + (wp.storyPoints ?? 0), 0);

  return (
    <div className="border border-border-default rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-surface-sunken border-b border-border-default">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <LucideIcon name="Zap" size={14} />
            <span className="text-sm font-medium text-text-primary">{sprint.name}</span>
          </span>
          {sprint.startDate && sprint.endDate && (
            <span className="text-xs text-text-tertiary">
              {new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' – '}
              {new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <span className="text-xs text-text-tertiary">{closedCount}/{total} done</span>
          {totalPoints > 0 && <span className="text-xs text-text-tertiary">{totalPoints} pts</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-surface-default rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-[var(--duration-base)]" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-text-tertiary">{progress}%</span>
          {sprint.status === 'ACTIVE' && (
            <Button variant="outline" size="sm" onClick={onComplete} disabled={completePending}>
              Complete Sprint
            </Button>
          )}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn('min-h-[60px] transition-colors duration-[var(--duration-fast)]', isOver && 'bg-accent-subtle/20')}
      >
        <SortableContext items={workPackages.map((wp) => wp.id)} strategy={verticalListSortingStrategy}>
          {workPackages.map((wp) => (
            <SortableWPRow key={wp.id} wp={wp} onClick={() => onCardClick(wp.id)} />
          ))}
        </SortableContext>
        {workPackages.length === 0 && (
          <p className="text-xs text-text-tertiary text-center py-6">Drag work packages here to add them to this sprint</p>
        )}
      </div>
    </div>
  );
}

function BacklogDropZone({ workPackages, onCardClick }: { workPackages: WorkPackage[]; onCardClick: (wpId: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'backlog' });
  return (
    <div ref={setNodeRef} className={cn('min-h-[100px] transition-colors duration-[var(--duration-fast)]', isOver && 'bg-accent-subtle/20')}>
      <SortableContext items={workPackages.map((wp) => wp.id)} strategy={verticalListSortingStrategy}>
        {workPackages.map((wp) => (
          <SortableWPRow key={wp.id} wp={wp} onClick={() => onCardClick(wp.id)} />
        ))}
      </SortableContext>
      {workPackages.length === 0 && <p className="text-xs text-text-tertiary text-center py-8">No items in backlog</p>}
    </div>
  );
}

export default function BacklogView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [draggedWp, setDraggedWp] = useState<WorkPackage | null>(null);

  const { data: wpData, isPending } = useWorkPackages(projectId!, { limit: 500 });
  const { data: sprints } = useSprints(projectId!);
  const updateWp = useUpdateWorkPackage();
  const createSprint = useCreateSprint(projectId!);
  const completeSprint = useCompleteSprint(projectId!);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeSprint = useMemo(() => sprints?.find((s) => s.status === 'ACTIVE'), [sprints]);
  const planningSprints = useMemo(() => sprints?.filter((s) => s.status === 'PLANNING') ?? [], [sprints]);

  const sprintWps = useMemo(() => {
    if (!wpData?.data) return new Map<string, WorkPackage[]>();
    const m = new Map<string, WorkPackage[]>();
    wpData.data.forEach((wp) => {
      if (wp.sprintId) {
        const list = m.get(wp.sprintId) ?? [];
        list.push(wp);
        m.set(wp.sprintId, list);
      }
    });
    return m;
  }, [wpData]);

  const backlogWps = useMemo(() => wpData?.data.filter((wp) => !wp.sprintId) ?? [], [wpData]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const wp = event.active.data?.current?.wp as WorkPackage | undefined;
    if (wp) setDraggedWp(wp);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggedWp(null);
      const { active, over } = event;
      if (!over) return;

      const wp = active.data?.current?.wp as WorkPackage | undefined;
      if (!wp) return;

      const overId = over.id as string;
      let targetSprintId: string | undefined;

      if (overId.startsWith('sprint-')) {
        targetSprintId = overId.replace('sprint-', '');
      } else if (overId === 'backlog') {
        targetSprintId = undefined;
      } else {
        const targetWp = wpData?.data.find((w) => w.id === overId);
        targetSprintId = targetWp?.sprintId ?? undefined;
      }

      if (wp.sprintId === targetSprintId) return;

      updateWp.mutate(
        { id: wp.id, dto: { sprintId: targetSprintId ?? null } as never },
        { onError: () => toast.error('Failed to move work package') },
      );
    },
    [wpData, updateWp],
  );

  const handleCreateSprint = useCallback(async () => {
    const count = (sprints?.length ?? 0) + 1;
    try {
      await createSprint.mutateAsync({ name: `Sprint ${count}` });
      toast.success('Sprint created');
    } catch {
      toast.error('Failed to create sprint');
    }
  }, [sprints, createSprint]);

  const handleCompleteSprint = useCallback(
    async (sprintId: string) => {
      try {
        await completeSprint.mutateAsync({ id: sprintId, action: 'move_to_backlog' });
        toast.success('Sprint completed');
      } catch {
        toast.error('Failed to complete sprint');
      }
    },
    [completeSprint],
  );

  const handleCardClick = useCallback(
    (wpId: string) => navigate(`/projects/${projectId}/work-packages/${wpId}`),
    [navigate, projectId],
  );

  if (isPending) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="p-4 space-y-4">
          {activeSprint && (
            <SprintSection
              sprint={activeSprint}
              workPackages={sprintWps.get(activeSprint.id) ?? []}
              onComplete={() => handleCompleteSprint(activeSprint.id)}
              onCardClick={handleCardClick}
              completePending={completeSprint.isPending}
            />
          )}

          {planningSprints.map((sprint) => (
            <SprintSection
              key={sprint.id}
              sprint={sprint}
              workPackages={sprintWps.get(sprint.id) ?? []}
              onComplete={() => {}}
              onCardClick={handleCardClick}
              completePending={false}
            />
          ))}

          <div className="border border-border-default rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-surface-sunken border-b border-border-default">
              <div className="flex items-center gap-2">
                <LucideIcon name="Inbox" size={14} />
                <span className="text-sm font-medium text-text-primary">Backlog</span>
                <span className="text-xs text-text-tertiary">{backlogWps.length} items</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleCreateSprint} disabled={createSprint.isPending}>
                <span className="flex items-center gap-1.5">
                  <LucideIcon name="Plus" size={14} />
                  Create Sprint
                </span>
              </Button>
            </div>
            <BacklogDropZone workPackages={backlogWps} onCardClick={handleCardClick} />
          </div>
        </div>

        <DragOverlay>
          {draggedWp && (
            <div className="bg-surface-raised border border-border-default rounded-md px-3 py-2 shadow-lg opacity-90 rotate-1">
              <span className="text-sm text-text-primary">{draggedWp.subject}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
