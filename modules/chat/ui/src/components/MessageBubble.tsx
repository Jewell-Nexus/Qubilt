import { useState } from 'react';
import { format } from 'date-fns';
import {
  SmilePlus,
  Reply,
  Pencil,
  Pin,
  MoreHorizontal,
  ThumbsUp,
  Heart,
  Laugh,
  Frown,
  HandHelping,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatMessage } from '../types/chat.types';
import UserAvatar from './UserAvatar';
import { getChatSocket } from '../lib/chat-socket';

const QUICK_REACTIONS = [
  { emoji: '👍', Icon: ThumbsUp },
  { emoji: '❤️', Icon: Heart },
  { emoji: '😂', Icon: Laugh },
  { emoji: '😮', Icon: Frown },
  { emoji: '😢', Icon: Frown },
  { emoji: '🙏', Icon: HandHelping },
];

interface MessageBubbleProps {
  message: ChatMessage;
  isFirstInGroup: boolean;
  authorName: string;
  onReply?: () => void;
  onEdit?: () => void;
  onReactionPick?: (messageId: string) => void;
  onThreadClick?: (threadId: string) => void;
}

export default function MessageBubble({
  message,
  isFirstInGroup,
  authorName,
  onReply,
  onEdit,
  onReactionPick,
  onThreadClick,
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);
  const userId = useAuthStore((s) => s.user?.id);
  const isOwn = message.userId === userId;

  if (message.deletedAt) {
    return (
      <div className="px-4 py-1">
        <p className="text-sm italic text-text-tertiary">This message was deleted</p>
      </div>
    );
  }

  const handleQuickReaction = (emoji: string) => {
    const socket = getChatSocket();
    if (socket?.connected) {
      socket.emit('reaction:toggle', { messageId: message.id, emoji });
    }
  };

  const timestamp = format(new Date(message.createdAt), 'HH:mm');
  const fullTimestamp = format(new Date(message.createdAt), 'PPpp');

  return (
    <div
      className={cn('group relative px-4 hover:bg-surface-hover', isFirstInGroup ? 'mt-3' : 'mt-0.5')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex gap-3">
        {/* Avatar or spacer */}
        <div className="w-8 shrink-0 pt-0.5">
          {isFirstInGroup ? (
            <UserAvatar name={authorName} size="md" />
          ) : (
            <span
              className="hidden group-hover:block text-[10px] text-text-tertiary leading-5 text-center w-full"
              title={fullTimestamp}
            >
              {timestamp}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Author + timestamp header */}
          {isFirstInGroup && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-sm font-semibold text-text-primary">{authorName}</span>
              <span className="text-xs text-text-tertiary" title={fullTimestamp}>
                {timestamp}
              </span>
            </div>
          )}

          {/* Message content */}
          <div className="text-sm text-text-primary leading-relaxed">
            <MessageContent content={message.content} textContent={message.textContent} />
            {message.isEdited && (
              <span className="text-xs text-text-tertiary ml-1">(edited)</span>
            )}
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {message.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent-default hover:underline flex items-center gap-1 bg-surface-raised px-2 py-1 rounded"
                >
                  {att.fileName}
                </a>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactionCounts && message.reactionCounts.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactionCounts.map((r) => {
                const hasReacted = userId ? r.userIds.includes(userId) : false;
                return (
                  <button
                    key={r.emoji}
                    onClick={() => handleQuickReaction(r.emoji)}
                    className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border',
                      hasReacted
                        ? 'bg-accent-subtle border-accent-default text-accent-default'
                        : 'bg-surface-raised border-border-default text-text-secondary hover:border-border-hover',
                    )}
                  >
                    <span>{r.emoji}</span>
                    <span>{r.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Thread reply count */}
          {(message.threadReplyCount ?? 0) > 0 && (
            <button
              onClick={() => onThreadClick?.(message.id)}
              className="text-xs text-accent-default hover:underline mt-1"
            >
              {message.threadReplyCount} {message.threadReplyCount === 1 ? 'reply' : 'replies'} →
            </button>
          )}
        </div>
      </div>

      {/* Hover toolbar */}
      {hovered && (
        <div className="absolute -top-3 right-4 flex items-center gap-0.5 bg-surface-overlay border border-border-default rounded-md shadow-sm px-1 py-0.5 z-10">
          {QUICK_REACTIONS.slice(0, 3).map(({ emoji }) => (
            <button
              key={emoji}
              onClick={() => handleQuickReaction(emoji)}
              className="p-1 hover:bg-surface-hover rounded text-sm"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => onReactionPick?.(message.id)}
            className="p-1 hover:bg-surface-hover rounded text-text-secondary"
            title="Pick emoji"
          >
            <SmilePlus className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-border-default mx-0.5" />
          <button
            onClick={onReply}
            className="p-1 hover:bg-surface-hover rounded text-text-secondary"
            title="Reply in thread"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          {isOwn && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-surface-hover rounded text-text-secondary"
              title="Edit message"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            className="p-1 hover:bg-surface-hover rounded text-text-secondary"
            title="Pin message"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 hover:bg-surface-hover rounded text-text-secondary"
            title="More actions"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function MessageContent({ content, textContent }: { content: unknown; textContent: string }) {
  // If content is TipTap JSON, try to render it; fallback to textContent
  if (content && typeof content === 'object' && 'type' in (content as Record<string, unknown>)) {
    return <TipTapRenderer node={content as TipTapNode} />;
  }
  return <>{textContent}</>;
}

interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
}

function TipTapRenderer({ node }: { node: TipTapNode }) {
  if (node.type === 'text') {
    let element: React.ReactNode = node.text ?? '';
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            element = <strong>{element}</strong>;
            break;
          case 'italic':
            element = <em>{element}</em>;
            break;
          case 'code':
            element = <code className="bg-surface-raised px-1 py-0.5 rounded text-[13px]">{element}</code>;
            break;
          case 'strike':
            element = <s>{element}</s>;
            break;
          case 'link':
            element = (
              <a
                href={mark.attrs?.href as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-default hover:underline"
              >
                {element}
              </a>
            );
            break;
        }
      }
    }
    return <>{element}</>;
  }

  const children = node.content?.map((child, i) => (
    <TipTapRenderer key={i} node={child} />
  ));

  switch (node.type) {
    case 'doc':
      return <>{children}</>;
    case 'paragraph':
      return <p className="min-h-[1.375rem]">{children ?? <br />}</p>;
    case 'bulletList':
      return <ul className="list-disc pl-4 my-1">{children}</ul>;
    case 'orderedList':
      return <ol className="list-decimal pl-4 my-1">{children}</ol>;
    case 'listItem':
      return <li>{children}</li>;
    case 'codeBlock':
      return (
        <pre className="bg-surface-raised rounded p-2 my-1 text-[13px] overflow-x-auto">
          <code>{children}</code>
        </pre>
      );
    case 'blockquote':
      return <blockquote className="border-l-2 border-border-default pl-3 my-1 text-text-secondary">{children}</blockquote>;
    case 'mention':
      return (
        <span className="text-accent-default font-medium">
          @{(node.attrs?.label as string) ?? (node.attrs?.id as string)}
        </span>
      );
    case 'hardBreak':
      return <br />;
    default:
      return <>{children}</>;
  }
}
