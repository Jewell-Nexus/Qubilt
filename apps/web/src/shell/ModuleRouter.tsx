import { Suspense, lazy, useMemo } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useModulesStore } from '@/stores/modules.store';

function ModuleUnavailable() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <p className="text-lg font-medium text-text-primary">Module Unavailable</p>
      <p className="text-sm text-text-secondary">This module could not be loaded or is not installed.</p>
    </div>
  );
}

function ModuleLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-accent-default border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function ModuleRouter() {
  const enabledModules = useModulesStore((s) => s.enabledModules);

  const moduleRoutes = useMemo(() => {
    return enabledModules.map((mod) => {
      const LazyModule = lazy(async () => {
        try {
          const manifest = await import(`../../modules/${mod.id}/ui/src/manifest.ts`);
          const ModuleComponent = manifest.default?.component ?? manifest.component;
          if (!ModuleComponent) throw new Error('No component exported');
          return { default: ModuleComponent };
        } catch {
          return { default: ModuleUnavailable };
        }
      });
      return { id: mod.id, Component: LazyModule };
    });
  }, [enabledModules]);

  return (
    <Suspense fallback={<ModuleLoading />}>
      <Routes>
        {moduleRoutes.map(({ id, Component }) => (
          <Route key={id} path={`${id}/*`} element={<Component />} />
        ))}
        <Route path="*" element={<ModuleUnavailable />} />
      </Routes>
    </Suspense>
  );
}
