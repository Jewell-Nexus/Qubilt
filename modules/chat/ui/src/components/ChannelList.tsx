import { useState, useMemo } from 'react';
import { Hash, Lock, Plus, ChevronDown, ChevronRight, Search, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ChannelWithMeta } from '../types/chat.types';
import { useChatStore } from '../hooks/use-chat-store';

interface ChannelListProps {
  channels: ChannelWithMeta[];
  onCreateChannel: () => void;
  onCreateDm: () => void;
  onSearch: () => void;
}

export default function ChannelList({ channels, onCreateChannel, onCreateDm, onSearch }: ChannelListProps) {
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);
  const activeChannelId = useChatStore((s) => s.activeChannelId);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);
  const onlineUsers = useChatStore((s) => s.onlineUsers);

  const { publicChannels, privateChannels, dmChannels } = useMemo(() => {
    const pub: ChannelWithMeta[] = [];
    const priv: ChannelWithMeta[] = [];
    const dm: ChannelWithMeta[] = [];
    for (const ch of channels) {
      if (ch.type === 'DIRECT') dm.push(ch);
      else if (ch.type === 'PRIVATE') priv.push(ch);
      else pub.push(ch);
    }
    pub.sort((a, b) => a.name.localeCompare(b.name));
    priv.sort((a, b) => a.name.localeCompare(b.name));
    dm.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? a.createdAt;
      const bTime = b.lastMessage?.createdAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    return { publicChannels: pub, privateChannels: priv, dmChannels: dm };
  }, [channels]);

  const allChannels = [...publicChannels, ...privateChannels];

  return (
    <div className="w-60 h-full flex flex-col border-r border-border-default bg-surface-default">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border-default shrink-0">
        <span className="text-sm font-semibold text-text-primary truncate">Chat</span>
        <button
          onClick={onSearch}
          className="p-1 rounded hover:bg-surface-hover text-text-secondary"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable channel list */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Channels section */}
        <SectionHeader
          label="Channels"
          open={channelsOpen}
          onToggle={() => setChannelsOpen(!channelsOpen)}
        />
        {channelsOpen && (
          <>
            {allChannels.map((ch) => (
              <ChannelItem
                key={ch.id}
                channel={ch}
                isActive={ch.id === activeChannelId}
                onClick={() => setActiveChannel(ch.id)}
              />
            ))}
            <button
              onClick={onCreateChannel}
              className="flex items-center gap-2 px-4 py-1 text-xs text-text-tertiary hover:text-text-secondary w-full"
            >
              <Plus className="w-3.5 h-3.5" />
              New channel
            </button>
          </>
        )}

        {/* DMs section */}
        <SectionHeader
          label="Direct Messages"
          open={dmsOpen}
          onToggle={() => setDmsOpen(!dmsOpen)}
        />
        {dmsOpen && (
          <>
            {dmChannels.map((ch) => (
              <DmItem
                key={ch.id}
                channel={ch}
                isActive={ch.id === activeChannelId}
                isOnline={ch.isOnline || onlineUsers.has(ch.name)}
                onClick={() => setActiveChannel(ch.id)}
              />
            ))}
            <button
              onClick={onCreateDm}
              className="flex items-center gap-2 px-4 py-1 text-xs text-text-tertiary hover:text-text-secondary w-full"
            >
              <Plus className="w-3.5 h-3.5" />
              New DM
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider w-full hover:bg-surface-hover"
    >
      {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      {label}
    </button>
  );
}

function ChannelItem({
  channel,
  isActive,
  onClick,
}: {
  channel: ChannelWithMeta;
  isActive: boolean;
  onClick: () => void;
}) {
  const hasUnread = channel.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1 mx-1 rounded text-sm w-[calc(100%-8px)] text-left',
        isActive
          ? 'bg-[color:var(--module-chat-accent,#10B981)]/10 text-text-primary'
          : 'text-text-secondary hover:bg-surface-hover',
        hasUnread && !isActive && 'text-text-primary font-semibold',
      )}
    >
      {channel.type === 'PRIVATE' ? (
        <Lock className="w-3.5 h-3.5 shrink-0 text-text-tertiary" />
      ) : (
        <Hash className="w-3.5 h-3.5 shrink-0 text-text-tertiary" />
      )}
      <span className="truncate flex-1">{channel.name}</span>
      {hasUnread && <UnreadBadge count={channel.unreadCount} />}
    </button>
  );
}

function DmItem({
  channel,
  isActive,
  isOnline,
  onClick,
}: {
  channel: ChannelWithMeta;
  isActive: boolean;
  isOnline: boolean;
  onClick: () => void;
}) {
  const hasUnread = channel.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1 mx-1 rounded text-sm w-[calc(100%-8px)] text-left',
        isActive
          ? 'bg-[color:var(--module-chat-accent,#10B981)]/10 text-text-primary'
          : 'text-text-secondary hover:bg-surface-hover',
        hasUnread && !isActive && 'text-text-primary font-semibold',
      )}
    >
      <div className="relative shrink-0">
        <MessageCircle className="w-3.5 h-3.5 text-text-tertiary" />
        {isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-surface-default" />
        )}
      </div>
      <span className="truncate flex-1">{channel.name}</span>
      {hasUnread && <UnreadBadge count={channel.unreadCount} />}
    </button>
  );
}

function UnreadBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[color:var(--module-chat-accent,#10B981)] text-white text-[10px] font-bold">
      {count > 9 ? '9+' : count}
    </span>
  );
}
