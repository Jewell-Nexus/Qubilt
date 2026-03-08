import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import manifest from './manifest';

function ModuleLoading() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-5 h-5 border-2 border-[#EC4899] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function CrmModule() {
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
