import { useEffect, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { extensionRegistry } from '@/lib/extension-registry';
import PmProjectSubnav from './components/PmProjectSubnav';
import manifest from './manifest';

function ModuleLoading() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-5 h-5 border-2 border-accent-default border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Root component for the PM module.
 * Used by ModuleRouter for top-level module routes (non-project-scoped).
 * Project-scoped routes are handled by ProjectModuleRouter directly.
 */
export default function PmModule() {
  // Register extensions on mount
  useEffect(() => {
    extensionRegistry.register('project.sidebar.nav', PmProjectSubnav);
    return () => {
      extensionRegistry.unregister('project.sidebar.nav', PmProjectSubnav);
    };
  }, []);

  return (
    <Suspense fallback={<ModuleLoading />}>
      <Routes>
        {manifest.routes.map((route) => {
          const PageComponent = route.component;
          return (
            <Route
              key={route.path}
              path={route.path}
              element={<PageComponent />}
            />
          );
        })}
      </Routes>
    </Suspense>
  );
}
