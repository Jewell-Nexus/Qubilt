import { Suspense, lazy, useMemo, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useModulesStore } from '@/stores/modules.store';
import { extensionRegistry } from '@/lib/extension-registry';

function PageLoading() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-5 h-5 border-2 border-accent-default border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProjectOverview() {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-text-secondary">Project overview — modules will populate this view.</p>
    </div>
  );
}

/**
 * Renders project-scoped routes from all enabled module manifests.
 * Also registers module extensions (e.g., sidebar navigation) into the extension registry.
 * Mounted as the catch-all child of ProjectLayout.
 */
export function ProjectModuleRouter() {
  const enabledModules = useModulesStore((s) => s.enabledModules);

  const LazyRoutes = useMemo(() => {
    return lazy(async () => {
      const allRoutes: { path: string; Component: React.LazyExoticComponent<React.ComponentType> }[] = [];
      const extensions: { slot: string; component: React.ComponentType; priority: number }[] = [];

      for (const mod of enabledModules) {
        try {
          const manifest = await import(`../../modules/${mod.id}/ui/src/manifest.ts`);
          const data = manifest.default ?? manifest;

          // Collect project-scoped routes
          if (data.routes) {
            for (const route of data.routes) {
              if (route.layout === 'project') {
                allRoutes.push({ path: route.path, Component: route.component });
              }
            }
          }

          // Collect extension components (eagerly imported in manifest)
          if (data.extensions) {
            for (const ext of data.extensions) {
              if (ext.component && typeof ext.component === 'function') {
                extensions.push({
                  slot: ext.slot,
                  component: ext.component,
                  priority: ext.priority ?? 0,
                });
              }
            }
          }
        } catch {
          // Module manifest failed to load, skip
        }
      }

      function AllProjectRoutes() {
        // Register extensions on mount, clean up on unmount
        useEffect(() => {
          for (const ext of extensions) {
            extensionRegistry.register(ext.slot, ext.component, ext.priority);
          }
          return () => {
            for (const ext of extensions) {
              extensionRegistry.unregister(ext.slot, ext.component);
            }
          };
        }, []);

        return (
          <Routes>
            {allRoutes.map(({ path, Component }) => (
              <Route
                key={path}
                path={path}
                element={
                  <Suspense fallback={<PageLoading />}>
                    <Component />
                  </Suspense>
                }
              />
            ))}
            <Route path="*" element={<ProjectOverview />} />
          </Routes>
        );
      }

      return { default: AllProjectRoutes };
    });
  }, [enabledModules]);

  return (
    <Suspense fallback={<PageLoading />}>
      <LazyRoutes />
    </Suspense>
  );
}
