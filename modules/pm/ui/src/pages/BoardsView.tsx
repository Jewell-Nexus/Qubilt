import { useState, useCallback } from 'react';
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
} from '@dnd-kit/sortable';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';
import {
  useBoards,
  useBoard,
  useCreateBoard,
  useMoveBoardCard,
} from '../hooks/use-pm-queries';
import { BoardCard } from '../components/BoardCard';
import type { PmBoardCard, PmBoardColumn, BoardType } from '../types/pm.types';

const BOARD_TYPE_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  STATUS: 'Status',
  ASSIGNEE: 'Assignee',
  VERSION: 'Version',
  SUBPROJECT: 'Subproject',
  PARENT_CHILD: 'Parent/Child',
};

function DroppableColumn({
  column,
  boardType,
  onCardClick,
}: {
  column: PmBoardColumn;
  boardType: BoardType;
  onCardClick: (wpId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-shrink-0">
      <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken rounded-t-lg border border-border-default border-b-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{column.name}</span>
          <span className="text-xs text-text-tertiary bg-surface-default px-1.5 py-0.5 rounded-full">
            {column.cards.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-2 space-y-2 border border-border-default rounded-b-lg min-h-[120px] overflow-y-auto',
          'transition-colors duration-[var(--duration-fast)]',
          isOver && 'bg-accent-subtle/30 border-accent-default',
        )}
      >
        <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <BoardCard
              key={card.id}
              card={card}
              boardType={boardType}
              onClick={() => card.workPackage && onCardClick(card.workPackage.id)}
            />
          ))}
        </SortableContext>
        {column.cards.length === 0 && (
          <p className="text-xs text-text-tertiary text-center py-4">No cards</p>
        )}
      </div>
    </div>
  );
}

export default function BoardsView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardType, setNewBoardType] = useState('STATUS');
  const [activeCard, setActiveCard] = useState<PmBoardCard | null>(null);

  const { data: boards, isPending: boardsLoading } = useBoards(projectId!);
  const activeBoardId = selectedBoardId ?? boards?.[0]?.id ?? '';
  const { data: board, isPending: boardLoading } = useBoard(activeBoardId);
  const createBoard = useCreateBoard(projectId!);
  const moveCard = useMoveBoardCard(activeBoardId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleCreateBoard = useCallback(async () => {
    if (!newBoardName.trim()) return;
    try {
      const created = await createBoard.mutateAsync({ name: newBoardName.trim(), type: newBoardType });
      setSelectedBoardId(created.id);
      setNewBoardOpen(false);
      setNewBoardName('');
      toast.success('Board created');
    } catch {
      toast.error('Failed to create board');
    }
  }, [newBoardName, newBoardType, createBoard]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const card = event.active.data?.current?.card as PmBoardCard | undefined;
    if (card) setActiveCard(card);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null);
      const { active, over } = event;
      if (!over) return;

      const draggedCard = active.data?.current?.card as PmBoardCard | undefined;
      if (!draggedCard) return;

      let targetColumnId = over.id as string;
      if (board?.columns) {
        const targetCol = board.columns.find((col) => col.cards.some((c) => c.id === over.id));
        if (targetCol) targetColumnId = targetCol.id;
      }

      if (targetColumnId === draggedCard.columnId && active.id === over.id) return;

      const targetColumn = board?.columns.find((c) => c.id === targetColumnId);
      const position = targetColumn ? targetColumn.cards.length : 0;

      moveCard.mutate(
        { cardId: draggedCard.id, columnId: targetColumnId, position },
        { onError: () => toast.error('Failed to move card') },
      );
    },
    [board, moveCard],
  );

  const handleCardClick = useCallback(
    (wpId: string) => navigate(`/projects/${projectId}/work-packages/${wpId}`),
    [navigate, projectId],
  );

  if (boardsLoading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[300px] w-[280px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border-default bg-surface-default overflow-x-auto">
        {boards?.map((b) => (
          <button
            key={b.id}
            type="button"
            className={cn(
              'px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors duration-[var(--duration-fast)]',
              activeBoardId === b.id
                ? 'bg-accent-subtle text-accent-subtle-text font-medium'
                : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
            )}
            onClick={() => setSelectedBoardId(b.id)}
          >
            {b.name}
            <span className="ml-1.5 text-[10px] text-text-tertiary">{BOARD_TYPE_LABELS[b.type]}</span>
          </button>
        ))}

        <Dialog open={newBoardOpen} onOpenChange={setNewBoardOpen}>
          <DialogTrigger render={<button type="button" />}>
            <span className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-sunken rounded-md transition-colors duration-[var(--duration-fast)]">
              <LucideIcon name="Plus" size={14} />
              New board
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Create Board</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Name</label>
                <Input
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Board name"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Type</label>
                <select
                  className="w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-text-primary"
                  value={newBoardType}
                  onChange={(e) => setNewBoardType(e.target.value)}
                >
                  {Object.entries(BOARD_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateBoard} disabled={!newBoardName.trim() || createBoard.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty state */}
      {!board && !boardLoading && boards?.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2">
          <LucideIcon name="Columns3" size={40} />
          <p className="text-sm text-text-secondary">No boards yet.</p>
          <Button variant="outline" size="sm" onClick={() => setNewBoardOpen(true)}>
            Create your first board
          </Button>
        </div>
      )}

      {boardLoading && (
        <div className="flex gap-4 p-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[400px] w-[280px] flex-shrink-0" />)}
        </div>
      )}

      {board && (
        <div className="flex-1 overflow-x-auto p-4">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-full">
              {board.columns
                .sort((a, b) => a.position - b.position)
                .map((column) => (
                  <DroppableColumn key={column.id} column={column} boardType={board.type} onCardClick={handleCardClick} />
                ))}
            </div>
            <DragOverlay>
              {activeCard && (
                <div className="opacity-90 rotate-2">
                  <BoardCard card={activeCard} boardType={board.type} onClick={() => {}} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
}
