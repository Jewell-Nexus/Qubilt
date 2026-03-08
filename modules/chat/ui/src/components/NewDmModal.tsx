import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useWorkspaceUsers, useFindOrCreateDm } from '../hooks/use-chat-queries';
import { getChatSocket } from '../lib/chat-socket';
import UserAvatar from './UserAvatar';

interface NewDmModalProps {
  workspaceId: string;
  onClose: () => void;
  onCreated: (channelId: string) => void;
}

export default function NewDmModal({ workspaceId, onClose, onCreated }: NewDmModalProps) {
  const [search, setSearch] = useState('');
  const { data: users, isLoading } = useWorkspaceUsers(workspaceId);
  const findOrCreateDm = useFindOrCreateDm(workspaceId);

  const filtered = users?.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = async (userId: string) => {
    try {
      const res = await findOrCreateDm.mutateAsync(userId);
      const socket = getChatSocket();
      if (socket?.connected) {
        socket.emit('channel:join', { channelId: res.data.id });
      }
      onCreated(res.data.id);
      onClose();
    } catch {
      // handled by react-query
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-surface-overlay border border-border-default rounded-xl shadow-lg w-full max-w-sm p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">New Direct Message</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover text-text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-default bg-surface-default text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-default"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {filtered?.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user.id)}
              disabled={findOrCreateDm.isPending}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-surface-hover text-left"
            >
              <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
              <div className="min-w-0">
                <p className="text-sm text-text-primary truncate">{user.displayName}</p>
                <p className="text-xs text-text-tertiary truncate">{user.email}</p>
              </div>
            </button>
          ))}
          {filtered?.length === 0 && !isLoading && (
            <p className="text-sm text-text-tertiary text-center py-4">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
}
