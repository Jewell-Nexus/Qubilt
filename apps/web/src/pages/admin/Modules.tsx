import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import { useModulesStore, type ModuleManifest } from '@/stores/modules.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ModuleWithStatus extends ModuleManifest {
  enabled: boolean;
  description?: string;
  settingsSchema?: Record<string, unknown>;
}

const WORKSPACE_ID = 'default';

export function Modules() {
  const [settingsModule, setSettingsModule] = useState<ModuleWithStatus | null>(null);
  const queryClient = useQueryClient();
  const loadModules = useModulesStore((s) => s.loadModules);

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: () => get<ModuleWithStatus[]>(`/workspaces/${WORKSPACE_ID}/modules`),
  });

  const toggleModule = useMutation({
    mutationFn: ({ moduleId, enable }: { moduleId: string; enable: boolean }) =>
      post(`/workspaces/${WORKSPACE_ID}/modules/${moduleId}/${enable ? 'enable' : 'disable'}`),
    onSuccess: async (_, { enable }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      // Reload modules store so sidebar updates immediately
      await loadModules(WORKSPACE_ID);
      toast.success(`Module ${enable ? 'enabled' : 'disabled'}`);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Modules</h1>
        <p className="text-sm text-text-secondary">Enable, disable, and configure workspace modules.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-default border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <Card key={mod.id} className="relative">
              <CardHeader className="flex-row items-start gap-3 space-y-0 pb-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: mod.accentColor + '20', color: mod.accentColor }}
                >
                  <LucideIcon name={mod.icon} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-semibold">{mod.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {mod.description || `v${mod.version}`}
                  </CardDescription>
                </div>
                <Badge variant={mod.enabled ? 'default' : 'secondary'} className="text-[10px]">
                  {mod.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={mod.enabled}
                    onCheckedChange={(checked) =>
                      toggleModule.mutate({ moduleId: mod.id, enable: !!checked })
                    }
                    size="sm"
                  />
                  <span className="text-xs text-text-secondary">
                    {mod.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {mod.enabled && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setSettingsModule(mod)}
                  >
                    <Settings size={14} />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!settingsModule} onOpenChange={(open) => !open && setSettingsModule(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{settingsModule?.name} Settings</SheetTitle>
            <SheetDescription>Configure module-specific settings.</SheetDescription>
          </SheetHeader>
          <div className="py-6">
            {settingsModule?.settingsSchema ? (
              <p className="text-sm text-text-secondary">
                Settings form will be rendered from the module's JSON Schema.
              </p>
            ) : (
              <p className="text-sm text-text-secondary">
                This module has no configurable settings.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
