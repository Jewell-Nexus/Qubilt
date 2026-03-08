import { useState, useCallback } from 'react';
import { Plus, ArrowUpDown } from 'lucide-react';
import {
  useCreateDatabaseRow,
  useUpdateDatabaseRow,
} from '../../hooks/use-wiki-queries';
import type { WikiDatabase, DatabaseColumn } from '../../types/wiki.types';

interface DatabaseTableViewProps {
  database: WikiDatabase;
  pageId: string;
}

export default function DatabaseTableView({ database, pageId }: DatabaseTableViewProps) {
  const columns = database.schema?.columns ?? [];
  const rows = database.rows ?? [];

  const createRow = useCreateDatabaseRow(database.id, pageId);
  const updateRow = useUpdateDatabaseRow(pageId);

  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = useCallback((colId: string) => {
    if (sortCol === colId) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colId);
      setSortDir('asc');
    }
  }, [sortCol]);

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortCol) return a.position - b.position;
    const aVal = a.data[sortCol];
    const bVal = b.data[sortCol];
    const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const startEdit = useCallback((rowId: string, colId: string, currentValue: unknown) => {
    setEditingCell({ rowId, colId });
    setEditValue(currentValue != null ? String(currentValue) : '');
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const row = rows.find((r) => r.id === editingCell.rowId);
    if (!row) return;

    const col = columns.find((c: DatabaseColumn) => c.id === editingCell.colId);
    let parsedValue: unknown = editValue;
    if (col?.type === 'number') parsedValue = editValue ? Number(editValue) : null;
    if (col?.type === 'checkbox') parsedValue = editValue === 'true';

    updateRow.mutate({
      rowId: editingCell.rowId,
      data: { ...row.data, [editingCell.colId]: parsedValue },
    });
    setEditingCell(null);
  }, [editingCell, editValue, rows, columns, updateRow]);

  const handleAddRow = useCallback(() => {
    const emptyData: Record<string, unknown> = {};
    for (const col of columns) {
      emptyData[col.id] = col.type === 'checkbox' ? false : null;
    }
    createRow.mutate(emptyData);
  }, [columns, createRow]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default bg-surface-default">
            {columns.map((col: DatabaseColumn) => (
              <th
                key={col.id}
                className="px-3 py-2 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider whitespace-nowrap"
              >
                <button
                  onClick={() => handleSort(col.id)}
                  className="flex items-center gap-1 hover:text-text-primary transition-colors"
                >
                  {col.name}
                  {sortCol === col.id && (
                    <ArrowUpDown size={10} className="text-[#F59E0B]" />
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={row.id} className="border-b border-border-default hover:bg-surface-sunken/50 group">
              {columns.map((col: DatabaseColumn) => {
                const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                const value = row.data[col.id];

                return (
                  <td
                    key={col.id}
                    className="px-3 py-1.5 text-text-primary whitespace-nowrap"
                    onClick={() => !isEditing && startEdit(row.id, col.id, value)}
                  >
                    {isEditing ? (
                      <CellEditor
                        column={col}
                        value={editValue}
                        onChange={setEditValue}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit();
                          if (e.key === 'Escape') setEditingCell(null);
                        }}
                      />
                    ) : (
                      <CellDisplay column={col} value={value} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add row */}
      <button
        onClick={handleAddRow}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-text-tertiary hover:bg-surface-sunken hover:text-text-primary transition-colors"
      >
        <Plus size={12} />
        New row
      </button>
    </div>
  );
}

function CellDisplay({ column, value }: { column: DatabaseColumn; value: unknown }) {
  if (value == null || value === '') {
    return <span className="text-text-tertiary">—</span>;
  }

  switch (column.type) {
    case 'checkbox':
      return (
        <input type="checkbox" checked={Boolean(value)} readOnly className="accent-[#F59E0B]" />
      );
    case 'select':
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B]">
          {String(value)}
        </span>
      );
    case 'multi-select':
      return (
        <div className="flex gap-1 flex-wrap">
          {(Array.isArray(value) ? value : [value]).map((v, i) => (
            <span key={i} className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-surface-sunken text-text-secondary">
              {String(v)}
            </span>
          ))}
        </div>
      );
    case 'url':
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#F59E0B] underline underline-offset-2"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value)}
        </a>
      );
    case 'date':
      return <span>{new Date(String(value)).toLocaleDateString()}</span>;
    default:
      return <span>{String(value)}</span>;
  }
}

function CellEditor({
  column,
  value,
  onChange,
  onBlur,
  onKeyDown,
}: {
  column: DatabaseColumn;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  if (column.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={value === 'true'}
        onChange={(e) => { onChange(String(e.target.checked)); onBlur(); }}
        className="accent-[#F59E0B]"
        autoFocus
      />
    );
  }

  if (column.type === 'select' && column.options?.length) {
    return (
      <select
        value={value}
        onChange={(e) => { onChange(e.target.value); onBlur(); }}
        onBlur={onBlur}
        className="bg-transparent outline-none text-sm border border-border-default rounded px-1"
        autoFocus
      >
        <option value="">—</option>
        {column.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (column.type === 'date') {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="bg-transparent outline-none text-sm border border-border-default rounded px-1"
        autoFocus
      />
    );
  }

  return (
    <input
      type={column.type === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className="bg-transparent outline-none text-sm w-full border border-border-default rounded px-1"
      autoFocus
    />
  );
}
