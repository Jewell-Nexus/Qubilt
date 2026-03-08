import { useCallback } from 'react';
import { Plus } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useCreateDatabaseRow, useUpdateDatabaseRow } from '../../hooks/use-wiki-queries';
import type { WikiDatabase, WikiDatabaseRow, DatabaseColumn } from '../../types/wiki.types';

interface DatabaseBoardViewProps {
  database: WikiDatabase;
  pageId: string;
}

export default function DatabaseBoardView({ database, pageId }: DatabaseBoardViewProps) {
  const columns = database.schema?.columns ?? [];
  const rows = database.rows ?? [];

  const createRow = useCreateDatabaseRow(database.id, pageId);
  const updateRow = useUpdateDatabaseRow(pageId);

  // Find a select column to group by
  const groupByCol = columns.find((c: DatabaseColumn) => c.type === 'select') ?? columns[0];
  const groupOptions = groupByCol?.options ?? ['Uncategorized'];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const getRowsForGroup = useCallback((group: string) => {
    if (!groupByCol) return rows;
    return rows.filter((r) => String(r.data[groupByCol.id] ?? '') === group);
  }, [rows, groupByCol]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !groupByCol) return;

    const rowId = String(active.id);
    const targetGroup = String(over.id);
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    updateRow.mutate({
      rowId,
      data: { ...row.data, [groupByCol.id]: targetGroup },
    });
  }, [rows, groupByCol, updateRow]);

  const handleAddCard = useCallback((group: string) => {
    const data: Record<string, unknown> = {};
    for (const col of columns) {
      data[col.id] = col.id === groupByCol?.id ? group : null;
    }
    createRow.mutate(data);
  }, [columns, groupByCol, createRow]);

  if (!groupByCol) {
    return (
      <div className="p-6 text-sm text-text-tertiary text-center">
        Add a select column to use board view
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 p-4 overflow-x-auto">
        {groupOptions.map((group) => {
          const groupRows = getRowsForGroup(group);
          return (
            <div
              key={group}
              id={group}
              className="flex-shrink-0 w-56 bg-surface-sunken rounded-lg"
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold text-text-secondary uppercase">
                  {group}
                </span>
                <span className="text-xs text-text-tertiary">{groupRows.length}</span>
              </div>

              {/* Cards */}
              <div className="px-2 pb-2 space-y-1.5 min-h-[40px]">
                {groupRows.map((row) => (
                  <BoardCard key={row.id} row={row} columns={columns} groupByColId={groupByCol.id} />
                ))}

                <button
                  onClick={() => handleAddCard(group)}
                  className="flex items-center gap-1 w-full px-2 py-1.5 text-xs text-text-tertiary hover:text-text-primary rounded transition-colors"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}

function BoardCard({
  row,
  columns,
  groupByColId,
}: {
  row: WikiDatabaseRow;
  columns: DatabaseColumn[];
  groupByColId: string;
}) {
  // Find a "name" or "title" column, or use the first text column
  const titleCol = columns.find((c) => c.type === 'text') ?? columns[0];
  const title = titleCol ? String(row.data[titleCol.id] ?? 'Untitled') : 'Untitled';

  // Show other fields
  const displayCols = columns.filter((c) => c.id !== titleCol?.id && c.id !== groupByColId).slice(0, 2);

  return (
    <div
      id={row.id}
      className="bg-surface-overlay rounded-md px-3 py-2 shadow-1 border border-border-default cursor-grab"
    >
      <div className="text-sm font-medium text-text-primary truncate">{title}</div>
      {displayCols.length > 0 && (
        <div className="flex items-center gap-2 mt-1">
          {displayCols.map((col) => {
            const val = row.data[col.id];
            if (val == null) return null;
            return (
              <span key={col.id} className="text-xs text-text-tertiary truncate">
                {String(val)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
