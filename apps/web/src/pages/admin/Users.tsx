import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { get, post, patch } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, UserX, KeyRound, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  username: string;
  avatarUrl?: string;
  role: { id: string; name: string };
  status: 'active' | 'inactive' | 'pending';
}

interface MembersResponse {
  data: Member[];
  total: number;
  page: number;
  limit: number;
}

interface Role {
  id: string;
  name: string;
}

// TODO: Replace with actual workspace ID from context
const WORKSPACE_ID = 'default';

const columns: ColumnDef<Member, unknown>[] = [
  {
    accessorKey: 'displayName',
    header: 'Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="w-7 h-7">
          {row.original.avatarUrl && (
            <AvatarImage src={row.original.avatarUrl} alt={row.original.displayName} />
          )}
          <AvatarFallback className="text-xs bg-accent-subtle text-accent-subtle-text">
            {row.original.displayName
              .split(' ')
              .map((w: string) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">{row.original.displayName}</span>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'username',
    header: 'Username',
    cell: ({ getValue }) => (
      <span className="text-text-secondary">@{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }) => {
      const role = getValue<Role>();
      return <Badge variant="secondary">{role?.name ?? '—'}</Badge>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue<string>();
      const variant = status === 'active' ? 'default' : status === 'pending' ? 'secondary' : 'outline';
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <MemberActions member={row.original} />,
  },
];

function MemberActions({ member }: { member: Member }) {
  const queryClient = useQueryClient();

  const deactivate = useMutation({
    mutationFn: () => patch(`/workspaces/${WORKSPACE_ID}/members/${member.id}`, { status: 'inactive' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member deactivated');
    },
  });

  const resetPassword = useMutation({
    mutationFn: () => post(`/workspaces/${WORKSPACE_ID}/members/${member.id}/reset-password`),
    onSuccess: () => toast.success('Password reset email sent'),
  });

  const resendVerification = useMutation({
    mutationFn: () => post(`/workspaces/${WORKSPACE_ID}/members/${member.id}/resend-verification`),
    onSuccess: () => toast.success('Verification email sent'),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
        <MoreHorizontal size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => deactivate.mutate()}>
          <UserX size={14} />
          Deactivate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => resetPassword.mutate()}>
          <KeyRound size={14} />
          Reset Password
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => resendVerification.mutate()}>
          <Mail size={14} />
          Resend Verification
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Users() {
  const [page, setPage] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string | null>('');
  const queryClient = useQueryClient();
  const limit = 10;

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['members', page],
    queryFn: () =>
      get<MembersResponse>(`/workspaces/${WORKSPACE_ID}/members`, { page: page + 1, limit }),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => get<Role[]>(`/workspaces/${WORKSPACE_ID}/roles`),
  });

  const invite = useMutation({
    mutationFn: () =>
      post(`/workspaces/${WORKSPACE_ID}/invitations`, { email: inviteEmail, roleId: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole(null);
      toast.success('Invitation sent');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Users</h1>
          <p className="text-sm text-text-secondary">Manage workspace members and invitations.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Plus size={14} />
          Add Member
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-default border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={membersData?.data ?? []}
          manualPagination
          pageCount={Math.ceil((membersData?.total ?? 0) / limit)}
          page={page}
          onPageChange={setPage}
        />
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {(roles ?? []).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => invite.mutate()}
              disabled={!inviteEmail || !inviteRole || invite.isPending}
            >
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
