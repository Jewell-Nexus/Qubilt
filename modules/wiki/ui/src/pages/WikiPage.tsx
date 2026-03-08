import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { History, Lock, Unlock, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { usePage, useUpdatePage } from '../hooks/use-wiki-queries';
import WikiEditor from '../components/editor/WikiEditor';

function formatTimeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function readingTime(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

export default function WikiPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { data: pageData, isLoading } = usePage(pageId ?? '');
  const updatePage = useUpdatePage();

  const page = (pageData as unknown as { data: typeof pageData })?.data ?? pageData;

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (page?.title) {
      setTitleValue(page.title);
    }
  }, [page?.title]);

  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [editingTitle]);

  const handleTitleBlur = useCallback(() => {
    setEditingTitle(false);
    if (pageId && titleValue && titleValue !== page?.title) {
      updatePage.mutate({ id: pageId, dto: { title: titleValue } });
    }
  }, [pageId, titleValue, page?.title, updatePage]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  const handleToggleLock = useCallback(() => {
    if (!pageId || !page) return;
    updatePage.mutate(
      { id: pageId, dto: { isLocked: !page.isLocked } },
      { onSuccess: () => toast.success(page.isLocked ? 'Page unlocked' : 'Page locked') },
    );
  }, [pageId, page, updatePage]);

  const handleIconChange = useCallback((icon: string) => {
    if (!pageId) return;
    updatePage.mutate({ id: pageId, dto: { icon } });
  }, [pageId, updatePage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-tertiary">
        <FileText size={32} className="mb-2" />
        <p className="text-sm">Select a page from the sidebar</p>
      </div>
    );
  }

  const wordCount = page.currentVersion?.wordCount ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-12 py-8">
      {/* Cover image placeholder */}
      {page.coverUrl && (
        <div className="w-full h-48 rounded-lg mb-6 overflow-hidden">
          <img
            src={page.coverUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Page header */}
      <div className="mb-6">
        {/* Icon */}
        <button
          onClick={() => {
            const emojis = ['📄', '📝', '📋', '📌', '📎', '📚', '🔖', '💡', '🎯', '⭐', '🚀', '🔧', '📊', '🗂️', '✅'];
            const next = emojis[(emojis.indexOf(page.icon ?? '📄') + 1) % emojis.length] ?? '📄';
            handleIconChange(next);
          }}
          className="text-4xl mb-2 hover:bg-surface-sunken rounded-md p-1 transition-colors duration-[var(--duration-fast)] inline-block"
          title="Change icon"
        >
          {page.icon || '📄'}
        </button>

        {/* Title */}
        {editingTitle ? (
          <input
            ref={titleRef}
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="w-full text-4xl font-extrabold text-text-primary bg-transparent outline-none leading-tight"
          />
        ) : (
          <h1
            onClick={() => setEditingTitle(true)}
            className="text-4xl font-extrabold text-text-primary leading-tight cursor-text"
          >
            {page.title}
          </h1>
        )}

        {/* Metadata bar */}
        <div className="flex items-center gap-4 mt-3 text-xs text-text-tertiary">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Last edited {formatTimeAgo(page.updatedAt)}
          </span>
          {wordCount > 0 && (
            <>
              <span>{wordCount.toLocaleString()} words</span>
              <span>{readingTime(wordCount)}</span>
            </>
          )}
          <div className="flex-1" />
          <button
            onClick={() => navigate(`/wiki/${pageId}/history`)}
            className="flex items-center gap-1 hover:text-text-primary transition-colors"
            title="Version history"
          >
            <History size={12} />
            History
          </button>
          <button
            onClick={handleToggleLock}
            className={cn(
              'flex items-center gap-1 hover:text-text-primary transition-colors',
              page.isLocked && 'text-[#F59E0B]',
            )}
            title={page.isLocked ? 'Unlock page' : 'Lock page'}
          >
            {page.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
            {page.isLocked ? 'Locked' : 'Lock'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="wiki-editor-area" style={{ lineHeight: 1.7 }}>
        <WikiEditor
          pageId={pageId ?? ''}
          initialContent={page.currentVersion?.content}
          isLocked={page.isLocked}
        />
      </div>
    </div>
  );
}
