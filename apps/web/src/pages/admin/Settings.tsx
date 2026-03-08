import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, put, post, del } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const WORKSPACE_ID = 'default';

interface WorkspaceSettings {
  name: string;
  slug: string;
  logoUrl?: string;
  timezone: string;
  security: {
    minPasswordLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    sessionTimeout: number;
    enforce2FA: boolean;
  };
}

export function Settings() {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['workspace-settings'],
    queryFn: () => get<WorkspaceSettings>(`/workspaces/${WORKSPACE_ID}/settings`),
  });

  const updateSettings = useMutation({
    mutationFn: (data: Partial<WorkspaceSettings>) =>
      put(`/workspaces/${WORKSPACE_ID}/settings`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-settings'] });
      toast.success('Settings saved');
    },
  });

  const testSmtp = useMutation({
    mutationFn: () => post(`/workspaces/${WORKSPACE_ID}/settings/test-smtp`),
    onSuccess: () => toast.success('Test email sent'),
    onError: () => toast.error('SMTP test failed'),
  });

  const deleteWorkspace = useMutation({
    mutationFn: () => del(`/workspaces/${WORKSPACE_ID}`),
    onSuccess: () => {
      window.location.href = '/login';
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Manage workspace configuration.</p>
      </div>

      <Tabs defaultValue="workspace">
        <TabsList>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="space-y-4 pt-4">
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              <Input defaultValue={settings?.name} onBlur={(e) => updateSettings.mutate({ name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={settings?.slug ?? ''} disabled className="text-text-secondary" />
              <p className="text-xs text-text-tertiary">The workspace slug cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label>Default Timezone</Label>
              <Input
                defaultValue={settings?.timezone}
                onBlur={(e) => updateSettings.mutate({ timezone: e.target.value })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 pt-4">
          <div className="max-w-md space-y-6">
            <h3 className="text-sm font-semibold text-text-primary">Password Policy</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Minimum Length</Label>
                <Input
                  type="number"
                  defaultValue={settings?.security?.minPasswordLength ?? 8}
                  onBlur={(e) =>
                    updateSettings.mutate({
                      security: { ...settings?.security!, minPasswordLength: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require uppercase letters</Label>
                <Switch
                  checked={settings?.security?.requireUppercase ?? false}
                  onCheckedChange={(v) =>
                    updateSettings.mutate({ security: { ...settings?.security!, requireUppercase: !!v } })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require numbers</Label>
                <Switch
                  checked={settings?.security?.requireNumbers ?? false}
                  onCheckedChange={(v) =>
                    updateSettings.mutate({ security: { ...settings?.security!, requireNumbers: !!v } })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require special characters</Label>
                <Switch
                  checked={settings?.security?.requireSpecialChars ?? false}
                  onCheckedChange={(v) =>
                    updateSettings.mutate({ security: { ...settings?.security!, requireSpecialChars: !!v } })
                  }
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  defaultValue={settings?.security?.sessionTimeout ?? 30}
                  onBlur={(e) =>
                    updateSettings.mutate({
                      security: { ...settings?.security!, sessionTimeout: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enforce Two-Factor Authentication</Label>
                <Switch
                  checked={settings?.security?.enforce2FA ?? false}
                  onCheckedChange={(v) =>
                    updateSettings.mutate({ security: { ...settings?.security!, enforce2FA: !!v } })
                  }
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-4 pt-4">
          <div className="max-w-md space-y-4">
            <p className="text-sm text-text-secondary">
              Email delivery is configured via environment variables on the server.
            </p>
            <Button onClick={() => testSmtp.mutate()} disabled={testSmtp.isPending}>
              {testSmtp.isPending ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 pt-4">
          <div className="max-w-md">
            <p className="text-sm text-text-secondary">
              Configure webhooks and external integrations.
            </p>
            <Button variant="outline" className="mt-3" onClick={() => window.location.href = '/admin/webhooks'}>
              Manage Webhooks
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="danger" className="space-y-4 pt-4">
          <div className="max-w-md p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <h3 className="text-sm font-semibold text-destructive">Delete Workspace</h3>
            <p className="text-sm text-text-secondary mt-1">
              Permanently delete this workspace and all of its data. This action cannot be undone.
            </p>
            <Button variant="destructive" className="mt-3" onClick={() => setDeleteConfirm(true)}>
              Delete Workspace
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              This action is permanent. Type <strong>{settings?.slug}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder={settings?.slug}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteInput !== settings?.slug}
              onClick={() => deleteWorkspace.mutate()}
            >
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
