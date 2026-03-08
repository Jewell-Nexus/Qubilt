import { useState } from 'react';
import { X, Hash, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCreateChannel } from '../hooks/use-chat-queries';
import { getChatSocket } from '../lib/chat-socket';
import type { ChannelType } from '../types/chat.types';

interface CreateChannelModalProps {
  workspaceId: string;
  onClose: () => void;
  onCreated: (channelId: string) => void;
}

export default function CreateChannelModal({ workspaceId, onClose, onCreated }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChannelType>('PUBLIC');
  const createChannel = useCreateChannel();

  const slugifiedName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugifiedName) return;

    try {
      const res = await createChannel.mutateAsync({
        workspaceId,
        name: slugifiedName,
        description: description || undefined,
        type,
      });

      // Join the socket room for this new channel
      const socket = getChatSocket();
      if (socket?.connected) {
        socket.emit('channel:join', { channelId: res.data.id });
      }

      onCreated(res.data.id);
      onClose();
    } catch {
      // Error handled by react-query
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-surface-overlay border border-border-default rounded-xl shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Create Channel</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover text-text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel type */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('PUBLIC')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm flex-1',
                type === 'PUBLIC'
                  ? 'border-accent-default bg-accent-subtle text-accent-default'
                  : 'border-border-default text-text-secondary hover:bg-surface-hover',
              )}
            >
              <Hash className="w-4 h-4" />
              Public
            </button>
            <button
              type="button"
              onClick={() => setType('PRIVATE')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm flex-1',
                type === 'PRIVATE'
                  ? 'border-accent-default bg-accent-subtle text-accent-default'
                  : 'border-border-default text-text-secondary hover:bg-surface-hover',
              )}
            >
              <Lock className="w-4 h-4" />
              Private
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. project-updates"
              className="w-full px-3 py-2 rounded-lg border border-border-default bg-surface-default text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-default"
              autoFocus
            />
            {slugifiedName && slugifiedName !== name && (
              <p className="text-xs text-text-tertiary mt-1">Will be created as #{slugifiedName}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description <span className="text-text-tertiary font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              className="w-full px-3 py-2 rounded-lg border border-border-default bg-surface-default text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-default"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!slugifiedName || createChannel.isPending}
              className="px-4 py-2 text-sm text-white bg-[color:var(--module-chat-accent,#10B981)] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createChannel.isPending ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
