import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCreateContact } from '../hooks/use-crm-queries';
import type { ContactType } from '../types/crm.types';

interface CreateContactModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function CreateContactModal({ open, onClose, workspaceId }: CreateContactModalProps) {
  const [type, setType] = useState<ContactType>('PERSON');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const createContact = useCreateContact();

  const handleSubmit = () => {
    createContact.mutate({
      workspaceId,
      type,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined,
      jobTitle: jobTitle || undefined,
      ownerId: 'current',
    }, {
      onSuccess: () => {
        toast.success('Contact created');
        reset();
        onClose();
      },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create contact'),
    });
  };

  const reset = () => {
    setType('PERSON');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setJobTitle('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['PERSON', 'ORGANIZATION'] as const).map((t) => (
              <Button
                key={t}
                variant={type === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType(t)}
              >
                {t === 'PERSON' ? 'Person' : 'Organization'}
              </Button>
            ))}
          </div>
          {type === 'PERSON' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
          )}
          {type === 'ORGANIZATION' && (
            <div>
              <Label>Company Name</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {type === 'PERSON' && (
            <>
              <div>
                <Label>Job Title</Label>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createContact.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
