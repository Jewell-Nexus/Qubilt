import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useChannels } from '../hooks/use-chat-queries';
import UserAvatar from '../components/UserAvatar';
import type { ChannelWithMeta } from '../types/chat.types';

export default function RecentMessagesWidget() {
  const navigate = useNavigate();
  // TODO: Get workspaceId from context
  const { data: channels, isLoading } = useChannels('default');

  // Get channels with recent messages, sorted by last message time
  const recentChannels = (channels ?? [])
    .filter((ch): ch is ChannelWithMeta & { lastMessage: NonNullable<ChannelWithMeta['lastMessage']> } => !!ch.lastMessage)
    .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-4 h-4 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (recentChannels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
        No recent messages
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {recentChannels.map((ch) => (
        <button
          key={ch.id}
          onClick={() => navigate(`/chat?channel=${ch.id}`)}
          className="flex items-start gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-surface-hover text-left"
        >
          <UserAvatar name={ch.name} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-text-primary truncate">
                #{ch.name}
              </span>
              <span className="text-[10px] text-text-tertiary whitespace-nowrap">
                {formatDistanceToNow(new Date(ch.lastMessage.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-xs text-text-secondary truncate mt-0.5">
              {ch.lastMessage.textContent.slice(0, 80)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
