import { useState } from 'react';
import { Hash, Lock, Users, Search, Pin, MessageSquare } from 'lucide-react';
import type { ChannelWithMeta, ChatMessage } from '../types/chat.types';
import { useMembers } from '../hooks/use-chat-queries';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';

interface MessageAreaProps {
  channel: ChannelWithMeta;
  onToggleThread: () => void;
  onThreadClick: (threadId: string) => void;
}

export default function MessageArea({ channel, onToggleThread, onThreadClick }: MessageAreaProps) {
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const { data: members } = useMembers(channel.id);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border-default shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {channel.type === 'PRIVATE' ? (
            <Lock className="w-4 h-4 text-text-tertiary shrink-0" />
          ) : channel.type === 'PUBLIC' ? (
            <Hash className="w-4 h-4 text-text-tertiary shrink-0" />
          ) : null}
          <span className="font-semibold text-sm text-text-primary truncate">{channel.name}</span>
          {channel.description && (
            <>
              <span className="text-text-tertiary mx-1">|</span>
              <span className="text-xs text-text-secondary truncate">{channel.description}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {members && (
            <span className="flex items-center gap-1 text-xs text-text-secondary mr-2">
              <Users className="w-3.5 h-3.5" />
              {members.length}
            </span>
          )}
          <button className="p-1.5 rounded hover:bg-surface-hover text-text-secondary" title="Search">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-surface-hover text-text-secondary" title="Pinned messages">
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleThread}
            className="p-1.5 rounded hover:bg-surface-hover text-text-secondary"
            title="Threads"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        channelId={channel.id}
        onThreadClick={onThreadClick}
        onEditMessage={setEditingMessage}
        onReactionPick={() => {}}
      />

      {/* Composer */}
      <MessageComposer
        channelId={channel.id}
        channelName={channel.name}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
}
