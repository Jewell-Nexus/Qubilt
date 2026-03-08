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
import { useContact, useUpdateContact, useDeleteContact, useCreateActivity, useCreateNote } from '../hooks/use-crm-queries';
import { ContactAvatar } from './ContactAvatar';
import { StageBadge } from './StageBadge';
import { ActivityItem } from './ActivityItem';
import { contactName, formatCurrency, formatDate, ACTIVITY_ICONS } from '../lib/format';
import type { ActivityType } from '../types/crm.types';

interface ContactDetailSheetProps {
  contactId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ContactDetailSheet({ contactId, open, onClose }: ContactDetailSheetProps) {
  const { data: contact, isPending } = useContact(contactId);
  const updateContact = useUpdateContact();
  const deleteContactMut = useDeleteContact();
  const createActivity = useCreateActivity();
  const createNote = useCreateNote();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('CALL');
  const [activitySubject, setActivitySubject] = useState('');
  const [noteText, setNoteText] = useState('');

  const handleFieldSave = (field: string) => {
    if (!contactId) return;
    updateContact.mutate({ id: contactId, dto: { [field]: editValue } }, {
      onSuccess: () => { setEditingField(null); toast.success('Updated'); },
    });
  };

  const handleDelete = () => {
    if (!contactId) return;
    deleteContactMut.mutate(contactId, {
      onSuccess: () => { onClose(); toast.success('Contact deleted'); },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Cannot delete contact'),
    });
  };

  const handleLogActivity = () => {
    if (!contactId || !activitySubject.trim()) return;
    createActivity.mutate({
      workspaceId: contact?.workspaceId ?? 'default',
      type: activityType,
      subject: activitySubject,
      contactId,
      userId: 'current',
    }, {
      onSuccess: () => { setActivityOpen(false); setActivitySubject(''); toast.success('Activity logged'); },
    });
  };

  const handleAddNote = () => {
    if (!contactId || !noteText.trim()) return;
    createNote.mutate({
      workspaceId: contact?.workspaceId ?? 'default',
      content: noteText,
      contactId,
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
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : contact ? (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b border-border-default">
              <div className="flex items-start gap-4">
                <ContactAvatar contact={contact} size="lg" />
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-lg">{contactName(contact)}</SheetTitle>
                  {contact.jobTitle && (
                    <p className="text-sm text-text-secondary">{contact.jobTitle}</p>
                  )}
                  {contact.company && (
                    <p className="text-sm text-text-tertiary">{contact.company}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      contact.type === 'PERSON' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700',
                    )}>
                      {contact.type === 'PERSON' ? 'Person' : 'Organization'}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-red-500" onClick={handleDelete}>
                  <LucideIcon name="Trash2" size={14} />
                </Button>
              </div>
            </SheetHeader>

            <div className="flex">
              {/* Left column — timeline */}
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
                      <div className="flex gap-1">
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

                {/* Activity timeline */}
                <h3 className="text-sm font-medium text-text-primary mb-3">Activity</h3>
                <div className="space-y-1 divide-y divide-border-default">
                  {contact.activities.map((a) => (
                    <ActivityItem key={a.id} activity={a} />
                  ))}
                  {contact.activities.length === 0 && (
                    <p className="text-xs text-text-tertiary py-3">No activities yet</p>
                  )}
                </div>

                {/* Notes */}
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
                  {contact.notes.map((n) => (
                    <div key={n.id} className="p-2 rounded border border-border-default text-sm">
                      <p className="text-text-primary whitespace-pre-wrap">{n.content}</p>
                      <p className="text-xs text-text-tertiary mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column — details */}
              <div className="w-[200px] p-4 space-y-4 text-sm flex-shrink-0">
                <DetailField
                  label="Email"
                  value={contact.email}
                  field="email"
                  editing={editingField}
                  editValue={editValue}
                  onEdit={(f, v) => { setEditingField(f); setEditValue(v ?? ''); }}
                  onSave={handleFieldSave}
                  onCancel={() => setEditingField(null)}
                  render={(v) => <a href={`mailto:${v}`} className="text-accent-default hover:underline">{v}</a>}
                />
                <DetailField
                  label="Phone"
                  value={contact.phone}
                  field="phone"
                  editing={editingField}
                  editValue={editValue}
                  onEdit={(f, v) => { setEditingField(f); setEditValue(v ?? ''); }}
                  onSave={handleFieldSave}
                  onCancel={() => setEditingField(null)}
                  render={(v) => <a href={`tel:${v}`} className="text-accent-default hover:underline">{v}</a>}
                />
                <div>
                  <p className="text-xs text-text-tertiary mb-0.5">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 text-xs bg-surface-sunken rounded">{t}</span>
                    ))}
                    {contact.tags.length === 0 && <span className="text-text-tertiary text-xs">No tags</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-0.5">Created</p>
                  <p className="text-text-secondary">{formatDate(contact.createdAt)}</p>
                </div>

                {/* Linked deals */}
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Deals ({contact.deals.length})</p>
                  <div className="space-y-1.5">
                    {contact.deals.map((d) => (
                      <div key={d.id} className="p-1.5 rounded border border-border-default">
                        <p className="text-xs font-medium text-text-primary truncate">{d.name}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <StageBadge name={d.stage.name} color={null} className="text-[10px]" />
                          <span className={cn('text-xs font-medium', d.status === 'LOST' && 'line-through text-text-tertiary')}>
                            {formatCurrency(d.value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Organization / Employees */}
                {contact.organization && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5">Organization</p>
                    <p className="text-text-primary">{contactName(contact.organization)}</p>
                  </div>
                )}
                {contact.employees.length > 0 && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Employees ({contact.employees.length})</p>
                    {contact.employees.map((e) => (
                      <div key={e.id} className="flex items-center gap-1.5 py-0.5">
                        <ContactAvatar contact={e} size="sm" />
                        <span className="text-xs">{e.firstName} {e.lastName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-text-tertiary">Contact not found</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailField({
  label,
  value,
  field,
  editing,
  editValue,
  onEdit,
  onSave,
  onCancel,
  render,
}: {
  label: string;
  value: string | null;
  field: string;
  editing: string | null;
  editValue: string;
  onEdit: (field: string, value: string | null) => void;
  onSave: (field: string) => void;
  onCancel: () => void;
  render?: (v: string) => React.ReactNode;
}) {
  if (editing === field) {
    return (
      <div>
        <p className="text-xs text-text-tertiary mb-0.5">{label}</p>
        <Input
          value={editValue}
          onChange={(e) => onEdit(field, e.target.value)}
          className="text-sm h-7"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(field);
            if (e.key === 'Escape') onCancel();
          }}
        />
      </div>
    );
  }
  return (
    <div
      className="group cursor-pointer hover:bg-surface-hover rounded px-1 -mx-1 py-0.5"
      onClick={() => onEdit(field, value)}
    >
      <p className="text-xs text-text-tertiary mb-0.5">{label}</p>
      <p className="text-text-primary">
        {value ? (render ? render(value) : value) : <span className="text-text-tertiary">-</span>}
      </p>
    </div>
  );
}
