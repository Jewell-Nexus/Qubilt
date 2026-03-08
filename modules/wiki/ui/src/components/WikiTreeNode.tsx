import { useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ChevronRight, Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDeletePage } from '../hooks/use-wiki-queries';
import type { WikiPageTreeNode as TreeNodeType } from '../types/wiki.types';

interface WikiTreeNodeProps {
  page: TreeNodeType;
  depth: number;
  onAddChild: (parentId: string) => void;
}

export default function WikiTreeNode({ page, depth, onAddChild }: WikiTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deletePage = useDeletePage();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => !prev);
  }, []);

  const handleDelete = useCallback(() => {
    deletePage.mutate(page.id);
    setShowDeleteConfirm(false);
  }, [deletePage, page.id]);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <NavLink
        to={`/wiki/${page.id}`}
        className={({ isActive }) =>
          cn(
            'group flex items-center gap-1 w-full px-1.5 py-1 rounded-md text-sm transition-colors duration-[var(--duration-fast)]',
            isActive
              ? 'bg-[#F59E0B]/10 text-[#F59E0B] font-medium'
              : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
          )
        }
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => { setShowActions(false); setShowDeleteConfirm(false); }}
        {...listeners}
      >
        {/* Expand/collapse */}
        {page.childCount > 0 ? (
          <button
            onClick={handleToggle}
            className="p-0.5 rounded hover:bg-surface-sunken shrink-0"
          >
            <ChevronRight
              size={12}
              className={cn(
                'transition-transform duration-[var(--duration-fast)]',
                expanded && 'rotate-90',
              )}
            />
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        <span className="shrink-0 text-xs leading-none">
          {page.icon || '📄'}
        </span>

        {/* Title */}
        <span className="truncate flex-1">{page.title}</span>

        {/* Hover actions */}
        {showActions && !showDeleteConfirm && (
          <span className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.preventDefault()}>
            <button
              onClick={(e) => { e.preventDefault(); onAddChild(page.id); }}
              className="p-0.5 rounded hover:bg-surface-sunken text-text-tertiary hover:text-text-primary"
              title="Add sub-page"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setShowDeleteConfirm(true); }}
              className="p-0.5 rounded hover:bg-surface-sunken text-text-tertiary hover:text-text-primary"
              title="More actions"
            >
              <MoreHorizontal size={12} />
            </button>
          </span>
        )}

        {showDeleteConfirm && (
          <span className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.preventDefault()}>
            <button
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              className="p-0.5 rounded hover:bg-red-100 text-red-500"
              title="Delete page"
            >
              <Trash2 size={12} />
            </button>
          </span>
        )}
      </NavLink>

      {/* Children */}
      {expanded && page.children?.length > 0 && (
        <div>
          {page.children.map((child) => (
            <WikiTreeNode
              key={child.id}
              page={child}
              depth={depth + 1}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}
