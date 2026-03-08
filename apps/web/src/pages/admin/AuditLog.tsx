import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { get } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  module: string;
  action: string;
  resource: string;
  ipAddress: string;
}

const WORKSPACE_ID = 'default';

export function AuditLog() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string | null>('all');
  const [actionFilter, setActionFilter] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: entries = [] } = useQuery({
    queryKey: ['audit-log', dateFrom, dateTo, userFilter, moduleFilter, actionFilter],
    queryFn: () =>
      get<AuditEntry[]>(`/workspaces/${WORKSPACE_ID}/audit-log`, {
        ...(dateFrom && { from: dateFrom }),
        ...(dateTo && { to: dateTo }),
        ...(userFilter && { user: userFilter }),
        ...(moduleFilter && moduleFilter !== 'all' && { module: moduleFilter }),
        ...(actionFilter && { action: actionFilter }),
      }),
  });

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 20,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Audit Log</h1>
        <p className="text-sm text-text-secondary">Track all actions performed in the workspace.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">User</Label>
          <Input
            placeholder="Filter by user"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Module</Label>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              <SelectItem value="kernel">Kernel</SelectItem>
              <SelectItem value="pm">Project Management</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Action</Label>
          <Input
            placeholder="Filter by action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Virtualized list */}
      <div className="border border-border-default rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[160px_120px_100px_1fr_1fr_120px] gap-2 px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider border-b border-border-default bg-surface-sunken">
          <span>Timestamp</span>
          <span>User</span>
          <span>Module</span>
          <span>Action</span>
          <span>Resource</span>
          <span>IP Address</span>
        </div>

        <div ref={parentRef} className="h-[calc(100vh-340px)] overflow-auto">
          <div
            style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const entry = entries[virtualRow.index]!;
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="grid grid-cols-[160px_120px_100px_1fr_1fr_120px] gap-2 px-4 items-center text-sm border-b border-border-default"
                >
                  <span className="text-text-secondary text-xs font-mono">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <span className="text-text-primary truncate">{entry.userName}</span>
                  <Badge variant="secondary" className="text-[10px] w-fit">
                    {entry.module}
                  </Badge>
                  <span className="text-text-primary">{entry.action}</span>
                  <span className="text-text-secondary truncate">{entry.resource}</span>
                  <span className="text-text-tertiary text-xs font-mono">{entry.ipAddress}</span>
                </div>
              );
            })}
          </div>
          {entries.length === 0 && (
            <div className="flex items-center justify-center h-32 text-text-secondary text-sm">
              No audit log entries found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
