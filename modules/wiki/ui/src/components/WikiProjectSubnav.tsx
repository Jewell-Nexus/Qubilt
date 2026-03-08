import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { BookOpen } from 'lucide-react';

interface WikiProjectSubnavProps {
  projectId?: string;
}

export default function WikiProjectSubnav({ projectId }: WikiProjectSubnavProps) {
  if (!projectId) return null;

  return (
    <NavLink
      to={`/projects/${projectId}/wiki`}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors duration-[var(--duration-fast)]',
          isActive
            ? 'bg-accent-subtle text-accent-subtle-text font-medium'
            : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
        )
      }
    >
      <BookOpen size={15} />
      Wiki
    </NavLink>
  );
}
