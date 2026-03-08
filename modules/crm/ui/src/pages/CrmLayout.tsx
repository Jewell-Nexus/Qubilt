import { Suspense, lazy } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { LucideIcon } from '@/components/ui/LucideIcon';

const ContactList = lazy(() => import('./ContactList'));
const ContactDetailPage = lazy(() => import('./ContactDetailPage'));
const PipelineView = lazy(() => import('./PipelineView'));
const DealDetailPage = lazy(() => import('./DealDetailPage'));
const ActivityList = lazy(() => import('./ActivityList'));
const CrmReports = lazy(() => import('./CrmReports'));

const NAV_ITEMS = [
  { to: '/crm/contacts', label: 'Contacts', icon: 'Users' },
  { to: '/crm/pipelines', label: 'Pipelines', icon: 'Kanban' },
  { to: '/crm/activities', label: 'Activities', icon: 'Activity' },
  { to: '/crm/reports', label: 'Reports', icon: 'BarChart3' },
];

function PageLoading() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-5 h-5 border-2 border-[#EC4899] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function CrmLayout() {
  return (
    <div className="flex flex-col h-full">
      <nav className="flex items-center gap-1 px-4 py-2 border-b border-border-default bg-surface-default">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-[var(--duration-base)]',
                isActive
                  ? 'bg-[#EC4899]/10 text-[#EC4899]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
              )
            }
          >
            <LucideIcon name={item.icon} size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route index element={<Navigate to="contacts" replace />} />
            <Route path="contacts" element={<ContactList />} />
            <Route path="contacts/:id" element={<ContactDetailPage />} />
            <Route path="pipelines" element={<PipelineView />} />
            <Route path="pipelines/:id" element={<PipelineView />} />
            <Route path="deals/:id" element={<DealDetailPage />} />
            <Route path="activities" element={<ActivityList />} />
            <Route path="reports" element={<CrmReports />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
