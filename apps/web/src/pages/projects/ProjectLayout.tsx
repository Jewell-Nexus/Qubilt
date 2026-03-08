import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { cn } from '@/lib/cn';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { LayoutDashboard } from 'lucide-react';
import { ExtensionSlot } from '@/shell/ExtensionSlot';

interface Project {
  id: string;
  name: string;
  identifier: string;
  icon: string;
  color: string;
}

export function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => get<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  });

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Project secondary sidebar */}
      <aside className="w-[200px] flex-shrink-0 border-r border-border-default bg-surface-base overflow-y-auto">
        <div className="px-3 py-4">
          {project && (
            <div className="flex items-center gap-2 mb-4 px-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: project.color + '20', color: project.color }}
              >
                <LucideIcon name={project.icon || 'Folder'} size={14} />
              </div>
              <span className="text-sm font-semibold text-text-primary truncate">{project.name}</span>
            </div>
          )}
          <nav className="space-y-0.5">
            <NavLink
              to={`/projects/${projectId}`}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors duration-[var(--duration-fast)]',
                  isActive
                    ? 'bg-accent-subtle text-accent-subtle-text font-medium'
                    : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
                )
              }
            >
              <LayoutDashboard size={15} />
              Overview
            </NavLink>
            {/* Module nav items will be injected here by each module */}
            <ExtensionSlot name="project.sidebar.nav" context={{ projectId }} />
          </nav>
        </div>
      </aside>

      {/* Project content */}
      <div className="flex-1 overflow-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
