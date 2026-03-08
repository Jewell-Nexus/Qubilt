import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { usePages, useCreatePage, useMovePage } from '../hooks/use-wiki-queries';
import WikiTreeNode from './WikiTreeNode';
import WikiSearch from './WikiSearch';
import type { WikiPageTreeNode } from '../types/wiki.types';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';

export default function WikiSidebar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const workspaceId = user?.id ? 'default' : '';

  const { data: pages } = usePages(workspaceId);
  const createPage = useCreatePage();
  const movePage = useMovePage();

  const [searchOpen, setSearchOpen] = useState(false);
  const [activeNode, setActiveNode] = useState<WikiPageTreeNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleNewPage = useCallback(async () => {
    try {
      const result = await createPage.mutateAsync({
        workspaceId,
        title: 'Untitled',
      });
      const page = (result as unknown as { data: { id: string } }).data;
      navigate(`/wiki/${page.id}`);
    } catch {
      // handled by query error
    }
  }, [createPage, workspaceId, navigate]);

  const handleNewChild = useCallback(async (parentId: string) => {
    try {
      const result = await createPage.mutateAsync({
        workspaceId,
        parentId,
        title: 'Untitled',
      });
      const page = (result as unknown as { data: { id: string } }).data;
      navigate(`/wiki/${page.id}`);
    } catch {
      // handled by query error
    }
  }, [createPage, workspaceId, navigate]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const node = findNodeById(pages ?? [], String(event.active.id));
    setActiveNode(node ?? null);
  }, [pages]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveNode(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    movePage.mutate({
      id: String(active.id),
      dto: { newParentId: String(over.id), afterId: null },
    });
  }, [movePage]);

  const tree = (pages as unknown as { data: WikiPageTreeNode[] })?.data ?? pages ?? [];

  return (
    <>
      <aside className="w-[280px] border-r border-border-default bg-surface-default flex flex-col h-full shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border-default">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#F59E0B]" />
            <span className="text-sm font-semibold text-text-primary">Wiki</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 rounded-md text-text-secondary hover:bg-surface-sunken hover:text-text-primary transition-colors duration-[var(--duration-fast)]"
              title="Search pages"
            >
              <Search size={14} />
            </button>
            <button
              onClick={handleNewPage}
              className="p-1.5 rounded-md text-text-secondary hover:bg-surface-sunken hover:text-text-primary transition-colors duration-[var(--duration-fast)]"
              title="New page"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto py-1.5 px-1.5">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {Array.isArray(tree) && tree.map((node: WikiPageTreeNode) => (
              <WikiTreeNode
                key={node.id}
                page={node}
                depth={0}
                onAddChild={handleNewChild}
              />
            ))}
            <DragOverlay>
              {activeNode ? (
                <div className="bg-surface-overlay shadow-2 rounded-md px-2 py-1.5 text-sm text-text-primary">
                  {activeNode.icon || '📄'} {activeNode.title}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* New page button at bottom */}
          <button
            onClick={handleNewPage}
            className="flex items-center gap-2 w-full px-2 py-1.5 mt-1 rounded-md text-sm text-text-tertiary hover:bg-surface-sunken hover:text-text-primary transition-colors duration-[var(--duration-fast)]"
          >
            <Plus size={14} />
            New page
          </button>
        </div>
      </aside>

      {searchOpen && (
        <WikiSearch
          workspaceId={workspaceId}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </>
  );
}

function findNodeById(nodes: WikiPageTreeNode[], id: string): WikiPageTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}
