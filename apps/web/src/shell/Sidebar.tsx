import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUIStore } from '@/stores/ui.store';
import { useModulesStore } from '@/stores/modules.store';
import { useAuthStore } from '@/stores/auth.store';
import { SidebarItem } from '@/shell/SidebarItem';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const enabledModules = useModulesStore((s) => s.enabledModules);
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r border-border-default bg-sidebar-bg transition-all',
        'duration-[var(--duration-base)] ease-[var(--ease-default)]',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      {/* Header: Logo + collapse toggle */}
      <div className="flex items-center h-12 px-3 flex-shrink-0">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded bg-accent-default flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-text-on-accent">Q</span>
            </div>
            <span className="text-sm font-semibold text-text-primary truncate">Qubilt</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" className="flex items-center justify-center flex-1">
            <div className="w-6 h-6 rounded bg-accent-default flex items-center justify-center">
              <span className="text-xs font-bold text-text-on-accent">Q</span>
            </div>
          </Link>
        )}
        <button
          onClick={toggle}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-text-tertiary
                     hover:bg-surface-sunken hover:text-text-primary transition-colors duration-[var(--duration-fast)]
                     flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      <Separator className="bg-border-default" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {/* Kernel items */}
        <SidebarItem to="/dashboard" icon="LayoutDashboard" label="Dashboard" collapsed={collapsed} />

        {/* Dynamic module items */}
        {enabledModules.length > 0 && (
          <>
            <Separator className="my-2 bg-border-default" />
            {enabledModules.map((mod) => (
              <SidebarItem
                key={mod.id}
                to={mod.navigation[0]?.path || `/modules/${mod.id}`}
                icon={mod.icon}
                label={mod.name}
                accentColor={mod.accentColor}
                collapsed={collapsed}
              />
            ))}
          </>
        )}
      </nav>

      {/* Footer: User info + settings */}
      <Separator className="bg-border-default" />
      <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0">
        {user && (
          <>
            <Avatar className="w-7 h-7 flex-shrink-0">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
              <AvatarFallback className="text-xs bg-accent-subtle text-accent-subtle-text">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user.displayName}</p>
              </div>
            )}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger
                  render={<Link to="/settings" />}
                  className="inline-flex items-center justify-center w-5 h-5 text-text-tertiary
                             hover:text-text-primary transition-colors duration-[var(--duration-fast)]"
                >
                  <span className="sr-only">Settings</span>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                to="/settings"
                className="text-xs text-text-tertiary hover:text-text-primary transition-colors duration-[var(--duration-fast)]"
              >
                Settings
              </Link>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
