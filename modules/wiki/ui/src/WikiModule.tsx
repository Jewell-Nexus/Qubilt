import { useEffect, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { extensionRegistry } from '@/lib/extension-registry';
import WikiProjectSubnav from './components/WikiProjectSubnav';
import manifest from './manifest';

function ModuleLoading() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-5 h-5 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function WikiModule() {
  useEffect(() => {
    extensionRegistry.register('project.sidebar.nav', WikiProjectSubnav);
    return () => {
      extensionRegistry.unregister('project.sidebar.nav', WikiProjectSubnav);
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
