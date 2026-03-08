import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { RotateCcw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useVersions, useRestoreVersion, usePage } from '../hooks/use-wiki-queries';
import DiffViewer from '../components/editor/DiffViewer';
import type { WikiPageVersion } from '../types/wiki.types';

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VersionHistory() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  const { data: pageData } = usePage(pageId ?? '');
  const page = (pageData as unknown as { data: typeof pageData })?.data ?? pageData;

  const { data: versionsData } = useVersions(pageId ?? '');
  const versions: WikiPageVersion[] =
    (versionsData as unknown as { data: WikiPageVersion[] })?.data ?? [];

  const restoreVersion = useRestoreVersion(pageId ?? '');

  const [selectedVersion, setSelectedVersion] = useState<WikiPageVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<WikiPageVersion | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const handleRestore = useCallback(async (versionId: string) => {
    try {
      await restoreVersion.mutateAsync(versionId);
      toast.success('Version restored');
      navigate(`/wiki/${pageId}`);
    } catch {
      toast.error('Failed to restore version');
    }
  }, [restoreVersion, navigate, pageId]);

  // Auto-select first two versions for diff
  const versionA = compareVersion ?? versions[1] ?? null;
  const versionB = selectedVersion ?? versions[0] ?? null;

  return (
    <div className="flex h-full">
      {/* Left panel: version timeline */}
      <div className="w-[320px] border-r border-border-default bg-surface-default overflow-y-auto shrink-0">
        <div className="px-4 py-3 border-b border-border-default">
          <h2 className="text-sm font-semibold text-text-primary">Version History</h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            {page?.title ?? 'Page'}
          </p>
        </div>

        <div className="py-1">
          {versions.map((version) => (
            <button
              key={version.id}
              onClick={() => {
                if (selectedVersion?.id === version.id) {
                  setCompareVersion(version);
                } else {
                  setSelectedVersion(version);
                }
              }}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-border-default transition-colors',
                selectedVersion?.id === version.id
                  ? 'bg-[#F59E0B]/10'
                  : compareVersion?.id === version.id
                    ? 'bg-surface-sunken'
                    : 'hover:bg-surface-sunken',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">
                  v{version.version}
                </span>
                {confirmRestore === version.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestore(version.id); }}
                      className="text-xs px-2 py-0.5 bg-[#F59E0B] text-white rounded hover:bg-[#D97706]"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmRestore(null); }}
                      className="text-xs px-2 py-0.5 text-text-tertiary hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmRestore(version.id); }}
                    className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-sunken"
                    title="Restore this version"
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {formatDate(version.createdAt)}
                </span>
              </div>
              {version.summary && (
                <p className="text-xs text-text-secondary mt-1">{version.summary}</p>
              )}
            </button>
          ))}

          {versions.length === 0 && (
            <div className="px-4 py-8 text-sm text-text-tertiary text-center">
              No version history yet
            </div>
          )}
        </div>
      </div>

      {/* Right panel: diff viewer */}
      <div className="flex-1 overflow-y-auto p-6">
        {versionA && versionB ? (
          <DiffViewer
            contentA={versionA.content as string}
            contentB={versionB.content as string}
            labelA={`v${versionA.version}`}
            labelB={`v${versionB.version}`}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-text-tertiary text-sm">
            Select two versions to compare
          </div>
        )}
      </div>
    </div>
  );
}
