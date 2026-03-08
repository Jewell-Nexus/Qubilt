import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { useContact } from '../hooks/use-crm-queries';
import { ContactAvatar } from '../components/ContactAvatar';
import { contactName, formatDate } from '../lib/format';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contact, isPending } = useContact(id ?? null);

  if (isPending) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!contact) {
    return <div className="p-6 text-center text-text-tertiary">Contact not found</div>;
  }

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/crm/contacts')} className="mb-4">
        <LucideIcon name="ArrowLeft" size={14} className="mr-1" />
        Back to Contacts
      </Button>
      <div className="flex items-center gap-4 mb-6">
        <ContactAvatar contact={contact} size="lg" />
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{contactName(contact)}</h1>
          {contact.jobTitle && <p className="text-sm text-text-secondary">{contact.jobTitle}</p>}
          {contact.company && <p className="text-sm text-text-tertiary">{contact.company}</p>}
          <p className="text-xs text-text-tertiary mt-1">Created {formatDate(contact.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
