import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown } from 'lucide-react';
import { useMessages } from '../hooks/use-chat-queries';
import { groupMessages } from './MessageGroup';
import MessageBubble from './MessageBubble';
import type { ChatMessage } from '../types/chat.types';

interface MessageListProps {
  channelId: string;
  onThreadClick: (threadId: string) => void;
  onEditMessage: (message: ChatMessage) => void;
  onReactionPick: (messageId: string) => void;
}

interface FlatItem {
  type: 'date-divider' | 'message';
  key: string;
  date?: string;
  message?: ChatMessage;
  isFirstInGroup?: boolean;
  authorName?: string;
}

function flattenMessages(messages: ChatMessage[]): FlatItem[] {
  const items: FlatItem[] = [];
  const groups = groupMessages(messages);
  let lastDate = '';

  for (const group of groups) {
    for (let i = 0; i < group.messages.length; i++) {
      const msg = group.messages[i]!;
      const msgDate = new Date(msg.createdAt).toDateString();

      if (msgDate !== lastDate) {
        items.push({
          type: 'date-divider',
          key: `date-${msgDate}`,
          date: new Date(msg.createdAt).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          }),
        });
        lastDate = msgDate;
      }

      items.push({
        type: 'message',
        key: msg.id,
        message: msg,
        isFirstInGroup: i === 0,
        authorName: group.authorName,
      });
    }
  }

  return items;
}

export default function MessageList({ channelId, onThreadClick, onEditMessage, onReactionPick }: MessageListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useMessages(channelId);

  const [showNewBanner, setShowNewBanner] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);

  const allMessages = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const flatItems = useMemo(() => flattenMessages(allMessages), [allMessages]);

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = flatItems[index];
      if (item?.type === 'date-divider') return 40;
      if (item?.isFirstInGroup) return 56;
      return 28;
    },
    overscan: 20,
  });

  // Check if user is at bottom
  const checkAtBottom = useCallback(() => {
    const el = parentRef.current;
    if (!el) return false;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (flatItems.length > 0) {
      virtualizer.scrollToIndex(flatItems.length - 1, { align: 'end' });
      setShowNewBanner(false);
    }
  }, [flatItems.length, virtualizer]);

  // Scroll to bottom on initial load or channel switch
  useEffect(() => {
    if (allMessages.length > 0 && prevMessageCountRef.current === 0) {
      requestAnimationFrame(() => scrollToBottom());
    }
    prevMessageCountRef.current = allMessages.length;
  }, [channelId, allMessages.length, scrollToBottom]);

  // Handle new messages: scroll if at bottom, show banner if not
  useEffect(() => {
    if (allMessages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
      if (wasAtBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom());
      } else {
        setShowNewBanner(true);
      }
    }
    prevMessageCountRef.current = allMessages.length;
  }, [allMessages.length, scrollToBottom]);

  // Update wasAtBottom on scroll
  const handleScroll = useCallback(() => {
    wasAtBottomRef.current = checkAtBottom();
    if (wasAtBottomRef.current) {
      setShowNewBanner(false);
    }

    // Load more when scrolled to top
    const el = parentRef.current;
    if (el && el.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      const prevHeight = el.scrollHeight;
      fetchNextPage().then(() => {
        // Maintain scroll position after prepending
        requestAnimationFrame(() => {
          const newHeight = el.scrollHeight;
          el.scrollTop = newHeight - prevHeight;
        });
      });
    }
  }, [checkAtBottom, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={parentRef}
        className="h-full overflow-y-auto"
        onScroll={handleScroll}
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-3">
            <div className="w-4 h-4 border-2 border-border-default border-t-accent-default rounded-full animate-spin" />
          </div>
        )}

        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = flatItems[virtualItem.index];
            if (!item) return null;

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {item.type === 'date-divider' ? (
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="flex-1 border-t border-border-default" />
                    <span className="text-xs text-text-tertiary font-medium">{item.date}</span>
                    <div className="flex-1 border-t border-border-default" />
                  </div>
                ) : (
                  <MessageBubble
                    message={item.message!}
                    isFirstInGroup={item.isFirstInGroup!}
                    authorName={item.authorName!}
                    onReply={() => onThreadClick(item.message!.id)}
                    onEdit={() => onEditMessage(item.message!)}
                    onReactionPick={onReactionPick}
                    onThreadClick={onThreadClick}
                  />
                )}
              </div>
            );
          })}
        </div>

        {allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <p className="text-lg font-medium mb-1">No messages yet</p>
            <p className="text-sm">Be the first to send a message!</p>
          </div>
        )}
      </div>

      {/* New messages banner */}
      {showNewBanner && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-accent-default text-white rounded-full shadow-md text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          New messages
        </button>
      )}
    </div>
  );
}
