import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { PermissionGuard } from '@/components/PermissionGuard';
import {
  Users,
  Shield,
  Puzzle,
  Store,
  Palette,
  Settings,
  ScrollText,
  Webhook,
} from 'lucide-react';

const adminNav = [
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/roles', label: 'Roles & Permissions', icon: Shield },
  { to: '/admin/modules', label: 'Modules', icon: Puzzle },
  { to: '/admin/marketplace', label: 'Marketplace', icon: Store },
  { to: '/admin/themes', label: 'Themes', icon: Palette },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
  { to: '/admin/webhooks', label: 'Webhooks', icon: Webhook },
];

function AdminSidebar() {
  return (
    <aside className="w-[200px] flex-shrink-0 border-r border-border-default bg-surface-base overflow-y-auto">
      <div className="px-3 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3 px-2">
          Administration
        </h2>
        <nav className="space-y-0.5">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors duration-[var(--duration-fast)]',
                  isActive
                    ? 'bg-accent-subtle text-accent-subtle-text font-medium'
                    : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
                )
              }
            >
              <item.icon size={15} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function AdminContent() {
  const location = useLocation();

  if (location.pathname === '/admin') {
    return <Navigate to="/admin/users" replace />;
  }

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}

export function AdminLayout() {
  return (
    <PermissionGuard permission="kernel.workspace.manage">
      <AdminContent />
    </PermissionGuard>
  );
}
