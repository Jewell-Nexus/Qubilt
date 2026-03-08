import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface ModuleManifest {
  id: string;
  name: string;
  icon: string;
  accentColor: string;
  navigation: Array<{ label: string; path: string; icon?: string }>;
  version: string;
}

interface ModulesState {
  installedModules: ModuleManifest[];
  enabledModules: ModuleManifest[];
  isLoaded: boolean;
}

interface ModulesActions {
  loadModules(workspaceId: string): Promise<void>;
}

type ModulesStore = ModulesState & ModulesActions;

export const useModulesStore = create<ModulesStore>()(
  devtools(
    (set) => ({
      installedModules: [],
      enabledModules: [],
      isLoaded: false,

      async loadModules(workspaceId: string) {
        const { get } = await import('@/lib/api');
        const modules = await get<ModuleManifest[]>(`/workspaces/${workspaceId}/modules`);
        set({
          installedModules: modules,
          enabledModules: modules.filter(() => true),
          isLoaded: true,
        });
      },
    }),
    { name: 'modules' },
  ),
);
