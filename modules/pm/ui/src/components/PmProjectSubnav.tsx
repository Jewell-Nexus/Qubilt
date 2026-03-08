import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import {
  ListTodo,
  Columns3,
  GanttChart,
  Layers,
  Calendar,
  Users,
  Clock,
  Wallet,
} from 'lucide-react';

interface PmProjectSubnavProps {
  projectId?: string;
}

const NAV_ITEMS = [
  { to: 'work-packages', label: 'Work Packages', icon: ListTodo },
  { to: 'boards', label: 'Boards', icon: Columns3 },
  { to: 'gantt', label: 'Gantt', icon: GanttChart },
  { to: 'backlog', label: 'Backlog', icon: Layers },
  { to: 'calendar', label: 'Calendar', icon: Calendar },
  { to: 'team-planner', label: 'Team Planner', icon: Users },
  { to: 'time', label: 'Time', icon: Clock },
  { to: 'budgets', label: 'Budgets', icon: Wallet },
] as const;

export default function PmProjectSubnav({ projectId }: PmProjectSubnavProps) {
  if (!projectId) return null;

  return (
    <>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={`/projects/${projectId}/${to}`}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors duration-[var(--duration-fast)]',
              isActive
                ? 'bg-accent-subtle text-accent-subtle-text font-medium'
                : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
            )
          }
        >
          <Icon size={15} />
          {label}
        </NavLink>
      ))}
    </>
  );
}
