import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { useContacts } from '../hooks/use-crm-queries';
import { ContactAvatar } from '../components/ContactAvatar';
import { ContactDetailSheet } from '../components/ContactDetailSheet';
import { CreateContactModal } from '../components/CreateContactModal';
import { ImportContactsModal } from '../components/ImportContactsModal';
import { contactName, formatDate, formatRelative } from '../lib/format';
import type { CrmContact, ContactType } from '../types/crm.types';

const WORKSPACE_ID = 'default';

export default function ContactList() {
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContactType | ''>('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [page, setPage] = useState(1);

  const filters: Record<string, unknown> = { page, limit: 20 };
  if (search) filters['search'] = search;
  if (typeFilter) filters['type'] = typeFilter;

  const { data, isPending } = useContacts(WORKSPACE_ID, filters);
  const contacts = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const handleExport = useCallback(() => {
    const url = `/api/v1/crm/contacts/export?workspaceId=${WORKSPACE_ID}`;
    window.open(url, '_blank');
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Contacts</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <LucideIcon name="Upload" size={14} className="mr-1" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <LucideIcon name="Download" size={14} className="mr-1" />
            Export
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <LucideIcon name="Plus" size={14} className="mr-1" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <LucideIcon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 border border-border-default rounded-md">
          {(['', 'PERSON', 'ORGANIZATION'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t as ContactType | ''); setPage(1); }}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                typeFilter === t ? 'bg-[#EC4899]/10 text-[#EC4899]' : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {t === '' ? 'All' : t === 'PERSON' ? 'People' : 'Organizations'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 border border-border-default rounded-md ml-auto">
          <button
            onClick={() => setView('table')}
            className={cn('p-1.5 rounded', view === 'table' ? 'bg-surface-sunken' : '')}
          >
            <LucideIcon name="List" size={16} />
          </button>
          <button
            onClick={() => setView('cards')}
            className={cn('p-1.5 rounded', view === 'cards' ? 'bg-surface-sunken' : '')}
          >
            <LucideIcon name="LayoutGrid" size={16} />
          </button>
        </div>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : view === 'table' ? (
        <ContactTable contacts={contacts} onSelect={setSelectedContactId} />
      ) : (
        <ContactCards contacts={contacts} onSelect={setSelectedContactId} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-secondary">
          <span>{total} contacts</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ContactDetailSheet
        contactId={selectedContactId}
        open={!!selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />
      <CreateContactModal open={createOpen} onClose={() => setCreateOpen(false)} workspaceId={WORKSPACE_ID} />
      <ImportContactsModal open={importOpen} onClose={() => setImportOpen(false)} workspaceId={WORKSPACE_ID} />
    </div>
  );
}

function ContactTable({ contacts, onSelect }: { contacts: CrmContact[]; onSelect: (id: string) => void }) {
  return (
    <div className="border border-border-default rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-sunken text-left text-text-secondary">
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Phone</th>
            <th className="px-4 py-2 font-medium">Company</th>
            <th className="px-4 py-2 font-medium">Last Activity</th>
            <th className="px-4 py-2 font-medium text-right">Deals</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {contacts.map((c) => (
            <tr
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="hover:bg-surface-hover cursor-pointer transition-colors"
            >
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <ContactAvatar contact={c} size="sm" />
                  <span className="font-medium text-text-primary">{contactName(c)}</span>
                </div>
              </td>
              <td className="px-4 py-2">
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  c.type === 'PERSON' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700',
                )}>
                  {c.type === 'PERSON' ? 'Person' : 'Org'}
                </span>
              </td>
              <td className="px-4 py-2 text-text-secondary">{c.email ?? '-'}</td>
              <td className="px-4 py-2 text-text-secondary">{c.phone ?? '-'}</td>
              <td className="px-4 py-2 text-text-secondary">{c.company ?? '-'}</td>
              <td className="px-4 py-2 text-text-tertiary text-xs">
                {c.lastActivityDate ? formatRelative(c.lastActivityDate) : '-'}
              </td>
              <td className="px-4 py-2 text-right text-text-secondary">{c.dealCount ?? 0}</td>
            </tr>
          ))}
          {contacts.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-text-tertiary">
                No contacts found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ContactCards({ contacts, onSelect }: { contacts: CrmContact[]; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {contacts.map((c) => (
        <div
          key={c.id}
          onClick={() => onSelect(c.id)}
          className="border border-border-default rounded-lg p-4 bg-surface-raised hover:shadow-[var(--shadow-2)] cursor-pointer transition-shadow duration-[var(--duration-base)]"
        >
          <div className="flex items-center gap-3 mb-3">
            <ContactAvatar contact={c} size="lg" />
            <div className="min-w-0">
              <p className="font-medium text-text-primary truncate">{contactName(c)}</p>
              {c.jobTitle && <p className="text-xs text-text-tertiary truncate">{c.jobTitle}</p>}
              {c.company && <p className="text-xs text-text-secondary truncate">{c.company}</p>}
            </div>
          </div>
          <div className="space-y-1 text-xs text-text-secondary">
            {c.email && (
              <div className="flex items-center gap-1.5">
                <LucideIcon name="Mail" size={12} />
                <span className="truncate">{c.email}</span>
              </div>
            )}
            {c.phone && (
              <div className="flex items-center gap-1.5">
                <LucideIcon name="Phone" size={12} />
                <span>{c.phone}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-default text-xs text-text-tertiary">
            <span>{c.dealCount ?? 0} deals</span>
            <span>{formatDate(c.createdAt)}</span>
          </div>
        </div>
      ))}
      {contacts.length === 0 && (
        <div className="col-span-full text-center py-8 text-text-tertiary">No contacts found</div>
      )}
    </div>
  );
}
