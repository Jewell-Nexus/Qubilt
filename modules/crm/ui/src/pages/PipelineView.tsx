import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
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
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';
import { usePipelines, usePipelineBoard, useMoveDealStage, useCreateDeal, useCreatePipeline } from '../hooks/use-crm-queries';
import { DealCard } from '../components/DealCard';
import { DealDetailSheet } from '../components/DealDetailSheet';
import { formatCurrency } from '../lib/format';
import type { CrmDeal, CrmPipelineStage } from '../types/crm.types';

const WORKSPACE_ID = 'default';

function DroppableColumn({
  stage,
  deals,
  onDealClick,
  onAddDeal,
}: {
  stage: CrmPipelineStage;
  deals: CrmDeal[];
  onDealClick: (id: string) => void;
  onAddDeal: (stageId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = deals.reduce((s, d) => s + Number(d.value), 0);

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-shrink-0">
      <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken rounded-t-lg border border-border-default border-b-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color ?? '#6B7280' }} />
          <span className="text-sm font-medium text-text-primary">{stage.name}</span>
          <span className="text-xs text-text-tertiary bg-surface-default px-1.5 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
        <span className="text-xs font-medium text-text-secondary">{formatCurrency(totalValue)}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-2 space-y-2 border border-border-default rounded-b-lg min-h-[120px] overflow-y-auto',
          'transition-colors duration-[var(--duration-fast)]',
          isOver && 'bg-accent-subtle/30 border-accent-default',
        )}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onClick={() => onDealClick(deal.id)} />
          ))}
        </SortableContext>
        {deals.length === 0 && (
          <p className="text-xs text-text-tertiary text-center py-4">No deals</p>
        )}
        <button
          onClick={() => onAddDeal(stage.id)}
          className="w-full py-1.5 text-xs text-text-tertiary hover:text-text-secondary hover:bg-surface-hover rounded transition-colors"
        >
          + Add deal
        </button>
      </div>
    </div>
  );
}

export default function PipelineView() {
  const { id: paramPipelineId } = useParams<{ id: string }>();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<CrmDeal | null>(null);
  const [newPipelineOpen, setNewPipelineOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [quickDealOpen, setQuickDealOpen] = useState(false);
  const [_quickDealStageId, setQuickDealStageId] = useState('');
  const [quickDealName, setQuickDealName] = useState('');
  const [quickDealValue, setQuickDealValue] = useState('');

  const { data: pipelines, isPending: pipelinesLoading } = usePipelines(WORKSPACE_ID);
  const activePipelineId = paramPipelineId ?? selectedPipelineId ?? pipelines?.[0]?.id ?? '';
  const { data: board, isPending: boardLoading } = usePipelineBoard(activePipelineId);
  const moveDealStage = useMoveDealStage(activePipelineId);
  const createPipeline = useCreatePipeline();
  const createDeal = useCreateDeal();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const deal = event.active.data.current?.deal as CrmDeal | undefined;
    setActiveCard(deal ?? null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const dealId = active.id as string;
    const targetStageId = over.id as string;

    // Check if dropped on a stage column
    const isStage = board?.stages.some((s) => s.stage.id === targetStageId);
    if (!isStage) return;

    moveDealStage.mutate(
      { dealId, targetStageId },
      {
        onSuccess: () => toast.success('Deal moved'),
        onError: () => toast.error('Failed to move deal'),
      },
    );
  }, [board, moveDealStage]);

  const handleCreatePipeline = () => {
    if (!newPipelineName.trim()) return;
    createPipeline.mutate(
      { workspaceId: WORKSPACE_ID, name: newPipelineName },
      {
        onSuccess: () => {
          setNewPipelineOpen(false);
          setNewPipelineName('');
          toast.success('Pipeline created');
        },
      },
    );
  };

  const handleQuickDeal = () => {
    if (!quickDealName.trim()) return;
    createDeal.mutate(
      {
        workspaceId: WORKSPACE_ID,
        pipelineId: activePipelineId,
        contactId: '',
        name: quickDealName,
        value: quickDealValue ? parseFloat(quickDealValue) : 0,
        ownerId: 'current',
      },
      {
        onSuccess: () => {
          setQuickDealOpen(false);
          setQuickDealName('');
          setQuickDealValue('');
          toast.success('Deal created');
        },
      },
    );
  };

  if (pipelinesLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Pipeline tabs */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border-default">
        {pipelines?.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPipelineId(p.id)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activePipelineId === p.id
                ? 'bg-[#EC4899]/10 text-[#EC4899]'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
            )}
          >
            {p.name}
          </button>
        ))}
        <button
          onClick={() => setNewPipelineOpen(true)}
          className="px-2 py-1.5 text-text-tertiary hover:text-text-primary"
        >
          <LucideIcon name="Plus" size={16} />
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-6">
        {boardLoading ? (
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-72 flex-shrink-0" />
            ))}
          </div>
        ) : board ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full">
              {board.stages.map(({ stage, deals }) => (
                <DroppableColumn
                  key={stage.id}
                  stage={stage}
                  deals={deals}
                  onDealClick={setSelectedDealId}
                  onAddDeal={(stageId) => {
                    setQuickDealStageId(stageId);
                    setQuickDealOpen(true);
                  }}
                />
              ))}
            </div>
            <DragOverlay>
              {activeCard && (
                <div className="w-[280px]">
                  <DealCard deal={activeCard} onClick={() => {}} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="text-center text-text-tertiary py-8">No pipeline selected</div>
        )}
      </div>

      <DealDetailSheet
        dealId={selectedDealId}
        open={!!selectedDealId}
        onClose={() => setSelectedDealId(null)}
      />

      {/* Create pipeline dialog */}
      <Dialog open={newPipelineOpen} onOpenChange={(o) => !o && setNewPipelineOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Pipeline</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Pipeline name"
            value={newPipelineName}
            onChange={(e) => setNewPipelineName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePipeline()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPipelineOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePipeline}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick deal dialog */}
      <Dialog open={quickDealOpen} onOpenChange={(o) => !o && setQuickDealOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Deal name"
              value={quickDealName}
              onChange={(e) => setQuickDealName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Value"
              value={quickDealValue}
              onChange={(e) => setQuickDealValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickDealOpen(false)}>Cancel</Button>
            <Button onClick={handleQuickDeal}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
