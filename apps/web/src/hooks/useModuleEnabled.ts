import { useModulesStore } from '@/stores/modules.store';

export function useModuleEnabled(moduleId: string): boolean {
  return useModulesStore((s) => s.enabledModules.some((m) => m.id === moduleId));
}
