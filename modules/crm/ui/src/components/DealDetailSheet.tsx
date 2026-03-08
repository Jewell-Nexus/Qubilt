import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';
import { useDeal, useMoveDealStage, useDeleteDeal, useCreateActivity, useCreateNote } from '../hooks/use-crm-queries';
import { ContactAvatar } from './ContactAvatar';
import { StageBadge } from './StageBadge';
import { DealStatusBadge } from './StatusBadge';
import { ActivityItem } from './ActivityItem';
import { contactName, formatCurrency, formatDate, ACTIVITY_ICONS } from '../lib/format';
import type { ActivityType } from '../types/crm.types';

interface DealDetailSheetProps {
  dealId: string | null;
  open: boolean;
  onClose: () => void;
}

export function DealDetailSheet({ dealId, open, onClose }: DealDetailSheetProps) {
  const { data: deal, isPending } = useDeal(dealId);
  const moveDealStage = useMoveDealStage(deal?.pipelineId ?? '');
  const deleteDealMut = useDeleteDeal();
  const createActivity = useCreateActivity();
  const createNote = useCreateNote();

  const [activityOpen, setActivityOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('CALL');
  const [activitySubject, setActivitySubject] = useState('');
  const [noteText, setNoteText] = useState('');

  const handleMarkWon = () => {
    if (!deal) return;
    const wonStage = deal.pipeline.stages.find((s) => s.isWon);
    if (!wonStage) { toast.error('No "Won" stage found'); return; }
    moveDealStage.mutate(
      { dealId: deal.id, targetStageId: wonStage.id },
      { onSuccess: () => toast.success('Deal marked as Won!') },
    );
  };

  const handleMarkLost = () => {
    if (!deal) return;
    const lostStage = deal.pipeline.stages.find((s) => s.isClosed && !s.isWon);
    if (!lostStage) { toast.error('No "Lost" stage found'); return; }
    moveDealStage.mutate(
      { dealId: deal.id, targetStageId: lostStage.id },
      { onSuccess: () => toast.success('Deal marked as Lost') },
    );
  };

  const handleDelete = () => {
    if (!dealId) return;
    deleteDealMut.mutate(dealId, {
      onSuccess: () => { onClose(); toast.success('Deal deleted'); },
    });
  };

  const handleLogActivity = () => {
    if (!deal || !activitySubject.trim()) return;
    createActivity.mutate({
      workspaceId: deal.workspaceId,
      type: activityType,
      subject: activitySubject,
      dealId: deal.id,
      contactId: deal.contactId,
      userId: 'current',
    }, {
      onSuccess: () => { setActivityOpen(false); setActivitySubject(''); toast.success('Activity logged'); },
    });
  };

  const handleAddNote = () => {
    if (!deal || !noteText.trim()) return;
    createNote.mutate({
      workspaceId: deal.workspaceId,
      content: noteText,
      dealId: deal.id,
    }, {
      onSuccess: () => { setNoteText(''); toast.success('Note added'); },
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[560px] sm:max-w-[560px] overflow-y-auto p-0">
        {isPending ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : deal ? (
          <>
            <SheetHeader className="p-6 pb-4 border-b border-border-default">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-lg">{deal.name}</SheetTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <DealStatusBadge status={deal.status} />
                    <StageBadge name={deal.stage.name} color={deal.stage.color} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {deal.status === 'OPEN' && (
                    <>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleMarkWon}>
                        Mark Won
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleMarkLost}>
                        Mark Lost
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" className="text-red-500" onClick={handleDelete}>
                    <LucideIcon name="Trash2" size={14} />
                  </Button>
                </div>
              </div>
            </SheetHeader>

            <div className="flex">
              {/* Left column */}
              <div className="flex-1 p-6 border-r border-border-default min-w-0">
                {/* Log activity */}
                <div className="mb-4">
                  <button
                    onClick={() => setActivityOpen(!activityOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-[#EC4899] hover:text-[#DB2777]"
                  >
                    <LucideIcon name="Plus" size={14} />
                    Log activity
                  </button>
                  {activityOpen && (
                    <div className="mt-2 space-y-2 p-3 border border-border-default rounded-lg bg-surface-sunken">
                      <div className="flex gap-1 flex-wrap">
                        {(Object.keys(ACTIVITY_ICONS) as ActivityType[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => setActivityType(t)}
                            className={cn(
                              'px-2 py-1 rounded text-xs',
                              activityType === t ? 'bg-[#EC4899]/10 text-[#EC4899]' : 'text-text-secondary hover:bg-surface-hover',
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <Input
                        placeholder="Activity subject..."
                        value={activitySubject}
                        onChange={(e) => setActivitySubject(e.target.value)}
                      />
                      <Button size="sm" onClick={handleLogActivity} disabled={!activitySubject.trim()}>
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-medium text-text-primary mb-3">Activity</h3>
                <div className="space-y-1 divide-y divide-border-default">
                  {deal.activities.map((a) => (
                    <ActivityItem key={a.id} activity={a} />
                  ))}
                  {deal.activities.length === 0 && (
                    <p className="text-xs text-text-tertiary py-3">No activities yet</p>
                  )}
                </div>

                <h3 className="text-sm font-medium text-text-primary mt-6 mb-3">Notes</h3>
                <div className="flex gap-2 mb-3">
                  <Textarea
                    placeholder="Add a note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()}>
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {deal.notes.map((n) => (
                    <div key={n.id} className="p-2 rounded border border-border-default text-sm">
                      <p className="text-text-primary whitespace-pre-wrap">{n.content}</p>
                      <p className="text-xs text-text-tertiary mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column */}
              <div className="w-[200px] p-4 space-y-4 text-sm flex-shrink-0">
                <div>
                  <p className="text-xs text-text-tertiary mb-0.5">Value</p>
                  <p className={cn('text-lg font-semibold', deal.status === 'WON' && 'text-emerald-600', deal.status === 'LOST' && 'line-through text-text-tertiary')}>
                    {formatCurrency(deal.value, deal.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-0.5">Pipeline</p>
                  <p className="text-text-primary">{deal.pipeline.name}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-0.5">Stage</p>
                  <StageBadge name={deal.stage.name} color={deal.stage.color} />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-0.5">Expected Close</p>
                  <p className="text-text-primary">{deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : '-'}</p>
                </div>
                {deal.closedAt && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5">Closed</p>
                    <p className="text-text-primary">{formatDate(deal.closedAt)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-text-tertiary mb-0.5">Contact</p>
                  <div className="flex items-center gap-1.5">
                    <ContactAvatar contact={deal.contact} size="sm" />
                    <span className="text-text-primary text-xs">{contactName(deal.contact)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-0.5">Created</p>
                  <p className="text-text-secondary">{formatDate(deal.createdAt)}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-text-tertiary">Deal not found</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
