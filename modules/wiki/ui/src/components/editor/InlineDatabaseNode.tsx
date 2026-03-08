import { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { TableIcon, LayoutGrid, List, Columns3 } from 'lucide-react';
import { useDatabases, useCreateDatabase } from '../../hooks/use-wiki-queries';
import DatabaseTableView from '../database/DatabaseTableView';
import DatabaseBoardView from '../database/DatabaseBoardView';
import type { WikiDatabase, DatabaseView } from '../../types/wiki.types';

interface InlineDatabaseNodeProps {
  pageId: string;
  databaseId?: string;
}

const VIEW_ICONS: Record<DatabaseView, React.ReactNode> = {
  TABLE: <TableIcon size={14} />,
  BOARD: <Columns3 size={14} />,
  GALLERY: <LayoutGrid size={14} />,
  CALENDAR: <TableIcon size={14} />,
  LIST: <List size={14} />,
};

export default function InlineDatabaseNode({ pageId, databaseId }: InlineDatabaseNodeProps) {
  const { data: dbData } = useDatabases(pageId);
  const createDb = useCreateDatabase(pageId);

  const databases = (dbData as unknown as { data: WikiDatabase[] })?.data ?? dbData ?? [];
  const db = databaseId
    ? databases.find((d: WikiDatabase) => d.id === databaseId)
    : databases[0];

  const [viewType, setViewType] = useState<DatabaseView>('TABLE');

  useEffect(() => {
    if (db?.viewType) setViewType(db.viewType);
  }, [db?.viewType]);

  // If no database exists, offer to create one
  if (!db) {
    return (
      <div className="border border-dashed border-border-default rounded-lg p-6 my-4 text-center">
        <TableIcon size={24} className="mx-auto mb-2 text-text-tertiary" />
        <p className="text-sm text-text-tertiary mb-3">No database yet</p>
        <button
          onClick={() => createDb.mutate({ name: 'Untitled Database' })}
          className="px-3 py-1.5 text-sm bg-[#F59E0B] text-white rounded-md hover:bg-[#D97706] transition-colors"
        >
          Create Database
        </button>
      </div>
    );
  }

  return (
    <div className="border border-border-default rounded-lg my-4 overflow-hidden">
      {/* Database header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-default bg-surface-default">
        <div className="flex items-center gap-2">
          <TableIcon size={14} className="text-text-tertiary" />
          <span className="text-sm font-medium text-text-primary">{db.name}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {(['TABLE', 'BOARD', 'LIST'] as DatabaseView[]).map((vt) => (
            <button
              key={vt}
              onClick={() => setViewType(vt)}
              className={cn(
                'p-1 rounded transition-colors',
                viewType === vt
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-surface-sunken',
              )}
              title={vt}
            >
              {VIEW_ICONS[vt]}
            </button>
          ))}
        </div>
      </div>

      {/* Database content */}
      <div className="p-0">
        {viewType === 'TABLE' && (
          <DatabaseTableView database={db} pageId={pageId} />
        )}
        {viewType === 'BOARD' && (
          <DatabaseBoardView database={db} pageId={pageId} />
        )}
        {viewType === 'LIST' && (
          <DatabaseTableView database={db} pageId={pageId} />
        )}
      </div>
    </div>
  );
}
