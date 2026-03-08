import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/cn';
import { StatusBadge } from '../components/StatusBadge';
import { useWorkPackages } from '../hooks/use-pm-queries';
import type { WorkPackage } from '../types/pm.types';

interface WPTableWidgetProps {
  projectId: string;
  queryId?: string;
  limit?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function isOverdue(wp: WorkPackage): boolean {
  if (!wp.dueDate || wp.status?.isClosed) return false;
  return new Date(wp.dueDate) < new Date();
}

export default function WPTableWidget({ projectId, queryId, limit = 5 }: WPTableWidgetProps) {
  const navigate = useNavigate();
  const { data, isPending } = useWorkPackages(projectId, {
    queryId,
    limit,
    page: 1,
  });

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border-default">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-32">Assignee</TableHead>
              <TableHead className="w-24">Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-3 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-16" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length ? (
              data.data.map((wp) => (
                <TableRow
                  key={wp.id}
                  className={cn(
                    'cursor-pointer hover:bg-surface-sunken transition-colors duration-[var(--duration-fast)]',
                    isOverdue(wp) && 'bg-color-error/[0.03]',
                  )}
                  onClick={() => navigate(`/projects/${projectId}/work-packages/${wp.id}`)}
                >
                  <TableCell className="text-xs text-text-tertiary font-mono">
                    {wp.id.slice(-6)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-text-primary truncate max-w-48">
                    {wp.subject}
                  </TableCell>
                  <TableCell>
                    {wp.status && <StatusBadge status={wp.status} size="sm" />}
                  </TableCell>
                  <TableCell>
                    {wp.assignee ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar className="w-4 h-4 flex-shrink-0">
                          {wp.assignee.avatarUrl && (
                            <AvatarImage src={wp.assignee.avatarUrl} alt={wp.assignee.displayName} />
                          )}
                          <AvatarFallback className="text-[8px] bg-accent-subtle text-accent-subtle-text">
                            {getInitials(wp.assignee.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate text-text-secondary">{wp.assignee.displayName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-tertiary">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {wp.dueDate ? (
                      <span className={cn(
                        'text-xs',
                        isOverdue(wp) ? 'text-color-error font-medium' : 'text-text-tertiary',
                      )}>
                        {new Date(wp.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    ) : (
                      <span className="text-xs text-text-tertiary">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-16 text-center text-sm text-text-tertiary">
                  No work packages
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {data && data.total > limit && (
        <button
          type="button"
          className="mt-2 text-xs text-accent-default hover:underline"
          onClick={() => navigate(`/projects/${projectId}/work-packages`)}
        >
          View all {data.total} work packages →
        </button>
      )}
    </div>
  );
}
