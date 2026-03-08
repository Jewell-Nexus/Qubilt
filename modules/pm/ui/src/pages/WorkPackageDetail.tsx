import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';
import {
  ArrowLeft,
  MoreHorizontal,
  Link2,
  Clock,
  Trash2,
  Eye,
  Calendar as CalendarIcon,
  Hash,
  User as UserIcon,
  Tag,
  Layers,
  Target,
  GitBranch,
  Plus,
  Send,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { UserPicker } from '../components/UserPicker';
import {
  useWorkPackage,
  useUpdateWorkPackage,
  useDeleteWorkPackage,
  useActivity,
  useAddNote,
  useRelations,
  useStatuses,
  useTypes,
  usePriorities,
  useVersions,
  useCategories,
  useWorkspaceMembers,
  useLogTime,
  useTimeActivities,
} from '../hooks/use-pm-queries';
import type {
  Journal,
  JournalDetail,
  PmRelation,
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

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace('Id', '')
    .trim();
}

const RELATION_LABELS: Record<string, string> = {
  RELATES: 'Relates to',
  DUPLICATES: 'Duplicates',
  DUPLICATED_BY: 'Duplicated by',
  BLOCKS: 'Blocks',
  BLOCKED_BY: 'Blocked by',
  PRECEDES: 'Precedes',
  FOLLOWS: 'Follows',
  INCLUDES: 'Includes',
  PART_OF: 'Part of',
  REQUIRES: 'Requires',
  REQUIRED_BY: 'Required by',
};

// Journal entry component
function JournalEntry({ journal }: { journal: Journal }) {
  const hasChanges = journal.details.length > 0;
  const hasNotes = !!journal.notes;

  return (
    <div className="flex gap-3 py-3">
      <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
        {journal.user?.avatarUrl && (
          <AvatarImage src={journal.user.avatarUrl} alt={journal.user?.displayName ?? ''} />
        )}
        <AvatarFallback className="text-[9px] bg-accent-subtle text-accent-subtle-text">
          {journal.user ? getInitials(journal.user.displayName) : '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-text-primary">
            {journal.user?.displayName ?? 'System'}
          </span>
          <span className="text-xs text-text-tertiary">{timeAgo(journal.createdAt)}</span>
        </div>

        {hasChanges && (
          <div className="space-y-0.5 mb-2">
            {journal.details.map((detail) => (
              <ChangeDetail key={detail.id} detail={detail} />
            ))}
          </div>
        )}

        {hasNotes && (
          <div className="rounded-md bg-surface-sunken p-3 text-sm text-text-primary">
            {journal.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function ChangeDetail({ detail }: { detail: JournalDetail }) {
  return (
    <p className="text-sm text-text-secondary">
      Changed <span className="font-medium text-text-primary">{formatFieldName(detail.field)}</span>
      {detail.oldValue && (
        <>
          {' '}from <span className="line-through text-text-tertiary">{detail.oldValue}</span>
        </>
      )}
      {detail.newValue && (
        <>
          {' '}to <span className="font-medium text-text-primary">{detail.newValue}</span>
        </>
      )}
    </p>
  );
}

// Relation group
function RelationGroup({
  type,
  relations,
}: {
  type: string;
  relations: PmRelation[];
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
        {RELATION_LABELS[type] ?? type}
      </p>
      {relations.map((rel) => {
        const target = rel.to;
        return (
          <button
            key={rel.id}
            type="button"
            className="flex items-center gap-2 w-full text-left px-2 py-1 rounded-md text-sm hover:bg-surface-sunken transition-colors duration-[var(--duration-fast)]"
            onClick={() => navigate(`/projects/${target?.projectId}/work-packages/${rel.toId}`)}
          >
            <span className="text-text-tertiary font-mono text-xs">#{rel.toId.slice(-6)}</span>
            <span className="truncate text-text-primary">{target?.subject ?? rel.toId}</span>
          </button>
        );
      })}
    </div>
  );
}

// Editable field wrapper
function DetailField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Clock;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon size={14} className="text-text-tertiary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-tertiary mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}

// Log time inline form
function LogTimeForm({
  projectId,
  wpId,
  onClose,
}: {
  projectId: string;
  wpId: string;
  onClose: () => void;
}) {
  const [hours, setHours] = useState('');
  const [comment, setComment] = useState('');
  const logTime = useLogTime();
  const { data: activities = [] } = useTimeActivities(projectId);
  const [activityId, setActivityId] = useState('');

  const handleSubmit = async () => {
    if (!hours || parseFloat(hours) <= 0) return;
    await logTime.mutateAsync({
      projectId,
      workPackageId: wpId,
      hours: parseFloat(hours),
      spentOn: new Date().toISOString().split('T')[0]!,
      comment: comment || undefined,
      activityId: activityId || undefined,
    });
    onClose();
  };

  return (
    <div className="space-y-2 p-3 rounded-lg bg-surface-sunken border border-border-default">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.25"
          min="0.25"
          placeholder="Hours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="h-7 w-20"
          autoFocus
        />
        {activities.length > 0 && (
          <select
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            className="h-7 px-2 text-sm bg-transparent border border-border-default rounded-md text-text-primary"
          >
            <option value="">Activity</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
      </div>
      <Input
        placeholder="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="h-7"
      />
      <div className="flex items-center gap-2">
        <Button size="xs" onClick={handleSubmit} disabled={!hours || logTime.isPending}>
          Log Time
        </Button>
        <Button size="xs" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function WorkPackageDetail() {
  const { projectId, wpId } = useParams<{ projectId: string; wpId: string }>();
  const navigate = useNavigate();

  const workspaceId = 'default';

  const { data: wp, isPending } = useWorkPackage(wpId!);
  const { data: activityData } = useActivity(wpId!);
  const { data: relations = [] } = useRelations(wpId!);
  const { data: statuses = [] } = useStatuses(workspaceId);
  const { data: types = [] } = useTypes(workspaceId);
  const { data: priorities = [] } = usePriorities(workspaceId);
  const { data: versions = [] } = useVersions(projectId!);
  const { data: categories = [] } = useCategories(projectId!);
  const { data: members = [] } = useWorkspaceMembers(workspaceId);

  const updateMutation = useUpdateWorkPackage();
  const deleteMutation = useDeleteWorkPackage();

  const [editingSubject, setEditingSubject] = useState(false);
  const [subjectValue, setSubjectValue] = useState('');
  const [noteText, setNoteText] = useState('');
  const [showLogTime, setShowLogTime] = useState(false);
  const subjectRef = useRef<HTMLInputElement>(null);
  const addNoteMutation = useAddNote(wpId!);

  // Description autosave
  const [description, setDescription] = useState('');
  const descTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const descInitialized = useRef(false);

  useEffect(() => {
    if (wp && !descInitialized.current) {
      setDescription(wp.description ?? '');
      descInitialized.current = true;
    }
  }, [wp]);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    if (descTimer.current) clearTimeout(descTimer.current);
    descTimer.current = setTimeout(() => {
      if (wpId) {
        updateMutation.mutate({ id: wpId, dto: { description: value } });
      }
    }, 1000);
  }, [wpId, updateMutation]);

  const handleUpdate = useCallback((field: string, value: unknown) => {
    if (!wpId) return;
    updateMutation.mutate({ id: wpId, dto: { [field]: value } });
  }, [wpId, updateMutation]);

  const handleAddNote = useCallback(async () => {
    if (!noteText.trim()) return;
    await addNoteMutation.mutateAsync(noteText.trim());
    setNoteText('');
  }, [noteText, addNoteMutation]);

  // Group relations by type
  const groupedRelations = useMemo(() => {
    const groups: Record<string, PmRelation[]> = {};
    for (const rel of relations) {
      const type = rel.type;
      if (!groups[type]) groups[type] = [];
      groups[type]!.push(rel);
    }
    return groups;
  }, [relations]);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-6 mt-6">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="w-80 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!wp) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <p className="text-lg font-medium text-text-primary">Work Package Not Found</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </Button>
          <Badge
            variant="outline"
            className="flex-shrink-0"
            style={{
              borderColor: wp.type?.color ?? 'currentColor',
              color: wp.type?.color ?? 'currentColor',
            }}
          >
            {wp.type?.name ?? 'WP'}-{wp.id.slice(-4)}
          </Badge>
          {wp.status && (
            <StatusBadge
              status={wp.status}
              allStatuses={statuses}
              interactive
              onStatusChange={(statusId) => handleUpdate('statusId', statusId)}
            />
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogTime(!showLogTime)}
          >
            <Clock size={14} />
            Log Time
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
              >
                <Link2 size={14} />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye size={14} />
                Watch
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={async () => {
                  await deleteMutation.mutateAsync(wp.id);
                  navigate(`/projects/${projectId}/work-packages`);
                }}
              >
                <Trash2 size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Subject */}
          {editingSubject ? (
            <Input
              ref={subjectRef}
              value={subjectValue}
              onChange={(e) => setSubjectValue(e.target.value)}
              className="text-xl font-semibold"
              onBlur={() => {
                if (subjectValue.trim() && subjectValue !== wp.subject) {
                  handleUpdate('subject', subjectValue.trim());
                }
                setEditingSubject(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
                if (e.key === 'Escape') {
                  setEditingSubject(false);
                }
              }}
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-semibold text-text-primary cursor-pointer hover:text-accent-default transition-colors duration-[var(--duration-fast)]"
              onClick={() => {
                setSubjectValue(wp.subject);
                setEditingSubject(true);
              }}
            >
              {wp.subject}
            </h1>
          )}

          {/* Log Time form (inline) */}
          {showLogTime && (
            <LogTimeForm
              projectId={projectId!}
              wpId={wp.id}
              onClose={() => setShowLogTime(false)}
            />
          )}

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Add a description..."
              className="w-full min-h-24 p-3 text-sm text-text-primary bg-transparent border border-border-default rounded-lg resize-y placeholder:text-text-tertiary focus:border-accent-default focus:ring-1 focus:ring-accent-default outline-none transition-colors duration-[var(--duration-fast)]"
            />
          </div>

          <Separator className="bg-border-default" />

          {/* Activity / Comments */}
          <Tabs defaultValue="activity">
            <TabsList variant="line">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4">
              {/* Add note */}
              <div className="flex gap-2 mb-4">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || addNoteMutation.isPending}
                >
                  <Send size={14} />
                </Button>
              </div>

              {/* Journal entries */}
              <div className="divide-y divide-border-default">
                {activityData?.data.map((journal) => (
                  <JournalEntry key={journal.id} journal={journal} />
                ))}
                {activityData?.data.length === 0 && (
                  <p className="py-8 text-sm text-text-tertiary text-center">No activity yet</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <div className="flex gap-2 mb-4">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || addNoteMutation.isPending}
                >
                  <Send size={14} />
                </Button>
              </div>
              <div className="divide-y divide-border-default">
                {activityData?.data
                  .filter((j) => !!j.notes)
                  .map((journal) => (
                    <JournalEntry key={journal.id} journal={journal} />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar */}
        <aside className="w-80 flex-shrink-0 space-y-1">
          <div className="rounded-lg border border-border-default p-4 space-y-1">
            {/* Status */}
            <DetailField label="Status" icon={Tag}>
              {wp.status ? (
                <StatusBadge
                  status={wp.status}
                  allStatuses={statuses}
                  interactive
                  onStatusChange={(statusId) => handleUpdate('statusId', statusId)}
                />
              ) : (
                <span className="text-sm text-text-tertiary">None</span>
              )}
            </DetailField>

            {/* Type */}
            <DetailField label="Type" icon={Layers}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<button type="button" />}
                  className="text-sm text-text-primary hover:text-accent-default transition-colors duration-[var(--duration-fast)]"
                >
                  {wp.type?.name ?? 'None'}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {types.map((t) => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => handleUpdate('typeId', t.id)}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </DetailField>

            {/* Priority */}
            <DetailField label="Priority" icon={Target}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<button type="button" />}
                  className="text-sm hover:opacity-80 transition-opacity duration-[var(--duration-fast)]"
                >
                  {wp.priority ? (
                    <PriorityBadge priority={wp.priority} />
                  ) : (
                    <span className="text-text-tertiary">None</span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {priorities.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => handleUpdate('priorityId', p.id)}
                    >
                      <PriorityBadge priority={p} />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </DetailField>

            {/* Assignee */}
            <DetailField label="Assignee" icon={UserIcon}>
              <UserPicker
                value={wp.assignee ?? null}
                onChange={(user) => handleUpdate('assigneeId', user?.id ?? null)}
                users={members}
              />
            </DetailField>

            {/* Version */}
            <DetailField label="Version" icon={GitBranch}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<button type="button" />}
                  className="text-sm text-text-primary hover:text-accent-default transition-colors duration-[var(--duration-fast)]"
                >
                  {wp.version?.name ?? 'None'}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleUpdate('versionId', null)}>
                    None
                  </DropdownMenuItem>
                  {versions.map((v) => (
                    <DropdownMenuItem
                      key={v.id}
                      onClick={() => handleUpdate('versionId', v.id)}
                    >
                      {v.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </DetailField>

            {/* Category */}
            <DetailField label="Category" icon={Tag}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<button type="button" />}
                  className="text-sm text-text-primary hover:text-accent-default transition-colors duration-[var(--duration-fast)]"
                >
                  {wp.category?.name ?? 'None'}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleUpdate('categoryId', null)}>
                    None
                  </DropdownMenuItem>
                  {categories.map((c) => (
                    <DropdownMenuItem
                      key={c.id}
                      onClick={() => handleUpdate('categoryId', c.id)}
                    >
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </DetailField>

            <Separator className="bg-border-default my-2" />

            {/* Start date */}
            <DetailField label="Start Date" icon={CalendarIcon}>
              <input
                type="date"
                value={wp.startDate?.split('T')[0] ?? ''}
                onChange={(e) => handleUpdate('startDate', e.target.value || null)}
                className="text-sm text-text-primary bg-transparent outline-none"
              />
            </DetailField>

            {/* Due date */}
            <DetailField label="Due Date" icon={CalendarIcon}>
              <input
                type="date"
                value={wp.dueDate?.split('T')[0] ?? ''}
                onChange={(e) => handleUpdate('dueDate', e.target.value || null)}
                className={cn(
                  'text-sm bg-transparent outline-none',
                  wp.dueDate && !wp.status?.isClosed && new Date(wp.dueDate) < new Date()
                    ? 'text-color-error font-medium'
                    : 'text-text-primary',
                )}
              />
            </DetailField>

            {/* Estimated hours */}
            <DetailField label="Estimated Hours" icon={Clock}>
              <input
                type="number"
                step="0.5"
                min="0"
                value={wp.estimatedHours ?? ''}
                onChange={(e) => handleUpdate('estimatedHours', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="—"
                className="text-sm text-text-primary bg-transparent outline-none w-16"
              />
            </DetailField>

            {/* Spent hours (read-only) */}
            <DetailField label="Spent Hours" icon={Clock}>
              <span className="text-sm text-text-primary">{wp.spentHours}h</span>
            </DetailField>

            {/* Story points */}
            <DetailField label="Story Points" icon={Hash}>
              <input
                type="number"
                min="0"
                value={wp.storyPoints ?? ''}
                onChange={(e) => handleUpdate('storyPoints', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="—"
                className="text-sm text-text-primary bg-transparent outline-none w-16"
              />
            </DetailField>

            {/* % Done */}
            <DetailField label="% Done" icon={Target}>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={wp.percentDone}
                  onChange={(e) => handleUpdate('percentDone', parseInt(e.target.value))}
                  className="flex-1 h-1.5 accent-accent-default"
                />
                <span className="text-sm text-text-secondary w-8 text-right">{wp.percentDone}%</span>
              </div>
            </DetailField>
          </div>

          {/* Relations */}
          <div className="rounded-lg border border-border-default p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-primary">Relations</h3>
              <Button variant="ghost" size="icon-xs">
                <Plus size={14} />
              </Button>
            </div>
            {Object.keys(groupedRelations).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(groupedRelations).map(([type, rels]) => (
                  <RelationGroup key={type} type={type} relations={rels} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary">No relations</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
