import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarItemProps {
  to: string;
  icon: string;
  label: string;
  accentColor?: string;
  badge?: string | number;
  collapsed?: boolean;
}

export function SidebarItem({ to, icon, label, accentColor, badge, collapsed }: SidebarItemProps) {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + '/');

  const content = (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer relative',
        'transition-colors duration-[var(--duration-fast)]',
        active
          ? 'bg-sidebar-item-active-bg text-sidebar-item-active-text'
          : 'text-text-secondary hover:bg-sidebar-item-hover hover:text-text-primary',
      )}
    >
      {active && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
          style={{ backgroundColor: accentColor || 'var(--accent-default)' }}
        />
      )}

      <div
        className={cn(
          'w-5 h-5 flex-shrink-0 flex items-center justify-center rounded',
          active && 'text-[var(--_accent)]',
        )}
        style={active && accentColor ? { '--_accent': accentColor } as React.CSSProperties : undefined}
      >
        <LucideIcon name={icon} size={16} />
      </div>

      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
      {!collapsed && badge != null && (
        <Badge variant="secondary" className="ml-auto text-xs">
          {badge}
        </Badge>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div />}>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
