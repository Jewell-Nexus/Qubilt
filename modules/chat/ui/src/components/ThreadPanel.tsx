import { useMemo, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useThread } from '../hooks/use-chat-queries';
import { groupMessages } from './MessageGroup';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import type { ChatMessage } from '../types/chat.types';

interface ThreadPanelProps {
  threadId: string;
  channelName: string;
  onClose: () => void;
}

export default function ThreadPanel({ threadId, channelName, onClose }: ThreadPanelProps) {
  const { data, isLoading, isFetchingNextPage } = useThread(threadId);
  const parentRef = useRef<HTMLDivElement>(null);

  const allMessages = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const groups = useMemo(() => groupMessages(allMessages), [allMessages]);

  // Flatten into items for rendering
  const flatItems = useMemo(() => {
    const items: Array<{ message: ChatMessage; isFirstInGroup: boolean; authorName: string }> = [];
    for (const group of groups) {
      for (let i = 0; i < group.messages.length; i++) {
        items.push({
          message: group.messages[i]!,
          isFirstInGroup: i === 0,
          authorName: group.authorName,
        });
      }
    }
    return items;
  }, [groups]);

  const parentMessage = allMessages[0];

  // Auto-scroll to bottom on new replies
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [allMessages.length]);

  return (
    <div className="w-80 h-full flex flex-col border-l border-border-default bg-surface-default">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border-default shrink-0">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-text-primary">Thread</span>
          {parentMessage && (
            <p className="text-xs text-text-tertiary truncate">
              {parentMessage.textContent.slice(0, 50)}
              {parentMessage.textContent.length > 50 ? '...' : ''}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-hover text-text-secondary shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Thread messages */}
      <div ref={parentRef} className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-4 h-4 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <div className="w-3 h-3 border-2 border-border-default border-t-accent-default rounded-full animate-spin" />
              </div>
            )}

            {/* Parent message has a divider after it */}
            {flatItems.map((item, index) => (
              <div key={item.message.id}>
                <MessageBubble
                  message={item.message}
                  isFirstInGroup={item.isFirstInGroup}
                  authorName={item.authorName}
                />
                {index === 0 && flatItems.length > 1 && (
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="flex-1 border-t border-border-default" />
                    <span className="text-[10px] text-text-tertiary">
                      {allMessages.length - 1} {allMessages.length === 2 ? 'reply' : 'replies'}
                    </span>
                    <div className="flex-1 border-t border-border-default" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Composer */}
      <MessageComposer
        channelId={parentMessage?.channelId ?? ''}
        channelName={channelName}
        threadId={threadId}
        placeholder="Reply in thread..."
      />
    </div>
  );
}
