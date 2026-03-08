import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
import { Plus, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Permission {
  key: string;
  label: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  isBuiltIn: boolean;
  permissions: string[];
}

const WORKSPACE_ID = 'default';

export function Roles() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => get<Role[]>(`/workspaces/${WORKSPACE_ID}/roles`),
  });

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => get<Permission[]>(`/workspaces/${WORKSPACE_ID}/permissions`),
  });

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const createRole = useMutation({
    mutationFn: () => post(`/workspaces/${WORKSPACE_ID}/roles`, { name: newRoleName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setNewRoleName('');
      setIsCreating(false);
      toast.success('Role created');
    },
  });

  const deleteRole = useMutation({
    mutationFn: (roleId: string) => del(`/workspaces/${WORKSPACE_ID}/roles/${roleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRoleId(null);
      toast.success('Role deleted');
    },
  });

  const updatePermissions = useMutation({
    mutationFn: (permissions: string[]) =>
      put(`/workspaces/${WORKSPACE_ID}/roles/${selectedRoleId}/permissions`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Permissions saved');
    },
  });

  function togglePermission(key: string) {
    if (!selectedRole) return;
    const current = selectedRole.permissions;
    const next = current.includes(key) ? current.filter((p) => p !== key) : [...current, key];
    updatePermissions.mutate(next);
  }

  // Group permissions by module
  const groupedPermissions = allPermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    const group = perm.module || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Roles & Permissions</h1>
        <p className="text-sm text-text-secondary">Manage roles and configure their permissions.</p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Role list */}
        <div className="w-64 flex-shrink-0 border border-border-default rounded-lg overflow-hidden">
          <div className="p-3 border-b border-border-default flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">Roles</span>
            <Button variant="ghost" size="icon-xs" onClick={() => setIsCreating(true)}>
              <Plus size={14} />
            </Button>
          </div>
          <div className="overflow-y-auto">
            {isCreating && (
              <div className="p-2 border-b border-border-default">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newRoleName.trim()) createRole.mutate();
                  }}
                >
                  <Input
                    autoFocus
                    placeholder="Role name"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    onBlur={() => !newRoleName && setIsCreating(false)}
                  />
                </form>
              </div>
            )}
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                  selectedRoleId === role.id
                    ? 'bg-accent-subtle text-accent-subtle-text'
                    : 'text-text-secondary hover:bg-surface-sunken',
                )}
              >
                <Shield size={14} />
                <span className="flex-1 truncate">{role.name}</span>
                {role.isBuiltIn && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    built-in
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Permission editor */}
        <div className="flex-1 border border-border-default rounded-lg overflow-y-auto">
          {selectedRole ? (
            <div>
              <div className="p-4 border-b border-border-default flex items-center justify-between sticky top-0 bg-surface-base z-10">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{selectedRole.name}</h3>
                  <p className="text-xs text-text-secondary">
                    {selectedRole.permissions.length} permissions assigned
                  </p>
                </div>
                {!selectedRole.isBuiltIn && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteRole.mutate(selectedRole.id)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                )}
              </div>
              <div className="p-4 space-y-6">
                {Object.entries(groupedPermissions).map(([module, permissions]) => (
                  <div key={module}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                      {module}
                    </h4>
                    <div className="space-y-3">
                      {permissions.map((perm) => (
                        <label key={perm.key} className="flex items-start gap-3 cursor-pointer group">
                          <Checkbox
                            checked={selectedRole.permissions.includes(perm.key)}
                            onCheckedChange={() => togglePermission(perm.key)}
                          />
                          <div>
                            <span className="text-sm font-medium text-text-primary">{perm.label}</span>
                            <code className="ml-2 text-xs text-text-tertiary font-mono">{perm.key}</code>
                            <p className="text-xs text-text-secondary mt-0.5">{perm.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary text-sm">
              Select a role to view its permissions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
