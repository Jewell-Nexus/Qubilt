import { useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { cn } from '@/lib/cn';
import {
  Plus,
  Filter,
  ArrowUpDown,
  Columns3,
  X,
  ListTodo,
  GanttChart,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  useWorkPackages,
  useCreateWorkPackage,
  useStatuses,
  useTypes,
  usePriorities,
  useQueries,
} from '../hooks/use-pm-queries';
import type {
  WorkPackage,
  FilterWorkPackagesParams,
  PmType,
} from '../types/pm.types';

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

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Active filter chip
function FilterChip({
  label,
  value,
  onRemove,
}: {
  label: string;
  value: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-subtle text-accent-subtle-text">
      {label}: {value}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-text-primary transition-colors duration-[var(--duration-fast)]"
      >
        <X size={12} />
      </button>
    </span>
  );
}

// Inline quick create row
function InlineCreateRow({
  projectId,
  types,
  colCount,
}: {
  projectId: string;
  types: PmType[];
  colCount: number;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [typeId, setTypeId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateWorkPackage(projectId);

  const handleCreate = useCallback(async () => {
    if (!subject.trim()) return;
    await createMutation.mutateAsync({
      subject: subject.trim(),
      typeId: typeId || undefined,
    });
    setSubject('');
    setTypeId('');
    inputRef.current?.focus();
  }, [subject, typeId, createMutation]);

  if (!isCreating) {
    return (
      <TableRow>
        <TableCell colSpan={colCount}>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-accent-default transition-colors duration-[var(--duration-fast)]"
            onClick={() => {
              setIsCreating(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            <Plus size={14} />
            New work package
          </button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell colSpan={colCount}>
        <div className="flex items-center gap-2">
          {types.length > 0 && (
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="h-7 px-2 text-sm bg-transparent border border-border-default rounded-md text-text-primary"
            >
              <option value="">Type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <Input
            ref={inputRef}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What needs to be done?"
            className="h-7 flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setSubject('');
                setTypeId('');
              }
            }}
          />
          <Button size="xs" onClick={handleCreate} disabled={!subject.trim() || createMutation.isPending}>
            Create
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setIsCreating(false);
              setSubject('');
              setTypeId('');
            }}
          >
            Cancel
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

const PAGE_SIZES = [25, 50, 100] as const;

export default function WorkPackageList() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // TODO: get workspaceId from auth store context
  const workspaceId = 'default';

  // Filter state
  const [filters, setFilters] = useState<FilterWorkPackagesParams>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Compute API params from state
  const params = useMemo<FilterWorkPackagesParams>(() => ({
    ...filters,
    page: page + 1,
    limit: pageSize,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
  }), [filters, page, pageSize, sorting]);

  // Data queries
  const { data, isPending } = useWorkPackages(projectId!, params);
  const { data: types = [] } = useTypes(workspaceId);
  const { data: statuses = [] } = useStatuses(workspaceId);
  const { data: priorities = [] } = usePriorities(workspaceId);
  const { data: savedQueries = [] } = useQueries(projectId);
  // Active filter count
  const filterCount = useMemo(() => {
    let count = 0;
    if (filters.statusId) count++;
    if (filters.typeId) count++;
    if (filters.priorityId) count++;
    if (filters.assigneeId) count++;
    if (filters.versionId) count++;
    if (filters.overdue) count++;
    if (filters.search) count++;
    return count;
  }, [filters]);

  // Filter label lookups
  const filterLabels = useMemo(() => {
    const labels: { key: keyof FilterWorkPackagesParams; label: string; value: string }[] = [];
    if (filters.statusId) {
      const s = statuses.find((st) => st.id === filters.statusId);
      if (s) labels.push({ key: 'statusId', label: 'Status', value: s.name });
    }
    if (filters.typeId) {
      const t = types.find((ty) => ty.id === filters.typeId);
      if (t) labels.push({ key: 'typeId', label: 'Type', value: t.name });
    }
    if (filters.priorityId) {
      const p = priorities.find((pr) => pr.id === filters.priorityId);
      if (p) labels.push({ key: 'priorityId', label: 'Priority', value: p.name });
    }
    if (filters.overdue) labels.push({ key: 'overdue', label: 'Overdue', value: 'Yes' });
    if (filters.search) labels.push({ key: 'search', label: 'Search', value: filters.search });
    return labels;
  }, [filters, statuses, types, priorities]);

  const removeFilter = useCallback((key: keyof FilterWorkPackagesParams) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPage(0);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setPage(0);
  }, []);

  // Table columns
  const columns = useMemo<ColumnDef<WorkPackage, unknown>[]>(() => [
    {
      accessorKey: 'id',
      header: '#',
      size: 60,
      cell: ({ row }) => (
        <span className="text-xs text-text-tertiary font-mono">
          {row.original.id.slice(-6)}
        </span>
      ),
    },
    {
      accessorKey: 'subject',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 hover:text-text-primary"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Subject
          <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ row }) => {
        const wp = row.original;
        return (
          <div className="flex items-center gap-2 min-w-0">
            {wp.type && (
              <span className="flex-shrink-0" style={{ color: wp.type.color }}>
                <LucideIcon
                  name={wp.type.isMilestone ? 'Diamond' : 'FileText'}
                  size={14}
                />
              </span>
            )}
            <span className="truncate font-medium text-text-primary">{wp.subject}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ row }) =>
        row.original.status ? (
          <StatusBadge status={row.original.status} size="sm" />
        ) : null,
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 hover:text-text-primary"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Priority
          <ArrowUpDown size={12} />
        </button>
      ),
      size: 100,
      cell: ({ row }) =>
        row.original.priority ? (
          <PriorityBadge priority={row.original.priority} />
        ) : null,
    },
    {
      accessorKey: 'assignee',
      header: 'Assignee',
      size: 160,
      cell: ({ row }) => {
        const a = row.original.assignee;
        if (!a) return <span className="text-text-tertiary text-sm">Unassigned</span>;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="w-5 h-5 flex-shrink-0">
              {a.avatarUrl && <AvatarImage src={a.avatarUrl} alt={a.displayName} />}
              <AvatarFallback className="text-[9px] bg-accent-subtle text-accent-subtle-text">
                {getInitials(a.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm text-text-primary">{a.displayName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 hover:text-text-primary"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Due Date
          <ArrowUpDown size={12} />
        </button>
      ),
      size: 120,
      cell: ({ row }) => {
        const wp = row.original;
        if (!wp.dueDate) return null;
        const overdue = isOverdue(wp);
        return (
          <span className={cn('text-sm', overdue ? 'text-color-error font-medium' : 'text-text-secondary')}>
            {formatDate(wp.dueDate)}
          </span>
        );
      },
    },
    {
      accessorKey: 'estimatedHours',
      header: 'Est. Hours',
      size: 90,
      cell: ({ row }) =>
        row.original.estimatedHours != null ? (
          <span className="text-sm text-text-secondary">{row.original.estimatedHours}h</span>
        ) : null,
    },
    {
      accessorKey: 'spentHours',
      header: 'Spent',
      size: 80,
      cell: ({ row }) =>
        row.original.spentHours > 0 ? (
          <span className="text-sm text-text-secondary">{row.original.spentHours}h</span>
        ) : null,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 hover:text-text-primary"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created
          <ArrowUpDown size={12} />
        </button>
      ),
      size: 110,
      cell: ({ row }) => (
        <span className="text-sm text-text-tertiary">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ], []);

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination: { pageIndex: page, pageSize },
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: data?.totalPages ?? 0,
  });

  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {/* View toggle - list is always active here */}
          <Button variant="ghost" size="icon-sm" className="text-accent-default bg-accent-subtle">
            <ListTodo size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-text-tertiary"
            onClick={() => navigate(`/projects/${projectId}/boards`)}
          >
            <Columns3 size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-text-tertiary"
            onClick={() => navigate(`/projects/${projectId}/gantt`)}
          >
            <GanttChart size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-text-tertiary"
            onClick={() => navigate(`/projects/${projectId}/calendar`)}
          >
            <Calendar size={15} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter size={14} />
            Filters
            {filterCount > 0 && (
              <Badge variant="default" className="ml-1 h-4 min-w-4 px-1 text-[10px]">
                {filterCount}
              </Badge>
            )}
          </Button>

          {/* Saved Queries */}
          {savedQueries.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                Saved Views
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {savedQueries.map((q) => (
                  <DropdownMenuItem
                    key={q.id}
                    onClick={() => {
                      setFilters({ queryId: q.id });
                      setPage(0);
                    }}
                  >
                    {q.name}
                    {q.isDefault && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">Default</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" />}>
              <Columns3 size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table.getAllLeafColumns().map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
                >
                  {typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Page size */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              {pageSize} / page
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PAGE_SIZES.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => {
                    setPageSize(size);
                    setPage(0);
                  }}
                >
                  {size} per page
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create button */}
          <Button size="sm" onClick={() => navigate(`/projects/${projectId}/work-packages/new`)}>
            <Plus size={14} />
            New work package
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-surface-sunken border border-border-default">
          {/* Quick filter buttons */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="xs" />}>
              + Status
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {statuses.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, statusId: s.id }));
                    setPage(0);
                  }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  {s.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="xs" />}>
              + Type
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {types.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, typeId: t.id }));
                    setPage(0);
                  }}
                >
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="xs" />}>
              + Priority
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {priorities.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, priorityId: p.id }));
                    setPage(0);
                  }}
                >
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Input
            placeholder="Search..."
            className="h-6 w-40 text-xs"
            value={filters.search ?? ''}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, search: e.target.value || undefined }));
              setPage(0);
            }}
          />

          {filterCount > 0 && (
            <>
              <div className="w-px h-4 bg-border-default" />
              {filterLabels.map((f) => (
                <FilterChip
                  key={f.key}
                  label={f.label}
                  value={f.value}
                  onRemove={() => removeFilter(f.key)}
                />
              ))}
              <button
                type="button"
                className="text-xs text-text-tertiary hover:text-accent-default transition-colors duration-[var(--duration-fast)]"
                onClick={clearAllFilters}
              >
                Clear all
              </button>
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border-default">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isPending ? (
              // Skeleton rows
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, ci) => (
                    <TableCell key={ci}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => {
                const wp = row.original;
                const overdue = isOverdue(wp);
                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'group cursor-pointer transition-colors duration-[var(--duration-fast)]',
                      overdue && 'bg-color-error/[0.03]',
                    )}
                    onClick={() => navigate(`/projects/${projectId}/work-packages/${wp.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-text-secondary">
                  No work packages found.
                </TableCell>
              </TableRow>
            )}

            {/* Inline create row */}
            {!isPending && projectId && (
              <InlineCreateRow projectId={projectId} types={types} colCount={columns.length} />
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-tertiary">
          {data ? `${data.total} work package${data.total !== 1 ? 's' : ''}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-text-tertiary">
            Page {page + 1} of {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
